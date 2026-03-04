export interface TanEspecialidad {
    id: string;
    nombre: string;
    icono: string;
}

export interface TanClaseInfo {
    id: string;
    nombre: string;
    colorHex: string;
    colorTailwind: string;
    icono: string;
    especialidades: TanEspecialidad[];
}

// Tan: Hija mía, aquí guardamos los datos de las clases de World of Warcraft.
// Usaremos estos datos para que la gente pueda seleccionar su monito favorito y buscar sus guías
export const TanCatalogoClases: TanClaseInfo[] = [
    {
        id: "death-knight",
        nombre: "Caballero de la Muerte",
        colorHex: "#C41E3A",
        colorTailwind: "text-[#C41E3A]",
        icono: "spell_deathknight_classicon",
        especialidades: [
            { id: "blood", nombre: "Sangre", icono: "spell_deathknight_bloodpresence" },
            { id: "frost", nombre: "Escarcha", icono: "spell_deathknight_frostpresence" },
            { id: "unholy", nombre: "Profano", icono: "spell_deathknight_unholypresence" }
        ]
    },
    {
        id: "demon-hunter",
        nombre: "Cazador de Demonios",
        colorHex: "#A330C9",
        colorTailwind: "text-[#A330C9]",
        icono: "classicon_demonhunter",
        especialidades: [
            { id: "havoc", nombre: "Devastación", icono: "ability_demonhunter_specdps" },
            { id: "vengeance", nombre: "Venganza", icono: "ability_demonhunter_spectank" },
            { id: "devourer", nombre: "Devourer", icono: "classicon_demonhunter_void_64" }
        ]
    },
    {
        id: "druid",
        nombre: "Druida",
        colorHex: "#FF7C0A",
        colorTailwind: "text-[#FF7C0A]",
        icono: "classicon_druid",
        especialidades: [
            { id: "balance", nombre: "Equilibrio", icono: "spell_nature_starfall" },
            { id: "feral", nombre: "Feral", icono: "ability_druid_catform" },
            { id: "guardian", nombre: "Guardián", icono: "ability_racial_bearform" },
            { id: "restoration", nombre: "Restauración", icono: "spell_nature_healingtouch" }
        ]
    },
    {
        id: "evoker",
        nombre: "Evocador",
        colorHex: "#33937F",
        colorTailwind: "text-[#33937F]",
        icono: "classicon_evoker",
        especialidades: [
            { id: "augmentation", nombre: "Aumento", icono: "classicon_evoker_augmentation" },
            { id: "devastation", nombre: "Devastación", icono: "classicon_evoker_devastation" },
            { id: "preservation", nombre: "Preservación", icono: "classicon_evoker_preservation" }
        ]
    },
    {
        id: "hunter",
        nombre: "Cazador",
        colorHex: "#ABD473",
        colorTailwind: "text-[#ABD473]",
        icono: "classicon_hunter",
        especialidades: [
            { id: "beast-mastery", nombre: "Bestias", icono: "ability_hunter_bestialdiscipline" },
            { id: "marksmanship", nombre: "Puntería", icono: "ability_hunter_focusedaim" },
            { id: "survival", nombre: "Supervivencia", icono: "ability_hunter_camouflage" }
        ]
    },
    {
        id: "mage",
        nombre: "Mago",
        colorHex: "#3FC7EB",
        colorTailwind: "text-[#3FC7EB]",
        icono: "classicon_mage",
        especialidades: [
            { id: "arcane", nombre: "Arcano", icono: "spell_holy_magicalsentry" },
            { id: "fire", nombre: "Fuego", icono: "spell_fire_firebolt02" },
            { id: "frost", nombre: "Escarcha", icono: "spell_frost_frostbolt02" }
        ]
    },
    {
        id: "monk",
        nombre: "Monje",
        colorHex: "#00FF96",
        colorTailwind: "text-[#00FF96]",
        icono: "classicon_monk",
        especialidades: [
            { id: "brewmaster", nombre: "Maestro Cervecero", icono: "spell_monk_brewmaster_spec" },
            { id: "mistweaver", nombre: "Tejedor de Niebla", icono: "spell_monk_mistweaver_spec" },
            { id: "windwalker", nombre: "Viajero del Viento", icono: "spell_monk_windwalker_spec" }
        ]
    },
    {
        id: "paladin",
        nombre: "Paladín",
        colorHex: "#F58CBA",
        colorTailwind: "text-[#F58CBA]",
        icono: "classicon_paladin",
        especialidades: [
            { id: "holy", nombre: "Sagrado", icono: "spell_holy_holybolt" },
            { id: "protection", nombre: "Protección", icono: "ability_paladin_shieldofthetemplar" },
            { id: "retribution", nombre: "Reprensión", icono: "spell_holy_auraoflight" }
        ]
    },
    {
        id: "priest",
        nombre: "Sacerdote",
        colorHex: "#FFFFFF",
        colorTailwind: "text-[#FFFFFF]",
        icono: "classicon_priest",
        especialidades: [
            { id: "discipline", nombre: "Disciplina", icono: "spell_holy_wordfortitude" },
            { id: "holy", nombre: "Sagrado", icono: "spell_holy_guardianspirit" },
            { id: "shadow", nombre: "Sombra", icono: "spell_shadow_shadowwordpain" }
        ]
    },
    {
        id: "rogue",
        nombre: "Pícaro",
        colorHex: "#FFF569",
        colorTailwind: "text-[#FFF569]",
        icono: "classicon_rogue",
        especialidades: [
            { id: "assassination", nombre: "Asesinato", icono: "ability_rogue_eviscerate" },
            { id: "outlaw", nombre: "Forajido", icono: "ability_rogue_waylay" },
            { id: "subtlety", nombre: "Sutileza", icono: "ability_stealth" }
        ]
    },
    {
        id: "shaman",
        nombre: "Chamán",
        colorHex: "#0070DE",
        colorTailwind: "text-[#0070DE]",
        icono: "classicon_shaman",
        especialidades: [
            { id: "elemental", nombre: "Elemental", icono: "spell_nature_lightning" },
            { id: "enhancement", nombre: "Mejora", icono: "spell_nature_lightningshield" },
            { id: "restoration", nombre: "Restauración", icono: "spell_nature_magicimmunity" }
        ]
    },
    {
        id: "warlock",
        nombre: "Brujo",
        colorHex: "#8787ED",
        colorTailwind: "text-[#8787ED]",
        icono: "classicon_warlock",
        especialidades: [
            { id: "affliction", nombre: "Aflicción", icono: "spell_shadow_deathcoil" },
            { id: "demonology", nombre: "Demonología", icono: "spell_shadow_metamorphosis" },
            { id: "destruction", nombre: "Destrucción", icono: "spell_shadow_rainoffire" }
        ]
    },
    {
        id: "warrior",
        nombre: "Guerrero",
        colorHex: "#C79C6E",
        colorTailwind: "text-[#C79C6E]",
        icono: "classicon_warrior",
        especialidades: [
            { id: "arms", nombre: "Armas", icono: "ability_warrior_savageblow" },
            { id: "fury", nombre: "Furia", icono: "ability_warrior_innerrage" },
            { id: "protection", nombre: "Protección", icono: "ability_warrior_defensivestance" }
        ]
    }
];
