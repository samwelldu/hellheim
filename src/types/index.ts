export type Role = 'Tank' | 'Healer' | 'DPS';
export type ClassName = 'Warrior' | 'Paladin' | 'Hunter' | 'Rogue' | 'Priest' | 'DeathKnight' | 'Shaman' | 'Mage' | 'Warlock' | 'Monk' | 'Druid' | 'DemonHunter' | 'Evoker';

export interface Character {
    id: string;
    name: string;
    class: ClassName;
    role: Role;
    apiId?: string; // Blizzard API ID
}

export interface MythicRun {
    id: string;
    characterId: string;
    dungeonName: string;
    level: number;
    completedAt: Date;
    affixes: string[];
}

export interface RaidProgress {
    id: string;
    characterId: string;
    raidName: string; // e.g., "Nerub-ar Palace"
    bossesKilled: number;
    totalBosses: number;
    difficulty: 'Normal' | 'Heroic' | 'Mythic';
    updatedAt: Date;
}

export interface QuotaStatus {
    id: string;
    characterId: string;
    weekId: string; // e.g., "2026-W10"
    status: 'Paid' | 'Pending' | 'Exempt';
    amount: number;
    type: 'Gold' | 'Mats';
}

export interface AttendanceRecord {
    id: string;
    raidEventId: string;
    characterId: string;
    status: 'Present' | 'Late' | 'Absent' | 'Bench';
    timestamp: Date;
}

export interface RaidEvent {
    id: string;
    title: string;
    date: Date;
    difficulty: 'Normal' | 'Heroic' | 'Mythic';
    description?: string;
    signups: {
        characterId: string;
        role: Role;
        status: 'Accepted' | 'Declined' | 'Tentative';
    }[];
}
