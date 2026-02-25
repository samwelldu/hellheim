export type WowClass =
    | 'Death Knight' | 'Demon Hunter' | 'Druid' | 'Evoker' | 'Hunter'
    | 'Mage' | 'Monk' | 'Paladin' | 'Priest' | 'Rogue'
    | 'Shaman' | 'Warlock' | 'Warrior';

export const CLASS_COLORS: Record<WowClass, string> = {
    'Death Knight': '#C41F3B',
    'Demon Hunter': '#A330C9',
    'Druid': '#FF7D0A',
    'Evoker': '#33937F',
    'Hunter': '#ABD473',
    'Mage': '#40C7EB',
    'Monk': '#00FF96',
    'Paladin': '#F58CBA',
    'Priest': '#FFFFFF',
    'Rogue': '#FFF569',
    'Shaman': '#0070DE',
    'Warlock': '#8787ED',
    'Warrior': '#C79C6E'
};

export const getClassColor = (className: string): string => {
    return CLASS_COLORS[className as WowClass] || '#FFFFFF'; // Default to white
};
