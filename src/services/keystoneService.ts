import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Keystone {
    userId: string;
    userAlias: string;
    dungeonId: string;
    level: number;
    timestamp: Date;
}

const COLLECTION_NAME = 'keystones';

export const keystoneService = {
    // Get all keystones (can filter by week later)
    async getAllKeystones(): Promise<Keystone[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                userId: doc.id, // We use userId as Doc ID to ensure 1 key per person
                ...data,
                timestamp: data.timestamp?.toDate()
            } as Keystone;
        });
    },

    // Set (Create/Update) a user's keystone
    async setKeystone(userId: string, userAlias: string, dungeonId: string, level: number): Promise<void> {
        const data = {
            userAlias,
            dungeonId,
            level,
            timestamp: new Date()
        };
        // Using userId as document ID ensures one key per user. 
        // If they get a new key, it overwrites the old one. Simple.
        await setDoc(doc(db, COLLECTION_NAME, userId), data);
    },

    // Delete a keystone (e.g. if depleted/changed mind? or resetting)
    async deleteKeystone(userId: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTION_NAME, userId));
    },

    // Future: Function to clear ALL keys (Weekly Reset)
    // This would likely be an Admin-only button or a scheduled Cloud Function
};
