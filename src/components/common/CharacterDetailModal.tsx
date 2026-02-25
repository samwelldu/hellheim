import React, { useEffect, useState } from 'react';
import { blizzardService } from '../../services/blizzard';

interface CharacterDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterName: string;
    realm: string;
    region?: string;
}

const STAT_LABELS: Record<string, string> = {
    strength: 'Fuerza',
    agility: 'Agilidad',
    intellect: 'Intelecto',
    stamina: 'Aguante',
    crit_rating: 'Crítico',
    haste_rating: 'Celeridad',
    mastery_rating: 'Maestría',
    versatility: 'Versatilidad'
};

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
    isOpen, onClose, characterName, realm, region = 'us'
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [media, setMedia] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [equipment, setEquipment] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (isOpen && characterName && realm) {
            loadData();
        }
    }, [isOpen, characterName, realm]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [pData, mData, sData, eData] = await Promise.all([
                blizzardService.getCharacterProfile(realm, characterName, region),
                blizzardService.getCharacterMedia(realm, characterName, region),
                blizzardService.getCharacterStats(realm, characterName, region),
                blizzardService.getCharacterEquipment(realm, characterName, region)
            ]);

            setProfile(pData);
            setMedia(mData);
            setStats(sData);
            setEquipment(eData?.equipped_items || []);
        } catch (err) {
            setError('No se pudo cargar la información del personaje.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Get Avatar URL
    const avatarUrl = media?.assets?.find((a: any) => a.key === 'avatar')?.value;
    // mainImageUrl was unused, so I removed it.

    // Helper to find item by slot
    const getItemStart = (slotName: string) => equipment.find((i: any) => i.slot.type === slotName);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative text-gray-200" onClick={e => e.stopPropagation()}>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p>Consultando Armería...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-400">
                        <p>{error}</p>
                        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-900/30 rounded hover:bg-red-900/50">Reintentar</button>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row">

                        {/* LEFT: Visual & Core Info */}
                        <div className="w-full md:w-1/3 bg-[#111] p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-[#333]">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#333] mb-4 shadow-lg">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={characterName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-4xl">?</div>
                                )}
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">{profile?.name}</h2>
                            <p className="text-[#ffd700] text-sm mb-4">{profile?.active_title?.display_string?.replace('{name}', '') || 'Sin Título'}</p>

                            <div className="text-center space-y-1 text-sm text-gray-400">
                                <p><span className="text-white">{profile?.level}</span> {profile?.race?.name} {profile?.character_class?.name}</p>
                                <p>{profile?.active_spec?.name || 'Sin Especialización'}</p>
                                <p className="text-orange-400 font-bold">iLvl {profile?.average_item_level} / {profile?.equipped_item_level}</p>
                            </div>

                            {/* Main Stats */}
                            <div className="mt-8 w-full space-y-2">
                                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-800 pb-1">Estadísticas</h3>
                                {['strength', 'agility', 'intellect', 'stamina'].map(stat => {
                                    const val = stats?.[stat]?.effective;
                                    if (!val) return null;
                                    return (
                                        <div key={stat} className="flex justify-between text-sm">
                                            <span className="text-gray-400">{STAT_LABELS[stat] || stat}</span>
                                            <span className="text-white font-mono">{val.toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Secondary Stats */}
                            <div className="mt-6 w-full space-y-2">
                                {['crit_rating', 'haste_rating', 'mastery_rating', 'versatility'].map(stat => {
                                    // const val = stats?.[stat]; // some are straight numbers, some objects
                                    // Blizzard stats API structure varies, usually it helps to check 'value'
                                    // For simplicity let's assume raw value or percentage if available
                                    const percent = stats?.[stat.replace('_rating', '')]?.value || 0;
                                    if (percent === undefined) return null;

                                    return (
                                        <div key={stat} className="flex justify-between text-sm">
                                            <span className="text-gray-400">{STAT_LABELS[stat] || stat}</span>
                                            <span className="text-[#00ff9d] font-mono">{percent.toFixed(1)}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT: Equipment Grid */}
                        <div className="w-full md:w-2/3 p-6 bg-[url('https://render.worldofwarcraft.com/us/zones/iz-zone-undercity.jpg')] bg-cover bg-center relative">
                            <div className="absolute inset-0 bg-[#1a1a1a]/90 backdrop-blur-sm"></div> {/* Overlay */}

                            <div className="relative z-10">
                                <h3 className="text-lg font-bold text-white mb-6 border-b border-[#444] pb-2">Equipamiento</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Left Slots */}
                                    <div className="space-y-2">
                                        {['HEAD', 'NECK', 'SHOULDER', 'BACK', 'CHEST', 'SHIRT', 'TABARD', 'WRIST'].map(slot => {
                                            const item = getItemStart(slot);
                                            return <ItemRow key={slot} slot={slot} item={item} />;
                                        })}
                                    </div>

                                    {/* Right Slots */}
                                    <div className="space-y-2">
                                        {['HANDS', 'WAIST', 'LEGS', 'FEET', 'FINGER_1', 'FINGER_2', 'TRINKET_1', 'TRINKET_2', 'MAIN_HAND', 'OFF_HAND'].map(slot => {
                                            const item = getItemStart(slot);
                                            if (slot === 'OFF_HAND' && !item) return null; // Hide offhand if empty (2H wielder)
                                            return <ItemRow key={slot} slot={slot} item={item} alignRight />;
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-component for Item Row
const ItemRow = ({ slot, item, alignRight }: { slot: string, item: any, alignRight?: boolean }) => {
    const qualityColor = (quality: string) => {
        switch (quality) {
            case 'LEGENDARY': return 'border-[#ff8000] text-[#ff8000]';
            case 'EPIC': return 'border-[#a335ee] text-[#a335ee]';
            case 'RARE': return 'border-[#0070dd] text-[#0070dd]';
            case 'UNCOMMON': return 'border-[#1eff00] text-[#1eff00]';
            default: return 'border-gray-600 text-gray-400';
        }
    };

    const qColor = item ? qualityColor(item.quality.type) : 'border-gray-700';

    return (
        <div className={`flex items-center gap-3 ${alignRight ? 'flex-row-reverse text-right' : ''} bg-black/40 p-1 rounded hover:bg-black/60 transition-colors`}>
            {/* Icon */}
            <div className={`w-10 h-10 border-2 ${qColor} bg-gray-900 flex-shrink-0`}>
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 bg-gray-800">
                    {slot.substring(0, 2)}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${item ? qualityColor(item.quality.type).replace('border-', 'text-') : 'text-gray-600'}`}>
                    {item ? item.name : 'Vacio'}
                </div>
                {item && (
                    <div className="text-xs text-gray-400">
                        ilvl <span className="text-white">{item.level.value}</span>
                        {item.enchantments && <span className="text-[#00ff9d] ml-2">Enchanted</span>}
                    </div>
                )}
            </div>
        </div>
    );
};
