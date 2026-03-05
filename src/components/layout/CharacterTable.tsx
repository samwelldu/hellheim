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
    getTopRuns: (history: Record<string, number>, m0Count?: number) => number[];
    getVaultSlots: (runs: number[]) => number[];
    getStatus: (vaultSlots: number[], currentRules: MythicRules) => { status: string; label: string; color: string };
    getCountHighKeys: (history: Record<string, number> | undefined) => string | number;
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
                <tbody className="space-y-1">
                    {[...characters].sort((a, b) => a.name.localeCompare(b.name)).map((char) => {
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

                        const topRuns = getTopRuns(displayHistory, displayM0);
                        const vaultSlots = getVaultSlots(topRuns);
                        const status = rules ? getStatus(vaultSlots, rules) : { status: 'pending', label: '-', color: 'text-gray-500' };

                        return (
                            <tr
                                key={char.id}
                                className="bg-black/60 hover:bg-white/5 transition-all duration-300 group border border-white/5 rounded-2xl cursor-pointer shadow-2xl relative overflow-hidden"
                                onClick={() => {
                                    const realm = char.realm.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
                                    window.open(`https://worldofwarcraft.blizzard.com/es-mx/character/us/${realm}/${char.name.toLowerCase()}`, '_blank');
                                }}
                            >
                                <td className="py-2 px-3 bg-black/40 first:rounded-l-2xl last:rounded-r-2xl border-y first:border-l last:border-r border-white/5 group-hover:bg-black/60 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-8 h-8 rounded-xl shadow-inner flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110",
                                            char.faction === 'Alliance' ? "bg-blue-900/20 border-blue-500/30 text-blue-400" : "bg-red-900/20 border-red-500/30 text-red-400"
                                        )}>
                                            <span className="text-xs font-black tracking-tighter">{char.faction?.[0] || '?'}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-base font-black tracking-tight truncate leading-none group-hover:translate-x-1 transition-transform" style={{ color: classColor }}>
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
                                                <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                                    lvl {displayLevel}
                                                </span>
                                            </div>

                                            <div className="text-[9px] text-midnight-500 uppercase tracking-widest font-black flex items-center gap-2 opacity-80">
                                                <span>{displaySpec} {displayClass}</span>
                                                <span className="text-midnight-800">•</span>
                                                <span>{char.realm}</span>
                                            </div>
                                            <div className="text-xs font-black text-white flex items-center gap-2 mt-0.5">
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

                                <td className="py-2 px-3 text-center bg-black/40 border-y border-white/5 group-hover:bg-black/60 transition-colors">
                                    {(() => {
                                        const m0Pct = (displayM0 / 8) * 100;
                                        let m0ColorClass = "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
                                        if (m0Pct >= 75) m0ColorClass = "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]";
                                        else if (m0Pct >= 47) m0ColorClass = "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]";
                                        else if (m0Pct >= 23) m0ColorClass = "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]";

                                        return (
                                            <div className="flex flex-col items-center justify-center py-1.5 bg-black/60 border border-white/5 rounded-xl w-12 h-12 mx-auto shadow-inner group-hover:border-white/10 transition-colors">
                                                <span className={clsx("text-xl font-black transition-colors duration-300", m0ColorClass)}>
                                                    {displayM0}
                                                </span>
                                                <span className="text-[7px] uppercase tracking-widest text-midnight-600 font-black">M0</span>
                                            </div>
                                        );
                                    })()}
                                </td>

                                <td className="py-2 px-3 bg-black/40 border-y border-white/5 group-hover:bg-black/60 transition-colors">
                                    <div className="flex items-center justify-center gap-2">
                                        {[0, 1, 2].map(i => {
                                            const lvl = vaultSlots[i];
                                            const isUnlocked = lvl !== -1 && lvl !== undefined;
                                            return (
                                                <div
                                                    key={i}
                                                    className={clsx(
                                                        "w-10 h-10 rounded-lg flex flex-col items-center justify-center border transition-all relative overflow-hidden",
                                                        isUnlocked
                                                            ? "bg-gradient-to-b from-black/80 to-black border-void/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                                            : "bg-black/80 border-white/5 text-midnight-800"
                                                    )}
                                                >
                                                    {isUnlocked && <div className="absolute inset-x-0 top-0 h-0.5 bg-void-light"></div>}
                                                    <span className="text-[7px] uppercase font-black text-midnight-600 leading-tight z-10">S{i + 1}</span>
                                                    <span className={clsx(
                                                        "text-xl font-black leading-none z-10 tracking-tighter",
                                                        isUnlocked ? (lvl === 0 ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]" : "text-white drop-shadow-glow") : "text-midnight-800"
                                                    )}>
                                                        {isUnlocked ? (lvl === 0 ? 'M0' : lvl) : '-'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </td>

                                <td className="py-2 px-3 bg-black/40 border-y border-white/5 group-hover:bg-black/60 transition-colors">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex gap-1.5">
                                            {[
                                                { label: '2-5', range: [2, 5], color: 'text-midnight-400' },
                                                { label: '6-9', range: [6, 9], color: 'text-midnight-300' },
                                                { label: '10-12', range: [10, 12], color: 'text-void-light' },
                                            ].map(r => (
                                                <div key={r.label} className="flex flex-col items-center py-1 px-1.5 bg-black/60 border border-white/5 rounded-lg min-w-[35px] transition-colors group-hover:border-white/10">
                                                    <span className="text-[7px] text-midnight-600 uppercase font-black leading-none mb-0.5">{r.label}</span>
                                                    <span className={clsx("text-xs font-black", r.color)}>
                                                        {Object.entries(displayHistory).reduce((acc, [l, c]) => (parseInt(l) >= r.range[0] && parseInt(l) <= r.range[1] ? acc + c : acc), 0) || '-'}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="flex flex-col items-center py-1 px-1.5 bg-void/10 border border-void/30 rounded-lg min-w-[35px] shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                                <span className="text-[7px] text-void-light uppercase font-black leading-none mb-0.5">13+</span>
                                                <span className="text-sm font-black text-white drop-shadow-glow">
                                                    {getCountHighKeys(displayHistory)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-midnight-700"></div>
                                            <span className="text-[9px] text-midnight-500 font-black uppercase tracking-widest">Total: {Object.values(displayHistory).reduce((a, b) => a + b, 0)}</span>
                                        </div>
                                    </div>
                                </td>

                                <td className="py-2 px-3 text-center bg-black/40 first:rounded-l-2xl last:rounded-r-2xl border-y first:border-l last:border-r border-white/5 group-hover:bg-black/60 transition-colors">
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
                                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border transition-all group-hover:scale-105 duration-500",
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
