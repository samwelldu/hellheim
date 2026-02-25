import React, { useEffect, useState } from 'react';
import {
    Save, Trash2, Search, Shield, X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getClassColor } from '../utils/wowClasses';
import { getClassIconUrl, getIconUrl, BUFF_ICONS, CLASS_SPECS, getSpecIconUrl } from '../utils/wowIcons';

// Services
import { attendanceService, type AttendanceProfile } from '../services/attendanceService';
import { raidPlannerService, type RaidComposition, type RaidSlot } from '../services/raidPlannerService';

// --- Types & Constants ---
const GROUPS = [1, 2, 3, 4];

// Buff Definitions (Simplified)
const BUFFS = [
    { name: 'Bloodlust', classes: ['Shaman', 'Mage', 'Evoker', 'Hunter'], iconKey: 'Bloodlust' },
    { name: 'Intellect', classes: ['Mage'], iconKey: 'Intellect' },
    { name: 'Fortitude', classes: ['Priest'], iconKey: 'Fortitude' },
    { name: 'Battle Shout', classes: ['Warrior'], iconKey: 'Battle Shout' },
    { name: 'Mark of Wild', classes: ['Druid'], iconKey: 'Mark of Wild' },
    { name: 'Mystic Touch', classes: ['Monk'], iconKey: 'Mystic Touch' },
    { name: 'Chaos Brand', classes: ['Demon Hunter'], iconKey: 'Chaos Brand' },
    { name: 'Devotion', classes: ['Paladin'], iconKey: 'Devotion' },
];

