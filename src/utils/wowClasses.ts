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

const CLASS_ALIASES: Record<string, WowClass> = {
    'Caballero de la Muerte': 'Death Knight',
    'Cazador de demonios': 'Demon Hunter',
    'Cazador de Demonios': 'Demon Hunter',
    'Druida': 'Druid',
    'Evocador': 'Evoker',
    'Cazador': 'Hunter',
    'Mago': 'Mage',
    'Monje': 'Monk',
    'Paladín': 'Paladin',
    'Sacerdote': 'Priest',
    'Pícaro': 'Rogue',
    'Chamán': 'Shaman',
    'Brujo': 'Warlock',
    'Guerrero': 'Warrior',
};

export const getClassColor = (className: string): string => {
    // Tan: Normalizamos nombres de clase en inglés o español devueltos por la API de Blizzard en otros idiomas
    const normalizedName = CLASS_ALIASES[className] || className;
    return CLASS_COLORS[normalizedName as WowClass] || '#FFFFFF'; // Default to white
};
