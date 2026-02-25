export interface Dungeon {
    id: string;
    name: string;
    shortName: string;
    image?: string; // Placeholder for future images
}

export const DUNGEONS: Dungeon[] = [
    { id: 'ara-kara', name: 'Ara-Kara, City of Echoes', shortName: 'Ara-Kara' },
    { id: 'city-of-threads', name: 'City of Threads', shortName: 'Threads' },
    { id: 'the-stonevault', name: 'The Stonevault', shortName: 'Stonevault' },
    { id: 'the-dawnbreaker', name: 'The Dawnbreaker', shortName: 'Dawnbreaker' },
    { id: 'mists-of-tirna-scithe', name: 'Mists of Tirna Scithe', shortName: 'Mists' },
    { id: 'the-necrotic-wake', name: 'The Necrotic Wake', shortName: 'Necrotic' },
    { id: 'siege-of-boralus', name: 'Siege of Boralus', shortName: 'Siege' },
    { id: 'grim-batol', name: 'Grim Batol', shortName: 'Grim Batol' },
];
