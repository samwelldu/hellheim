import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, runTransaction, where, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { QuotaRecord } from '../utils/luaParser';

const UPLOADS_COLLECTION = 'quota_uploads';
const QUOTES_COLLECTION = 'quote';

export const quotaService = {
    /**
     * Uploads records.
     * 1. Checks if record's HASH exists in 'quota_uploads'.
     * 2. If NEW:
     *    - Saves to 'quota_uploads' (audit trail).
     *    - Increments 'amount' in 'quote' collection (aggregated balance).
     */
    async uploadQuota(records: QuotaRecord[]): Promise<{ uploaded: number; duplicates: number }> {
        let uploaded = 0;
        let duplicates = 0;

        for (const record of records) {
            try {
                const result = await runTransaction(db, async (transaction) => {
                    const uploadRef = doc(db, UPLOADS_COLLECTION, record.hash);

                    // Tan: Resolución de Identidad (Personaje -> PlayerToken)
                    // Aseguramos que la lógica de normalización de IDs sea consistente (eliminando apóstrofes)
                    const charMappingId = record.name.toLowerCase().trim().replace(/'/g, '').replace(/\s+/g, '-');
                    const mappingSnap = await transaction.get(doc(db, 'character_mapping', charMappingId));

                    // Si encontramos un mapeo, usamos el playerToken, si no, el ID normalizado del personaje
                    const registryId = mappingSnap.exists() ? mappingSnap.data().playerToken : charMappingId;
                    const quoteRef = doc(db, QUOTES_COLLECTION, registryId);

                    // READS FIRST
                    const uploadSnap = await transaction.get(uploadRef);
                    const quoteSnap = await transaction.get(quoteRef);

                    // LOGIC
                    if (uploadSnap.exists() && uploadSnap.data().aggregated) {
                        return 'duplicate';
                    }

                    // Tan: Determinamos si es Huérfano
                    const isOrphan = !mappingSnap.exists();

                    // WRITES
                    const uploadData = uploadSnap.exists() ? uploadSnap.data() : { uploadedAt: new Date() };

                    transaction.set(uploadRef, {
                        ...record,
                        uploadedAt: uploadData.uploadedAt,
                        status: isOrphan ? 'pending-review' : 'verified',
                        aggregated: !isOrphan, // Solo agregamos si NO es huérfano
                        assignedTo: registryId,
                        isOrphan: isOrphan
                    }, { merge: true });

                    // Si es huérfano, no tocamos la colección 'quote' todavía
                    if (isOrphan) return 'uploaded';

                    // 2. Aggregate to 'quote' collection (Solo para identificados)
                    let newAmount = record.amount;
                    let displayName = record.name;

                    if (quoteSnap.exists()) {
                        const currentData = quoteSnap.data();
                        newAmount = (currentData.amount || 0) + record.amount;
                        displayName = currentData.name || record.name;
                    }

                    transaction.set(quoteRef, {
                        name: displayName,
                        amount: newAmount,
                        lastUpdated: new Date(),
                        isPlayerToken: true
                    }, { merge: true });

                    return 'uploaded';
                });

                if (result === 'uploaded') {
                    uploaded++;
                } else {
                    duplicates++;
                }

            } catch (error) {
                console.error("Error processing transaction for record:", record.hash, error);
            }
        }

        return { uploaded, duplicates };
    },

    /**
     * Tan: Recupera registros que no pertenecen a ninguna identidad.
     */
    async getOrphanRecords(): Promise<(QuotaRecord & { status: string; id: string })[]> {
        const q = query(
            collection(db, UPLOADS_COLLECTION),
            where('isOrphan', '==', true),
            where('status', '==', 'pending-review')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as any));
    },

    /**
     * Tan: "Devolver Oro" - Simplemente anula el registro huérfano.
     */
    async returnOrphanGold(hash: string): Promise<void> {
        await updateDoc(doc(db, UPLOADS_COLLECTION, hash), {
            status: 'returned',
            aggregated: false,
            updatedAt: new Date()
        });
    },

    /**
     * Tan: "Traspasar Oro" - Acredita un registro huérfano a un PlayerToken.
     */
    async transferOrphanGold(hash: string, targetPlayerToken: string): Promise<void> {
        await runTransaction(db, async (transaction) => {
            const uploadRef = doc(db, UPLOADS_COLLECTION, hash);
            const quoteRef = doc(db, QUOTES_COLLECTION, targetPlayerToken);

            const uploadSnap = await transaction.get(uploadRef);
            const quoteSnap = await transaction.get(quoteRef);

            if (!uploadSnap.exists() || uploadSnap.data().status !== 'pending-review') {
                throw new Error("Registro no disponible para traspaso.");
            }

            const amount = uploadSnap.data().amount || 0;
            const currentAmount = quoteSnap.exists() ? (quoteSnap.data().amount || 0) : 0;

            // 1. Marcar como traspasado
            transaction.update(uploadRef, {
                status: 'transferred',
                aggregated: true,
                assignedTo: targetPlayerToken,
                updatedAt: new Date()
            });

            // 2. Sumar al balance del jugador destino
            transaction.set(quoteRef, {
                amount: currentAmount + amount,
                lastUpdated: new Date()
            }, { merge: true });
        });
    },

    /**
     * Fetches the aggregated quota leaderboard.
     * Ordered by Amount DESC.
     */
    async getQuotaRanking(): Promise<{ name: string; amount: number; isPlayerToken?: boolean; id: string }[]> {
        const q = query(
            collection(db, QUOTES_COLLECTION),
            orderBy('amount', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name as string,
            amount: doc.data().amount as number,
            isPlayerToken: doc.data().isPlayerToken
        }));
    },

    /**
     * Tan: Recupera el mapeo de identidades para saber a qué playerToken pertenece cada alter
     */
    async getCharacterMappings(): Promise<{ id: string; playerToken: string }[]> {
        const snapshot = await getDocs(collection(db, 'character_mapping'));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            playerToken: doc.data().playerToken
        }));
    },

    /**
     * Sets the global Raid Quota value.
     * @param amountGold Amount in GOLD. Converted to copper (x10000).
     */
    async setRaidQuota(amountGold: number): Promise<void> {
        const configRef = doc(db, 'config', 'raid_quota');
        await setDoc(configRef, {
            amount: amountGold * 10000, // Store in copper
            updatedAt: new Date()
        });
    },

    /**
     * Gets the current Raid Quota value in Copper.
     */
    async getRaidQuota(): Promise<number> {
        const configRef = doc(db, 'config', 'raid_quota');
        const snap = await getDoc(configRef);
        return snap.exists() ? snap.data().amount : 0;
    },

    /**
     * Applies the FULL discount to all users in the quote collection.
     * Subtracts the current Raid Quota from every user's balance.
     */
    async applyRaidQuotaDiscount(): Promise<number> {
        const quotaAmount = await this.getRaidQuota();
        if (quotaAmount <= 0) return 0;

        const q = query(collection(db, QUOTES_COLLECTION));
        const snapshot = await getDocs(q);
        let processed = 0;

        const chunks = [];
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += 500) {
            chunks.push(docs.slice(i, i + 500));
        }

        for (const chunk of chunks) {
            await runTransaction(db, async (transaction) => {
                for (const userDoc of chunk) {
                    const currentAmount = userDoc.data().amount || 0;
                    const newAmount = currentAmount - quotaAmount;
                    transaction.update(userDoc.ref, {
                        amount: newAmount,
                        lastUpdated: new Date()
                    });
                }
            });
            processed += chunk.length;
        }

        return processed;
    },

    /**
     * Tan: Purga Total de Tesorería.
     * Elimina TODOS los registros de balances ('quote') y auditorías ('quota_uploads').
     * Solo debe ser invocado por administradores.
     */
    async purgeAllQuotaData(): Promise<void> {
        const collectionsToPurge = [QUOTES_COLLECTION, UPLOADS_COLLECTION];

        for (const colName of collectionsToPurge) {
            const q = query(collection(db, colName));
            const snapshot = await getDocs(q);

            // Delete in batches of 500 (Firestore limit)
            const docs = snapshot.docs;
            for (let i = 0; i < docs.length; i += 500) {
                const batch = docs.slice(i, i + 500);
                await runTransaction(db, async (transaction) => {
                    for (const docSnap of batch) {
                        transaction.delete(docSnap.ref);
                    }
                });
            }
        }
    }
};