export const RaidPlannerPage: React.FC = () => {
    const { showToast } = useToast();

    // --- State ---
    const [roster, setRoster] = useState<AttendanceProfile[]>([]);
    const [slots, setSlots] = useState<RaidSlot[]>([]);
    const [savedComps, setSavedComps] = useState<RaidComposition[]>([]);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [compName, setCompName] = useState('');
    const [specModalSlot, setSpecModalSlot] = useState<RaidSlot | null>(null);

    // --- Initialization ---
    useEffect(() => {
        const init = async () => {
            try {
                // Load Roster
                const chars = await attendanceService.getCharacters();
                setRoster(chars);

                // Load Saved Comps
                const comps = await raidPlannerService.getCompositions();
                setSavedComps(comps);

                // Initialize Empty Slots
                const emptySlots: RaidSlot[] = [];
                for (let g = 1; g <= 4; g++) {
                    for (let p = 0; p < 5; p++) {
                        emptySlots.push({
                            position: (g - 1) * 5 + p,
                            group: g,
                            role: null,
                            characterId: null
                        });
                    }
                }
                setSlots(emptySlots);
            } catch (error) {
                console.error("Error init raid planner:", error);
                showToast("Error cargando datos.", "error");
            }
        };
        init();
    }, []);

    // --- Helpers ---
    const getSlot = (group: number, index: number) => {
        return slots.find(s => s.group === group && s.position === ((group - 1) * 5 + index));
    };

    const getActiveBuffs = () => {
        const activeClasses = new Set(slots.filter(s => s.characterClass).map(s => s.characterClass));
        return BUFFS.map(buff => ({
            ...buff,
            active: buff.classes.some(c => activeClasses.has(c))
        }));
    };

    // --- Actions ---
    const handleAddPlayer = (player: AttendanceProfile, targetSlot?: RaidSlot) => {
        // Check if already in raid
        if (slots.some(s => s.characterId === player.id)) {
            showToast(`${player.name} ya está en la raid.`, "info");
            return;
        }

        let slotToFill = targetSlot;

        // If no target slot, find first empty
        if (!slotToFill) {
            slotToFill = slots.find(s => s.characterId === null);
        }

        if (!slotToFill) {
            showToast("La raid está llena.", "info");
            return;
        }

        // Update Slots
        setSlots(prev => prev.map(s => {
            if (s.position === slotToFill!.position) {
                return {
                    ...s,
                    characterId: player.id,
                    characterName: player.name,
                    characterClass: player.className,
                    spec: undefined, // Reset spec on new add
                    role: 'melee' // Placeholder
                };
            }
            return s;
        }));
    };

    const handleRemovePlayer = (position: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSlots(prev => prev.map(s => {
            if (s.position === position) {
                return { ...s, characterId: null, characterName: undefined, characterClass: undefined, spec: undefined, role: null };
            }
            return s;
        }));
    };

    const handleClearRaid = () => {
        if (!confirm("¿Limpiar toda la raid?")) return;
        setSlots(prev => prev.map(s => ({ ...s, characterId: null, characterName: undefined, characterClass: undefined, spec: undefined, role: null })));
        setCompName('');
    };

    const handleSaveComp = async () => {
        if (!compName.trim()) {
            showToast("Ingresa un nombre para la composición.", "error");
            return;
        }

        try {
            const newComp: RaidComposition = {
                id: compName.toLowerCase().replace(/\s+/g, '-'),
                name: compName,
                createdAt: new Date(),
                slots: slots
            };
            await raidPlannerService.saveComposition(newComp);
            setSavedComps(prev => [...prev.filter(c => c.id !== newComp.id), newComp]);
            showToast("Composición guardada.", "success");
        } catch (error) {
            showToast("Error al guardar.", "error");
        }
    };

    const handleLoadComp = (comp: RaidComposition) => {
        if (!confirm(`¿Cargar composición "${comp.name}"? Se perderán los cambios actuales.`)) return;
        setSlots(comp.slots);
        setCompName(comp.name);
    };

    const handleDeleteComp = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("¿Eliminar esta composición guardada?")) return;
        try {
            await raidPlannerService.deleteComposition(id);
            setSavedComps(prev => prev.filter(c => c.id !== id));
            showToast("Composición eliminada.", "success");
        } catch (error) {
            showToast("Error al eliminar.", "error");
        }
    };

    const handleOpenSpecModal = (slot: RaidSlot) => {
        if (slot.characterClass) {
            setSpecModalSlot(slot);
        }
    };

    const handleSelectSpec = (specName: string) => {
        if (!specModalSlot) return;
        setSlots(prev => prev.map(s => {
            if (s.position === specModalSlot.position) {
                return { ...s, spec: specName };
            }
            return s;
        }));
        setSpecModalSlot(null);
    };

    // --- Drag and Drop ---
    const handleDragStart = (e: React.DragEvent, player: AttendanceProfile, fromSlot?: RaidSlot) => {
        e.dataTransfer.setData('player', JSON.stringify(player));
        if (fromSlot) {
            e.dataTransfer.setData('fromSlot', String(fromSlot.position));
        }
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Allow drop
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetSlot: RaidSlot) => {
        e.preventDefault();
        const playerData = e.dataTransfer.getData('player');

        if (!playerData) return;

        const player = JSON.parse(playerData) as AttendanceProfile;
        const fromSlotPos = e.dataTransfer.getData('fromSlot');

        // Logic: 
        // 1. If from Roster (no fromSlotPos): Add/Move to target.
        // 2. If from Grid (fromSlotPos): Move to target (Swap if occupied?).

        setSlots(prev => {
            const newSlots = [...prev];
            const targetIndex = newSlots.findIndex(s => s.position === targetSlot.position);

            // If dragging from Grid
            if (fromSlotPos) {
                const sourcePos = parseInt(fromSlotPos);

                // If dropping in same slot, do nothing
                if (sourcePos === targetSlot.position) return prev;

                const sourceIndex = newSlots.findIndex(s => s.position === sourcePos);
                const sourceSlot = newSlots[sourceIndex];
                const tSlot = newSlots[targetIndex];

                // Swap Logic
                newSlots[sourceIndex] = {
                    ...sourceSlot,
                    characterId: tSlot.characterId,
                    characterName: tSlot.characterName,
                    characterClass: tSlot.characterClass,
                    spec: tSlot.spec,
                    role: tSlot.role
                };

                newSlots[targetIndex] = {
                    ...tSlot,
                    characterId: sourceSlot.characterId,
                    characterName: sourceSlot.characterName,
                    characterClass: sourceSlot.characterClass,
                    spec: sourceSlot.spec,
                    role: sourceSlot.role
                };
            } else {
                // Dragging from Roster
                // Check if player is already assigned somewhere else?
                // The roster UI prevents dragging assigned players, but double check
                const existingSlotIndex = newSlots.findIndex(s => s.characterId === player.id);
                if (existingSlotIndex !== -1 && existingSlotIndex !== targetIndex) {
                    // Start Move from other slot? Or just fail?
                    // Let's allow moving if they somehow dragged it (e.g. glitch)
                    // But assume roster disables it.
                    // Just overwrite target slot.
                }

                newSlots[targetIndex] = {
                    ...targetSlot,
                    characterId: player.id,
                    characterName: player.name,
                    characterClass: player.className,
                    spec: undefined,
                    role: 'melee'
                };
            }
            return newSlots;
        });
    };

    // --- Render ---
    const activeBuffs = getActiveBuffs();

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 p-6 animate-fade-in text-white overflow-hidden relative">
            {/* LEFT: Raid Grid */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Header / Stats */}
                <div className="bg-midnight-900/50 p-4 rounded-xl border border-midnight-700 flex justify-between items-center backdrop-blur-md">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Shield className="text-accent-cyan" />
                            Raid Planner
                        </h2>
                        <div className="flex gap-2 mt-2">
                            {activeBuffs.map(b => (
                                <div
                                    key={b.name}
                                    className={`relative group w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${b.active ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] opacity-100' : 'border-midnight-700 opacity-30 grayscale'}`}
                                    title={b.name}
                                >
                                    <img
                                        src={getIconUrl(BUFF_ICONS[b.iconKey])}
                                        alt={b.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 bg-midnight-950/80 p-2 rounded-lg border border-midnight-700 shadow-inner">
                            <input
                                type="text"
                                placeholder="Nombre Setup..."
                                value={compName}
                                onChange={(e) => setCompName(e.target.value)}
                                className="bg-transparent text-sm focus:outline-none w-32 placeholder-midnight-500"
                            />
                            <button onClick={handleSaveComp} className="text-accent-cyan hover:text-white transition-colors hover:scale-110"><Save size={18} /></button>
                        </div>
                        <button onClick={handleClearRaid} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg transition-colors border border-red-900/30"><Trash2 size={18} /></button>
                    </div>
                </div>

                {/* The Grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-2 scrollbar-thin scrollbar-thumb-midnight-700">
                    {GROUPS.map(groupNum => (
                        <div key={groupNum} className="bg-midnight-900/40 border border-midnight-700/50 rounded-xl p-3 flex flex-col gap-2 shadow-lg backdrop-blur-sm">
                            <h3 className="text-center font-bold text-midnight-400 uppercase text-xs tracking-widest mb-2">Grupo {groupNum}</h3>
                            {Array.from({ length: 5 }).map((_, idx) => {
                                const slot = getSlot(groupNum, idx);
                                return (
                                    <div
                                        key={idx}
                                        draggable={!!slot?.characterId}
                                        onDragStart={(e) => slot?.characterId && handleDragStart(e, {
                                            id: slot.characterId,
                                            name: slot.characterName!,
                                            className: slot.characterClass!
                                        } as AttendanceProfile, slot)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, slot!)}
                                        onClick={() => slot?.characterId && handleOpenSpecModal(slot)}
                                        className={`
                                            h-16 rounded-lg border flex items-center px-3 gap-3 relative transition-all group overflow-hidden
                                            ${slot?.characterId
                                                ? 'bg-midnight-800/80 border-midnight-600 hover:border-accent-cyan/50 hover:bg-midnight-800 cursor-pointer active:cursor-grabbing'
                                                : 'bg-midnight-950/20 border-dashed border-midnight-800 hover:border-accent-cyan/30 hover:bg-accent-cyan/5 cursor-default'
                                            }
                                        `}
                                    >
                                        {slot?.characterId ? (
                                            <>
                                                {/* Icon (Class or Spec) */}
                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shadow-md shrink-0 relative transition-all bg-black pointer-events-none">
                                                    <img
                                                        src={slot.spec && slot.characterClass ? getSpecIconUrl(slot.characterClass, slot.spec) : getClassIconUrl(slot.characterClass || 'Warrior')}
                                                        alt={slot.spec || slot.characterClass}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = getIconUrl('inv_misc_questionmark');
                                                        }}
                                                    />
                                                </div>

                                                <div className="flex flex-col overflow-hidden z-10 flex-1 pointer-events-none">
                                                    <span
                                                        className="font-bold text-sm truncate drop-shadow-md"
                                                        style={{ color: getClassColor(slot.characterClass || '') }}
                                                    >
                                                        {slot.characterName}
                                                    </span>
                                                    <span className="text-[10px] text-midnight-400 uppercase tracking-wide group-hover:text-accent-cyan transition-colors">
                                                        {slot.spec || slot.role || 'Select Spec'}
                                                    </span>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={(e) => handleRemovePlayer(slot.position, e)}
                                                    className="p-1.5 text-midnight-500 hover:text-red-500 hover:bg-red-900/20 rounded transition-colors z-20 pointer-events-auto"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-full text-center text-midnight-600 text-xs font-mono uppercase tracking-wider Pointer-events-none">
                                                Vacio
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: Sidebar */}
            <div className="w-80 flex flex-col gap-4 bg-midnight-900/90 backdrop-blur-xl border-l border-midnight-700 p-4 -my-6 -mr-6 shadow-2xl">
                <div className="flex gap-2 p-1 bg-midnight-950 rounded-lg shadow-inner">
                    <button className="flex-1 py-1.5 text-xs font-bold bg-midnight-800 rounded shadow text-white transition-all">Roster</button>
                    <button className="flex-1 py-1.5 text-xs font-bold text-midnight-500 hover:text-white transition-colors">Guardados</button>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-500 group-focus-within:text-accent-cyan transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar jugador..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-midnight-950 border border-midnight-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all placeholder-midnight-600"
                    />
                </div>

                {/* Roster List */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-midnight-700 space-y-2">
                    {roster
                        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(char => {
                            const isAssigned = slots.some(s => s.characterId === char.id);
                            return (
                                <div
                                    key={char.id}
                                    draggable={!isAssigned}
                                    onDragStart={(e) => handleDragStart(e, char)}
                                    onClick={() => !isAssigned && handleAddPlayer(char)}
                                    className={`
                                        p-2 rounded-lg border flex items-center gap-3 transition-all relative overflow-hidden group
                                        ${isAssigned
                                            ? 'opacity-40 grayscale bg-midnight-950 border-transparent cursor-default'
                                            : 'bg-midnight-800/40 border-midnight-700 hover:border-accent-cyan/50 hover:bg-midnight-800 hover:shadow-lg hover:-translate-y-0.5 cursor-grab active:cursor-grabbing'
                                        }
                                    `}
                                >
                                    {/* Class Icon */}
                                    <div className="w-8 h-8 rounded overflow-hidden border border-white/10 shrink-0 pointer-events-none">
                                        <img
                                            src={getClassIconUrl(char.className)}
                                            alt={char.className}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = getIconUrl('inv_misc_questionmark');
                                            }}
                                        />
                                    </div>

                                    <div className="flex flex-col min-w-0 pointer-events-none">
                                        <span className={`text-sm font-bold truncate ${!isAssigned && 'group-hover:text-white'}`} style={{ color: !isAssigned ? getClassColor(char.className) : '#888' }}>
                                            {char.name}
                                        </span>
                                        <span className="text-[10px] text-midnight-400 truncate">{char.className}</span>
                                    </div>

                                    {isAssigned && <div className="ml-auto text-green-500 text-xs font-bold px-2 py-0.5 bg-green-900/20 rounded pointer-events-none">IN</div>}
                                </div>
                            );
                        })}
                </div>

                {/* Saved Comps List */}
                {savedComps.length > 0 && (
                    <div className="border-t border-midnight-700 pt-4 mt-2">
                        <h4 className="text-xs font-bold text-midnight-400 mb-2 uppercase tracking-wider">Cargar Setup</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-midnight-700">
                            {savedComps.map(comp => (
                                <div key={comp.id} className="flex justify-between items-center p-2 bg-midnight-950/50 rounded border border-midnight-800 text-xs hover:border-midnight-600 transition-colors group">
                                    <span
                                        onClick={() => handleLoadComp(comp)}
                                        className="cursor-pointer hover:text-accent-cyan truncate flex-1 font-mono"
                                    >
                                        {comp.name}
                                    </span>
                                    <button onClick={(e) => handleDeleteComp(comp.id, e)} className="text-midnight-500 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SPEC SELECT MODAL */}
            {specModalSlot && specModalSlot.characterClass && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSpecModalSlot(null)}>
                    <div className="bg-midnight-900 border border-midnight-600 rounded-xl p-4 shadow-2xl max-w-sm w-full m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <span style={{ color: getClassColor(specModalSlot.characterClass) }}>{specModalSlot.characterName}</span>
                                <span className="text-midnight-400 text-sm font-normal">Select Spec</span>
                            </h3>
                            <button onClick={() => setSpecModalSlot(null)} className="text-midnight-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {/* Class Icon Option (Reset) */}
                            <div
                                onClick={() => handleSelectSpec('')}
                                className={`flex flex-col items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-midnight-800 transition-all ${!specModalSlot.spec ? 'border-accent-cyan bg-accent-cyan/10' : 'border-midnight-700 bg-midnight-950'}`}
                            >
                                <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden">
                                    <img src={getClassIconUrl(specModalSlot.characterClass)} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs text-center font-bold text-midnight-300">Class</span>
                            </div>

                            {/* Specs */}
                            {(CLASS_SPECS[specModalSlot.characterClass] || []).map(spec => (
                                <div
                                    key={spec}
                                    onClick={() => handleSelectSpec(spec)}
                                    className={`flex flex-col items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-midnight-800 transition-all ${specModalSlot.spec === spec ? 'border-accent-cyan bg-accent-cyan/10' : 'border-midnight-700 bg-midnight-950'}`}
                                >
                                    <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden">
                                        <img src={getSpecIconUrl(specModalSlot.characterClass!, spec)} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-xs text-center font-bold text-white">{spec}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
