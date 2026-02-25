export const ICON_BASE_URL = 'https://render.worldofwarcraft.com/us/icons/56';

export const CLASS_ICONS: Record<string, string> = {
    'Warrior': 'classicon_warrior',
    'Paladin': 'classicon_paladin',
    'Hunter': 'classicon_hunter',
    'Rogue': 'classicon_rogue',
    'Priest': 'classicon_priest',
    'Death Knight': 'classicon_deathknight',
    'Shaman': 'classicon_shaman',
    'Mage': 'classicon_mage',
    'Warlock': 'classicon_warlock',
    'Monk': 'classicon_monk',
    'Druid': 'classicon_druid',
    'Demon Hunter': 'classicon_demonhunter',
    'Evoker': 'classicon_evoker',
};

export const CLASS_SPECS: Record<string, string[]> = {
    'Warrior': ['Arms', 'Fury', 'Protection'],
    'Paladin': ['Holy', 'Protection', 'Retribution'],
    'Hunter': ['Beast Mastery', 'Marksmanship', 'Survival'],
    'Rogue': ['Assassination', 'Outlaw', 'Subtlety'],
    'Priest': ['Discipline', 'Holy', 'Shadow'],
    'Death Knight': ['Blood', 'Frost', 'Unholy'],
    'Shaman': ['Elemental', 'Enhancement', 'Restoration'],
    'Mage': ['Arcane', 'Fire', 'Frost'],
    'Warlock': ['Affliction', 'Demonology', 'Destruction'],
    'Monk': ['Brewmaster', 'Mistweaver', 'Windwalker'],
    'Druid': ['Balance', 'Feral', 'Guardian', 'Restoration'],
    'Demon Hunter': ['Havoc', 'Vengeance'],
    'Evoker': ['Devastation', 'Preservation', 'Augmentation'],
};

// "Class:Spec" -> Icon Filename
export const SPEC_ICONS: Record<string, string> = {
    // Warrior
    'Warrior:Arms': 'ability_warrior_savageblow',
    'Warrior:Fury': 'ability_warrior_innerrage',
    'Warrior:Protection': 'ability_warrior_defensivestance',
    // Paladin
    'Paladin:Holy': 'spell_holy_holybolt',
    'Paladin:Protection': 'ability_paladin_shieldofthetemplar',
    'Paladin:Retribution': 'spell_holy_auraoflight',
    // Hunter
    'Hunter:Beast Mastery': 'ability_hunter_bestialdiscipline',
    'Hunter:Marksmanship': 'ability_hunter_focusedaim',
    'Hunter:Survival': 'ability_hunter_camouflage',
    // Rogue
    'Rogue:Assassination': 'ability_rogue_deadlybrew',
    'Rogue:Outlaw': 'ability_rogue_waylay', // was Combat: ability_rogue_eviscerate
    'Rogue:Subtlety': 'ability_stealth',
    // Priest
    'Priest:Discipline': 'spell_holy_powerwordshield',
    'Priest:Holy': 'spell_holy_guardianspirit',
    'Priest:Shadow': 'spell_shadow_shadowwordpain',
    // Death Knight
    'Death Knight:Blood': 'spell_deathknight_bloodpresence',
    'Death Knight:Frost': 'spell_deathknight_frostpresence',
    'Death Knight:Unholy': 'spell_deathknight_unholypresence',
    // Shaman
    'Shaman:Elemental': 'spell_nature_lightning',
    'Shaman:Enhancement': 'spell_shaman_improvedstormstrike',
    'Shaman:Restoration': 'spell_nature_magicimmunity',
    // Mage
    'Mage:Arcane': 'spell_holy_magicalsentry',
    'Mage:Fire': 'spell_fire_firebolt02',
    'Mage:Frost': 'spell_frost_frostbolt02',
    // Warlock
    'Warlock:Affliction': 'spell_shadow_deathcoil',
    'Warlock:Demonology': 'spell_shadow_metamorphosis',
    'Warlock:Destruction': 'spell_shadow_rainoffire',
    // Monk
    'Monk:Brewmaster': 'spell_monk_brewmaster_spec',
    'Monk:Mistweaver': 'spell_monk_mistweaver_spec',
    'Monk:Windwalker': 'spell_monk_windwalker_spec',
    // Druid
    'Druid:Balance': 'spell_nature_starfall',
    'Druid:Feral': 'ability_druid_catform',
    'Druid:Guardian': 'ability_racial_bearform',
    'Druid:Restoration': 'spell_nature_healingtouch',
    // Demon Hunter
    'Demon Hunter:Havoc': 'ability_demonhunter_specdps',
    'Demon Hunter:Vengeance': 'ability_demonhunter_spectank',
    // Evoker
    'Evoker:Devastation': 'classicon_evoker_devastation', // These might utilize classicon_evoker_specname
    'Evoker:Preservation': 'classicon_evoker_preservation',
    'Evoker:Augmentation': 'classicon_evoker_augmentation',
};

export const BUFF_ICONS: Record<string, string> = {
    'Bloodlust': 'spell_nature_bloodlust',
    'Intellect': 'spell_holy_magicalsentry',
    'Fortitude': 'spell_holy_wordfortitude',
    'Battle Shout': 'ability_warrior_battleshout',
    'Mark of Wild': 'spell_druid_markofthewild',
    'Mystic Touch': 'ability_monk_mystictouch',
    'Chaos Brand': 'ability_demonhunter_empowerwards',
    'Devotion': 'spell_holy_devotionaura',
};

export const getIconUrl = (iconName: string) => `${ICON_BASE_URL}/${iconName}.jpg`;

export const getClassIconUrl = (className: string) => {
    const icon = CLASS_ICONS[className];
    // Return empty if not found, to let UI handle fallback
    return icon ? getIconUrl(icon) : '';
};

export const getSpecIconUrl = (className: string, specName: string) => {
    const key = `${className}:${specName}`;
    const icon = SPEC_ICONS[key];
    return icon ? getIconUrl(icon) : '';
};
