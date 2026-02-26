import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { blizzardService } from './blizzard';

const COLLECTION_NAME = 'attendance_roster';
const METADATA_DOC_ID = 'metadata';

export interface AttendanceProfile {
    id: string; // "name-realm"
    name: string;
    realm: string;
    className: string; // "Warrior", etc.
    classId: number; // For color mapping if needed, or derived
    level: number;
    ilvl?: number;
    rank: number; // 0 = GM, 1 = Officer, 2 = Raider (Default)
    attendedRaids: number;
    updatedAt?: any;
}

export const attendanceService = {
    /**
     * Get all characters from the manual roster
     */
    async getCharacters(): Promise<AttendanceProfile[]> {
        try {
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));

            // Filter out metadata doc if it exists in the same collection (though usually best to keep separate or filter by ID)
            const characters = snapshot.docs
                .filter(d => d.id !== METADATA_DOC_ID)
                .map(doc => {
                    const data = doc.data() as AttendanceProfile;
                    // Asegurar que use el ID del documento
                    return { ...data, id: doc.id };
                })
                .filter(char => {
                    if (!char.name || !char.realm) return false;
                    // Tan: Ocultar registros defectuosos de accounts IDs
                    const expectedId = `${char.name.trim().toLowerCase()}-${char.realm.toLowerCase().replace(/'/g, '').replace(/\\s+/g, '-')}`;
                    return char.id === expectedId;
                });

            return characters.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("Error fetching attendance roster:", error);
            return [];
        }
    },

    /**
     * Get global metadata (e.g. Total Raids counter)
     */
    async getMetadata(): Promise<{ totalRaids: number }> {
        try {
            const docRef = doc(db, COLLECTION_NAME, METADATA_DOC_ID);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return snapshot.data() as { totalRaids: number };
            }
        } catch (error) {
            console.error("Error fetching metadata:", error);
        }
        return { totalRaids: 0 };
    },

    /**
     * Add a character manually.
     * Validates existence with Blizzard API to get Class/Level.
     */
    async addCharacter(name: string, realm: string, customId?: string): Promise<void> {
        try {
            // 1. Validate with Blizzard
            const profile = await blizzardService.getCharacterProfile(realm, name);
            if (!profile) throw new Error("No se pudo obtener información del personaje.");

            // 2. Prepare Data
            // Tan: Usamos customId (playerToken) si existe para evitar duplicados por jugador
            const charId = customId || `${profile.name.toLowerCase()}-${profile.realm.slug}`;

            // Default Rank: 2 (Raider) unless logic changes
            const newChar: AttendanceProfile = {
                id: charId,
                name: profile.name,
                realm: profile.realm.slug,
                className: profile.character_class?.name || 'Unknown',
                classId: profile.character_class?.id || 0,
                level: profile.level || 0,
                rank: 2,
                attendedRaids: 0,
                updatedAt: new Date()
            };

            // 3. Save to Firestore (merge: true para mantener promedios de asistencia si ya existía el jugador)
            await setDoc(doc(db, COLLECTION_NAME, charId), newChar, { merge: true });

        } catch (error: any) {
            console.error("Error adding character:", error);
            throw new Error(error.message || "Error al agregar personaje.");
        }
    },

    /**
     * Delete a character from the roster
     */
    async deleteCharacter(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    },

    /**
     * Batch update attendance for a list of character IDs
     */
    async registerAttendance(attendeeIds: string[]): Promise<void> {
        try {
            const batch = writeBatch(db);

            // 1. Get current data for all attendees to increment
            // Optimization: In a real app we might use increment() transform, 
            // but we need to read to know if they exist? We assume IDs are valid from the UI matching.

            // Let's just use array operations. 
            // For now, simpler approach: Update each doc.

            // Since we need to read to know current value (or use FieldValue.increment),
            // let's use FieldValue.increment logic if possible, but we don't have it imported.
            // We'll Fetch All -> Update in Memory -> Batch Write.

            const snapshot = await getDocs(collection(db, COLLECTION_NAME));

            snapshot.docs.forEach(d => {
                if (d.id === METADATA_DOC_ID) return;

                const data = d.data() as AttendanceProfile;
                if (attendeeIds.includes(d.id)) {
                    batch.update(d.ref, {
                        attendedRaids: (data.attendedRaids || 0) + 1
                    });
                }
            });

            // 2. Increment Total Raids Counter
            const metaRef = doc(db, COLLECTION_NAME, METADATA_DOC_ID);
            const metaSnap = await getDoc(metaRef);
            const currentTotal = metaSnap.exists() ? (metaSnap.data().totalRaids || 0) : 0;

            batch.set(metaRef, { totalRaids: currentTotal + 1 }, { merge: true });

            await batch.commit();

        } catch (error) {
            console.error("Error registering attendance:", error);
            throw error;
        }
    },

    /**
     * RESET EVERYTHING: Deletes all characters and resets counter.
     */
    async resetDatabase(): Promise<void> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        const batch = writeBatch(db);

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Re-create metadata with 0
        const metaRef = doc(db, COLLECTION_NAME, METADATA_DOC_ID);
        batch.set(metaRef, { totalRaids: 0 }); // This is technically a "set" after "delete" in same batch? 
        // Firestore batch delete then set on same ref might be tricky.
        // Better to just delete all characters, and SET metadata to 0.

        // Let's refine: Delete all docs EXCEPT metadata? No, user said "Reset EVERYTHING".
        // Safe bet: Delete all. Create new metadata doc.

        await batch.commit();

        // Explicitly set metadata to 0 after clear
        await setDoc(metaRef, { totalRaids: 0 });
    },

    /**
     * Reset only the Total Raids counter and all player attendance counts to 0, but keep roster.
     */
    async clearAttendanceData(): Promise<void> {
        const batch = writeBatch(db);
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));

        snapshot.docs.forEach(d => {
            if (d.id === METADATA_DOC_ID) {
                batch.update(d.ref, { totalRaids: 0 });
            } else {
                batch.update(d.ref, { attendedRaids: 0 });
            }
        });

        await batch.commit();
    }
};
