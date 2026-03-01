import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, runTransaction, where, updateDoc, deleteDoc } from 'firebase/firestore';
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

        // Tan: Pre-cargar catálogo de identidades para emparejamiento inteligente de alters (sin reino)
        const mappingsSnap = await getDocs(collection(db, 'character_mapping'));
        const identityMapList = mappingsSnap.docs.map(doc => ({
            id: doc.id,
            playerToken: doc.data().playerToken
        }));

        for (const record of records) {
            try {
                const result = await runTransaction(db, async (transaction) => {
                    const uploadRef = doc(db, UPLOADS_COLLECTION, record.hash);

                    // Tan: Resolución Inteligente (El AddOn no da el server, Firestore sí "nombre-reino")
                    const simpleName = record.name.toLowerCase().trim().replace(/'/g, '').replace(/\s+/g, '-');

                    // Buscamos si existe alguna identidad que comience con ese nombre + un guión
                    // Ej: "altersito" -> "altersito-quelthalas"
                    const foundIdentity = identityMapList.find(m => m.id.startsWith(`${simpleName}-`) || m.id === simpleName);

                    // Si encontramos un mapeo, usamos el playerToken, si no, el ID simple del personaje
                    const registryId = foundIdentity ? foundIdentity.playerToken : simpleName;
                    const quoteRef = doc(db, QUOTES_COLLECTION, registryId);

                    // READS FIRST
                    const uploadSnap = await transaction.get(uploadRef);
                    const quoteSnap = await transaction.get(quoteRef);

                    // LOGIC
                    if (uploadSnap.exists() && uploadSnap.data().aggregated) {
                        return 'duplicate';
                    }

                    // Tan: Determinamos si es Huérfano
                    const isOrphan = !foundIdentity;

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
     * Comprueba si hay registros de asistencia en cola listos para ser descontados.
     */
    async hasPendingRaidDiscount(): Promise<boolean> {
        const pendingSnap = await getDoc(doc(db, 'config', 'pending_raid_discount'));
        if (!pendingSnap.exists()) return false;
        const attendeeIds = pendingSnap.data().attendeeIds;
        return Array.isArray(attendeeIds) && attendeeIds.length > 0;
    },

    /**
     * Tan: Recupera la lista de nombres de personajes que están en la cola de cobro.
     */
    async getPendingRaidAttendees(): Promise<string[]> {
        const pendingSnap = await getDoc(doc(db, 'config', 'pending_raid_discount'));
        if (!pendingSnap.exists()) return [];
        return pendingSnap.data().attendeeIds || [];
    },

    /**
     * Applies the FULL discount to users that attended the latest raid.
     * Subtracts the current Raid Quota from every attendee's balance.
     */
    async applyRaidQuotaDiscount(): Promise<number> {
        const quotaAmount = await this.getRaidQuota();
        if (quotaAmount <= 0) return 0;

        // Tan: 1. Leer los asistentes pendientes de cobro
        const pendingDiscountRef = doc(db, 'config', 'pending_raid_discount');
        const pendingSnap = await getDoc(pendingDiscountRef);

        if (!pendingSnap.exists() || !pendingSnap.data().attendeeIds || pendingSnap.data().attendeeIds.length === 0) {
            throw new Error("No hay registros de Asistencia pendientes de descontar.");
        }

        const attendeeIds: string[] = pendingSnap.data().attendeeIds;

        // Tan: 2. Resolver playerTokens (un token puede tener múltiples alters que asistieron o solo el main)
        const mappingsSnap = await getDocs(collection(db, 'character_mapping'));
        const identityMapList = mappingsSnap.docs.map(d => ({
            id: d.id,
            playerToken: d.data().playerToken
        }));

        // Usamos un Set para no cobrarle doble la cuota a la misma persona si fue con dos personajes a la misma raid (raro, pero posible en splits)
        const tokensToCharge = new Set<string>();

        attendeeIds.forEach(charId => {
            const foundIdentity = identityMapList.find(m => m.id === charId.toLowerCase().trim());
            if (foundIdentity && foundIdentity.playerToken) {
                tokensToCharge.add(foundIdentity.playerToken);
            } else {
                // Si no tiene token mapeado, se le cobra directamente al ID crudo (caso legacy)
                tokensToCharge.add(charId);
            }
        });

        const targetsArray = Array.from(tokensToCharge);
        if (targetsArray.length === 0) return 0;

        // Tan: 3. Aplicar descuentos por lotes
        let processed = 0;
        const chunks = [];
        for (let i = 0; i < targetsArray.length; i += 500) {
            chunks.push(targetsArray.slice(i, i + 500));
        }

        for (const chunk of chunks) {
            await runTransaction(db, async (transaction) => {
                for (const tokenId of chunk) {
                    const userRef = doc(db, QUOTES_COLLECTION, tokenId);
                    const userSnap = await transaction.get(userRef);

                    if (userSnap.exists()) {
                        const currentAmount = userSnap.data().amount || 0;
                        const newAmount = currentAmount - quotaAmount;
                        transaction.update(userRef, {
                            amount: newAmount,
                            lastUpdated: new Date()
                        });
                    } else {
                        // Si el usuario no existe en la tesorería, le creamos la deuda inicial en negativo
                        transaction.set(userRef, {
                            name: tokenId,
                            amount: -quotaAmount,
                            lastUpdated: new Date()
                        });
                    }
                }
            });
            processed += chunk.length;
        }

        // Tan: 4. Eliminar el borrador de cobro para evitar doble descuento accidental
        await deleteDoc(pendingDiscountRef);

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
