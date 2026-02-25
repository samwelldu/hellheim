import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface MythicRules {
    requiredSlots: number; // 1, 2, or 3
    levelSlot1: number;
    levelSlot2: number;
    levelSlot3: number;
    lastUpdated?: Date;
}

const CONFIG_COLLECTION = 'config';
const DOC_ID = 'mythic_rules';

export const mythicRulesService = {
    async getRules(): Promise<MythicRules> {
        const docRef = doc(db, CONFIG_COLLECTION, DOC_ID);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            return snapshot.data() as MythicRules;
        }

        // Default rules if none exist
        return {
            requiredSlots: 1,
            levelSlot1: 2,
            levelSlot2: 2,
            levelSlot3: 2
        };
    },

    async saveRules(rules: MythicRules): Promise<void> {
        const docRef = doc(db, CONFIG_COLLECTION, DOC_ID);
        await setDoc(docRef, {
            ...rules,
            lastUpdated: new Date()
        });
    }
};
