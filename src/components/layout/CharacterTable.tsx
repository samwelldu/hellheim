import React from 'react';
import { RefreshCw } from 'lucide-react';
import { getClassColor } from '../../utils/wowClasses';
import { clsx } from 'clsx';
import { AlertCircle, History, CheckCircle } from 'lucide-react';
import { getWeeklyReset } from '../../services/mythicPlusService';
import type { CharacterProfile, MythicRules } from '../../services/mythicPlusService';

interface CharacterTableProps {
    characters: CharacterProfile[];
    loading: boolean;
    syncingIds: Set<string>;
    rules: MythicRules | null;
    isAdmin: boolean;
    onSyncSingle: (char: CharacterProfile) => void;
    onDeleteCharacter: (id: string, name: string) => void;
    getTopRuns: (history: Record<string, number>) => number[];
    getVaultSlots: (runs: number[]) => number[];
    getStatus: (vaultSlots: number[], currentRules: MythicRules) => { status: string; label: string; color: string };
    getCountHighKeys: (history: Record<string, number> | undefined) => string | number;
    onCharacterClick: (char: CharacterProfile) => void;
    isHistoricalView?: boolean;
    mainCharacter?: any;
}

export const CharacterTable: React.FC<CharacterTableProps> = ({
    characters,
    syncingIds,
    rules,
    isAdmin,
    onSyncSingle,
    onDeleteCharacter,
    getTopRuns,
    getVaultSlots,
    getStatus,
    getCountHighKeys,
    onCharacterClick,
    isHistoricalView = false,
    mainCharacter
}) => {
    const weeklyResetTime = getWeeklyReset();
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
                <thead className="text-midnight-500 uppercase text-[10px] tracking-[0.2em] font-black">
                    <tr>
                        <th className="px-4 pb-2 w-1/4">Personaje</th>
                        <th className="px-4 pb-2 text-center w-auto">Míticas 0</th>
                        <th className="px-4 pb-2 text-center w-1/4">Great Vault (M+)</th>
                        <th className="px-4 pb-2 text-center w-1/4">Historial Semanal</th>
                        <th className="px-4 pb-2 text-center w-32">Estado</th>
                    </tr>
                </thead>
                <tbody className="space-y-3">
                    {characters.map((char) => {
                        const classColor = getClassColor(char.className);
                        const isSyncing = syncingIds.has(char.id);

                        // Tan: Detectamos si los datos son antiguos (Stale)
                        // Usamos lastBlizzardSync o el updatedAt de Firestore como respaldo
                        const lastSync = char.lastBlizzardSync ||
                            (char.updatedAt?.toMillis ? char.updatedAt.toMillis() :
                                char.updatedAt?.seconds ? char.updatedAt.seconds * 1000 : 0);

                        const isStale = !isHistoricalView && lastSync < weeklyResetTime;

                        // Tan: Priorizamos datos sincronizados (Pending) sobre los publicados (Official) para que el jugador vea su avance real
                        const currentData = (!isHistoricalView && char.pendingData) ? char.pendingData : char;

                        const displayHistory = isStale ? {} : (currentData.weeklyHistory || {});
                        const displayM0 = isStale ? 0 : (currentData.mythic0Count || 0);

                        // Usamos los datos más recientes para el perfil visual
                        const displayLevel = currentData.level || char.level;
                        const displaySpec = currentData.spec || char.spec;
                        const displayClass = currentData.className || char.className;
                        const displayIlvl = currentData.ilvl || char.ilvl;

                        const topRuns = getTopRuns(displayHistory);
                        const vaultSlots = getVaultSlots(topRuns);
                        const status = rules ? getStatus(vaultSlots, rules) : { status: 'pending', label: '-', color: 'text-gray-500' };

                        return (
                            <tr
                                key={char.id}
                                className="bg-black/60 hover:bg-white/5 transition-all duration-300 group border border-white/5 rounded-2xl cursor-pointer shadow-2xl relative overflow-hidden"
                                onClick={() => onCharacterClick(char)}
                            >
                                <td className="p-5 bg-black/40 first:rounded-l-2xl last:rounded-r-2xl border-y first:border-l last:border-r border-white/5 group-hover:bg-black/60 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-xl shadow-inner flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110",
                                            char.faction === 'Alliance' ? "bg-blue-900/20 border-blue-500/30 text-blue-400" : "bg-red-900/20 border-red-500/30 text-red-400"
                                        )}>
                                            <span className="text-xs font-black tracking-tighter">{char.faction?.[0] || '?'}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-lg font-black tracking-tight truncate leading-none group-hover:translate-x-1 transition-transform" style={{ color: classColor }}>
                                                    {char.name}
                                                </h3>
                                                {isStale && (
                                                    <div
                                                        className="flex items-center gap-1 text-[8px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse"
                                                        title="Datos de la semana pasada. ¡Sincroniza para actualizar!"
                                                    >
                                                        <AlertCircle size={10} />
                                                        STALE
                                                    </div>
                                                )}
                                                {isHistoricalView && (
                                                    <div className="flex items-center gap-1 text-[8px] font-black text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                                        <History size={10} />
                                                        HISTÓRICO
                                                    </div>
                                                )}
                                                {char.pendingData && !isHistoricalView && (
                                                    <div
                                                        className="flex items-center gap-1 text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse-subtle"
                                                        title="Hay nuevos datos sincronizados esperando ser publicados por un administrador."
                                                    >
                                                        <CheckCircle size={10} />
                                                        PENDIENTE
                                                    </div>
                                                )}
                                                <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                                    lvl {displayLevel}
                                                </span>
                                            </div>

                                            <div className="text-[10px] text-midnight-500 uppercase tracking-widest font-black flex items-center gap-2 opacity-80">
                                                <span>{displaySpec} {displayClass}</span>
                                                <span className="text-midnight-800">•</span>
                                                <span>{char.realm}</span>
                                            </div>
                                            <div className="text-xs font-black text-white flex items-center gap-2 mt-1">
                                                <span className="text-[8px] uppercase tracking-[0.2em] text-midnight-600 font-black">Item Level</span>
                                                <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">{displayIlvl}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {(() => {
                                        const isMyChar = mainCharacter &&
                                            mainCharacter.name.toLowerCase() === char.name.toLowerCase() &&
                                            mainCharacter.realm.toLowerCase() === char.realm.toLowerCase();

                                        if (!isAdmin && !isMyChar) return null;

                                        return (
                                            <div className="flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSyncSingle(char); }}
                                                    disabled={isSyncing}
                                                    className="flex items-center gap-2 px-3 py-1 bg-midnight-800 border border-midnight-700 rounded-lg text-[10px] uppercase font-black tracking-wider text-void-light hover:bg-void hover:text-white transition-all shadow-lg"
                                                >
                                                    <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
                                                    {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDeleteCharacter(char.id, char.name); }}
                                                        className="px-3 py-1 bg-midnight-800 border border-midnight-700 rounded-lg text-[10px] uppercase font-black tracking-wider text-red-500 hover:bg-red-900/40 hover:border-red-500/50 transition-all shadow-lg"
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </td>

                                <td className="p-5 text-center bg-black/40 border-y border-white/5 group-hover:bg-black/60 transition-colors">
                                    <div className="flex flex-col items-center justify-center p-3 bg-black/60 border border-white/5 rounded-2xl w-14 h-14 mx-auto shadow-inner group-hover:border-white/10 transition-colors">
                                        <span className="text-2xl font-black text-white drop-shadow-glow">
                                            {displayM0 + Object.values(displayHistory).reduce((a, b) => a + b, 0)}
                                        </span>
                                        <span className="text-[8px] uppercase tracking-widest text-midnight-600 font-black">M0 + M+</span>
                                    </div>
                                </td>

                                <td className="p-5 bg-black/40 border-y border-white/5 group-hover:bg-black/60 transition-colors">
                                    <div className="flex items-center justify-center gap-3">
                                        {[0, 1, 2].map(i => {
                                            const lvl = vaultSlots[i];
                                            const isUnlocked = lvl > 0;
                                            return (
                                                <div
                                                    key={i}
                                                    className={clsx(
                                                        "w-12 h-16 rounded-xl flex flex-col items-center justify-center border transition-all relative overflow-hidden",
                                                        isUnlocked
                                                            ? "bg-gradient-to-b from-black/80 to-black border-void/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                                            : "bg-black/80 border-white/5 text-midnight-800"
                                                    )}
                                                >
                                                    {isUnlocked && <div className="absolute inset-x-0 top-0 h-0.5 bg-void-light"></div>}
                                                    <span className="text-[9px] uppercase font-black text-midnight-600 mb-1 z-10">Slot {i + 1}</span>
                                                    <span className={clsx(
                                                        "text-2xl font-black leading-none z-10 tracking-tighter",
                                                        isUnlocked ? "text-white drop-shadow-glow" : "text-midnight-800"
                                                    )}>
                                                        {isUnlocked ? lvl : '-'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </td>

                                <td className="p-5 bg-black/40 border-y border-white/5 group-hover:bg-black/60 transition-colors">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex gap-2">
                                            {[
                                                { label: '2-5', range: [2, 5], color: 'text-midnight-400' },
                                                { label: '6-9', range: [6, 9], color: 'text-midnight-300' },
                                                { label: '10-12', range: [10, 12], color: 'text-void-light' },
                                            ].map(r => (
                                                <div key={r.label} className="flex flex-col items-center p-2 bg-black/60 border border-white/5 rounded-xl min-w-[45px] transition-colors group-hover:border-white/10">
                                                    <span className="text-[8px] text-midnight-600 uppercase font-black mb-1">{r.label}</span>
                                                    <span className={clsx("text-sm font-black", r.color)}>
                                                        {Object.entries(displayHistory).reduce((acc, [l, c]) => (parseInt(l) >= r.range[0] && parseInt(l) <= r.range[1] ? acc + c : acc), 0) || '-'}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="flex flex-col items-center p-2 bg-void/10 border border-void/30 rounded-xl min-w-[45px] shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                                <span className="text-[8px] text-void-light uppercase font-black mb-1">13+</span>
                                                <span className="text-base font-black text-white drop-shadow-glow">
                                                    {getCountHighKeys(displayHistory)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-midnight-700"></div>
                                            <span className="text-[10px] text-midnight-500 font-black uppercase tracking-widest">Total: {Object.values(displayHistory).reduce((a, b) => a + b, 0)}</span>
                                        </div>
                                    </div>
                                </td>

                                <td className="p-5 text-center bg-black/40 first:rounded-l-2xl last:rounded-r-2xl border-y first:border-l last:border-r border-white/5 group-hover:bg-black/60 transition-colors">
                                    {(() => {
                                        const statusStyles = {
                                            complete: "bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_20px_rgba(72,222,128,0.15)]",
                                            regular: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-[0_0_20px_rgba(250,204,21,0.15)]",
                                            incomplete: "bg-midnight-800/50 text-midnight-600 border-midnight-700/50",
                                            unknown: "bg-gray-800 text-gray-500"
                                        };
                                        const style = statusStyles[status.status as keyof typeof statusStyles] || statusStyles.unknown;

                                        return (
                                            <div className={clsx(
                                                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] border transition-all group-hover:scale-105 duration-500",
                                                style
                                            )}>
                                                {status.label}
                                            </div>
                                        );
                                    })()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
