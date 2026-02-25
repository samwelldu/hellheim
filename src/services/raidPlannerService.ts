import { db } from '../config/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'raid_compositions';

export interface RaidSlot {
    position: number; // 0-19
    characterId: string | null;
    characterName?: string;
    characterClass?: string;
    spec?: string; // New: Selected Specialization
    role: 'tank' | 'healer' | 'melee' | 'ranged' | null;
    group: number; // 1-4
}

export interface RaidComposition {
    id: string;
    name: string;
    createdAt: Date;
    slots: RaidSlot[];
}

export const raidPlannerService = {
    /**
     * Save a new composition or update existing one
     */
    async saveComposition(comp: RaidComposition): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, comp.id);
            // Convert Date to Timestamp for Firestore if needed, or let SDK handle it.
            // Explicit conversion is safer.
            const dataToSave = {
                ...comp,
                createdAt: Timestamp.fromDate(comp.createdAt)
            };
            await setDoc(docRef, dataToSave);
        } catch (error) {
            console.error("Error saving composition:", error);
            throw error;
        }
    },

    /**
     * Get all saved compositions
     */
    async getCompositions(): Promise<RaidComposition[]> {
        try {
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            return snapshot.docs.map(d => {
                const data = d.data();
                return {
                    ...data,
                    createdAt: (data.createdAt as Timestamp).toDate()
                } as RaidComposition;
            });
        } catch (error) {
            console.error("Error fetching compositions:", error);
            throw error;
        }
    },

    /**
     * Delete a composition
     */
    async deleteComposition(id: string): Promise<void> {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting composition:", error);
            throw error;
        }
    }
};
