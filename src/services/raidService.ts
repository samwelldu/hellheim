import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface RaidBoss {
    name: string;
    isKilled: boolean;
}

export interface RaidDifficultyProgress {
    bossesKilled: number;
    totalBosses: number;
    difficulty: 'Normal' | 'Heroic' | 'Mythic';
}

export interface CharacterRaidProgress {
    id: string;
    name: string;
    realm: string;
    className: string;
    spec: string;
    ilvl: number;
    raids: {
        [raidName: string]: {
            Normal?: RaidDifficultyProgress;
            Heroic?: RaidDifficultyProgress;
            Mythic?: RaidDifficultyProgress;
        };
    };
    updatedAt?: any;
}

const COLLECTION_NAME = 'raid_progress';

export const raidService = {
    async getAllProgress(): Promise<CharacterRaidProgress[]> {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));

        if (snapshot.empty) {
            return MOCK_RAID_DATA;
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CharacterRaidProgress));
    }
};

// MOCK DATA FOR DEMONSTRATION
const MOCK_RAID_DATA: CharacterRaidProgress[] = [
    {
        id: '1',
        name: 'Sylvanas',
        realm: 'QuelThalas',
        className: 'Hunter',
        spec: 'Marksmanship',
        ilvl: 615,
        raids: {
            "Palace of Nerub'ar": {
                "Normal": { bossesKilled: 8, totalBosses: 8, difficulty: 'Normal' },
                "Heroic": { bossesKilled: 4, totalBosses: 8, difficulty: 'Heroic' }
            }
        }
    },
    {
        id: '2',
        name: 'Thrall',
        realm: 'Ragnaros',
        className: 'Shaman',
        spec: 'Enhancement',
        ilvl: 610,
        raids: {
            "Palace of Nerub'ar": {
                "Normal": { bossesKilled: 8, totalBosses: 8, difficulty: 'Normal' },
                "Heroic": { bossesKilled: 2, totalBosses: 8, difficulty: 'Heroic' }
            }
        }
    },
    {
        id: '3',
        name: 'Anduin',
        realm: 'Proudmoore',
        className: 'Priest',
        spec: 'Holy',
        ilvl: 612,
        raids: {
            "Palace of Nerub'ar": {
                "Normal": { bossesKilled: 8, totalBosses: 8, difficulty: 'Normal' },
                "Heroic": { bossesKilled: 8, totalBosses: 8, difficulty: 'Heroic' },
                "Mythic": { bossesKilled: 1, totalBosses: 8, difficulty: 'Mythic' }
            }
        }
    },
    {
        id: '4',
        name: 'Illidan',
        realm: 'Illidan',
        className: 'Demon Hunter',
        spec: 'Havoc',
        ilvl: 620,
        raids: {
            "Palace of Nerub'ar": {
                "Normal": { bossesKilled: 8, totalBosses: 8, difficulty: 'Normal' },
                "Heroic": { bossesKilled: 8, totalBosses: 8, difficulty: 'Heroic' },
                "Mythic": { bossesKilled: 3, totalBosses: 8, difficulty: 'Mythic' }
            }
        }
    }
];
