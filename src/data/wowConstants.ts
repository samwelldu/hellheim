export const WOW_CONSTANTS = {
    CURRENT_EXPANSION: 'The War Within',
    CURRENT_SEASON: 1,
    RAIDS: {
        NERUBAR_PALACE: {
            id: 1296,
            name: 'Nerub-ar Palace',
            bossCount: 8
        },
        LIBERATION_OF_UNDERMINE: {
            id: 1350, // Planned for Season 2
            name: 'Liberation of Undermine',
            bossCount: 8
        }
    },
    REGIONS: ['us', 'eu'] as const,
    FALLBACK_REGION: 'us' as const
};

export type WoWRegion = typeof WOW_CONSTANTS.REGIONS[number];
