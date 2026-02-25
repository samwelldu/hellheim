import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, History, DollarSign, Crown, RotateCw, AlertCircle } from 'lucide-react';
import { parseLuaTable, type QuotaRecord } from '../utils/luaParser';
import { quotaService } from '../services/quotaService';
import { attendanceService } from '../services/attendanceService';
import { userService } from '../services/userService';
import { getClassColor } from '../utils/wowClasses';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const QuotaPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [parsedRecords, setParsedRecords] = useState<QuotaRecord[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState<{ uploaded: number; duplicates: number } | null>(null);

    const [ranking, setRanking] = useState<{ id: string; name: string; amount: number; className?: string; isPlayerToken?: boolean }[]>([]);
    const [orphanRecords, setOrphanRecords] = useState<(QuotaRecord & { id: string })[]>([]);
    const [loadingRanking, setLoadingRanking] = useState(true);
    const [currentQuota, setCurrentQuota] = useState<number>(0);

    // Transfer State
    const [transferringRecord, setTransferringRecord] = useState<(QuotaRecord & { id: string }) | null>(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingRanking(true);
        try {
            const [rankData, users, roster, q, orphans] = await Promise.all([
                quotaService.getQuotaRanking(),
                userService.getAllUsers(),
                attendanceService.getCharacters(),
                quotaService.getRaidQuota(),
                isAdmin ? quotaService.getOrphanRecords() : Promise.resolve([])
            ]);

            // Tan: Identificamos a los usuarios que ya tienen identidad vinculada
            const linkedUsers = users.filter(u => u.mainCharacter && u.playerToken);

            // Creamos un mapa de balances actuales para búsqueda rápida
            const goldMap = new Map<string, any>(rankData.map(r => [r.id, r]));

            // Construimos el ranking unificado
            const unifiedRanking: any[] = [];

            // 1. Primero agregamos a todos los usuarios vinculados (hayan aportado o no)
            linkedUsers.forEach(user => {
                const goldRecord = goldMap.get(user.playerToken!);
                unifiedRanking.push({
                    id: user.playerToken,
                    name: user.mainCharacter!.name,
                    amount: goldRecord ? goldRecord.amount : 0,
                    className: user.mainCharacter!.className,
                    isPlayerToken: true
                });
                // Lo borramos del mapa para saber qué registros quedan (Legacy o No-Usuarios)
                goldMap.delete(user.playerToken!);
            });

            // 2. Agregamos el resto de registros que tengan oro (Personajes no vinculados o Legacy)
            goldMap.forEach((record) => {
                const char = roster.find(c => c.name.toLowerCase() === record.name.toLowerCase());
                unifiedRanking.push({
                    ...record,
                    className: char?.className
                });
            });

            // Ordenar por balance (Monto descendente)
            unifiedRanking.sort((a, b) => b.amount - a.amount);

            setRanking(unifiedRanking);
            setOrphanRecords(orphans);
            setCurrentQuota(q);
        } catch (e) {
            console.error("Failed to load data", e);
            showToast("Error al cargar datos.", "error");
        } finally {
            setLoadingRanking(false);
        }
    };

    const handleReturnGold = async (hash: string) => {
        if (!confirm("¿Seguro que quieres devolver (eliminar) este registro de oro huérfano?")) return;
        try {
            await quotaService.returnOrphanGold(hash);
            showToast("Registro eliminado/devuelto.", "success");
            loadData();
        } catch (e) {
            showToast("Error al procesar devolución.", "error");
        }
    };

    const handleTransferGold = async (targetPlayerToken: string) => {
        if (!transferringRecord) return;
        try {
            await quotaService.transferOrphanGold(transferringRecord.id, targetPlayerToken);
            showToast("Oro traspasado con éxito.", "success");
            setIsTransferModalOpen(false);
            setTransferringRecord(null);
            loadData();
        } catch (e) {
            showToast("Error al traspasar oro.", "error");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setParsedRecords([]);
            setUploadStats(null);
        }
    };

    const handleProcessFile = async () => {
        if (!file) return;
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
                const records = parseLuaTable(content);
                if (records.length === 0) {
                    showToast("No se encontraron registros válidos.", "error");
                } else {
                    setParsedRecords(records);
                    showToast(`${records.length} registros encontrados.`, "success");
                }
            }
            setIsProcessing(false);
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (parsedRecords.length === 0) return;
        setIsUploading(true);
        try {
            const stats = await quotaService.uploadQuota(parsedRecords);
            setUploadStats(stats);
            showToast(`Carga completa.Se detectaron ${stats.uploaded} nuevos registros.`, "success");
            setParsedRecords([]);
            setFile(null);
            loadData();
        } catch (e) {
            showToast("Error al subir registros.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const formatGold = (amount: number) => {
        return (amount / 10000).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + "g";
    };

    return (
        <div className="space-y-8 animate-fade-in p-6">
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-midnight-800/50 p-6 rounded-2xl border border-midnight-700 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-midnight-900 rounded-xl border border-midnight-700 shadow-xl">
                        <DollarSign className="text-yellow-500" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Gestión de Tesorería</h1>
                        <p className="text-midnight-400 text-sm font-medium uppercase tracking-widest">Aportes Semanales y Cuotas</p>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        onClick={async () => {
                            if (!confirm("⚠️ ATENCIÓN: Se eliminarán TODOS los registros de oro y auditorías de carga. Esta acción es irreversible. ¿Deseas continuar?")) return;
                            try {
                                setIsProcessing(true);
                                await quotaService.purgeAllQuotaData();
                                showToast("Tesorería reiniciada con éxito.", "success");
                                loadData();
                            } catch (e) {
                                showToast("Error al purgar datos.", "error");
                            } finally {
                                setIsProcessing(false);
                            }
                        }}
                        className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 flex items-center gap-3 shadow-lg shadow-red-500/5 group"
                    >
                        <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        Reiniciar Tesorería
                    </button>
                )}
            </header>

            <div className="bg-midnight-900/40 p-1 rounded-3xl border border-midnight-800 shadow-2xl">
                <div className="bg-midnight-800/40 p-8 rounded-[22px] border border-midnight-700/50 flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                            <Crown className="text-yellow-500" size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight mb-1">Cuota de Raid</h2>
                            <p className="text-midnight-400 text-sm font-medium">Monto fijo a descontar semanalmente</p>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-4 bg-midnight-900/80 p-3 rounded-2xl border border-midnight-700 shadow-inner">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 font-black text-sm">G</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className="bg-midnight-950 text-white font-black pl-10 pr-4 py-3 rounded-xl border border-midnight-800 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none w-40 text-right text-lg transition-all"
                                    id="quotaInput"
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    const input = document.getElementById('quotaInput') as HTMLInputElement;
                                    const val = parseFloat(input.value);
                                    if (!isNaN(val) && val > 0) {
                                        await quotaService.setRaidQuota(val);
                                        loadData();
                                        showToast(`Cuota actualizada a ${val} g`, 'success');
                                    }
                                }}
                                className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-8 rounded-xl transition-all shadow-[0_4px_15px_rgba(234,179,8,0.3)] hover:scale-105"
                            >
                                ASIGNAR
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="text-right px-8 py-4 bg-midnight-950/50 rounded-2xl border border-midnight-800/80 min-w-[200px] shadow-inner">
                            <span className="block text-[10px] text-midnight-500 uppercase font-black tracking-[0.2em] mb-1">Valor Actual</span>
                            <span className="text-3xl font-black text-white drop-shadow-glow">
                                {currentQuota ? formatGold(currentQuota) : '0g'}
                            </span>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={async () => {
                                    if (!confirm("¿Descontar la cuota actual?")) return;
                                    try {
                                        const count = await quotaService.applyRaidQuotaDiscount();
                                        showToast(`Aplicado a ${count} jugadores.`, 'success');
                                        loadData();
                                    } catch (e) {
                                        showToast("Error.", "error");
                                    }
                                }}
                                className="p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl transition-all hover:scale-110"
                            >
                                <History size={24} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {isAdmin && (
                    <div className="lg:col-span-1">
                        <div className="bg-midnight-800/40 p-6 rounded-2xl border border-midnight-700/50 sticky top-6">
                            <h2 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                                <UploadCloud className="text-void-light" size={20} /> Subir LUA
                            </h2>
                            <div className="space-y-4">
                                <div className="relative border-2 border-dashed border-midnight-700 rounded-2xl p-8 hover:border-void/50 transition-all group cursor-pointer text-center bg-midnight-950/30">
                                    <input ref={fileInputRef} type="file" accept=".lua" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <FileText className="mx-auto text-midnight-600 group-hover:text-void-light mb-4 transition-all duration-500 group-hover:scale-110" size={40} />
                                    <p className="text-xs text-midnight-500 group-hover:text-white transition-colors font-black uppercase tracking-widest">
                                        {file ? file.name : "Arrastra .lua"}
                                    </p>
                                </div>
                                {parsedRecords.length > 0 && (
                                    <div className="space-y-3 animate-scale-in">
                                        <div className="p-4 bg-void/5 border border-void/20 rounded-xl text-xs text-void-light font-black flex items-center justify-between">
                                            <div className="flex items-center gap-2"><CheckCircle size={14} /><span>{parsedRecords.length} REGISTROS</span></div>
                                        </div>
                                        <button onClick={handleUpload} disabled={isUploading} className="w-full py-4 bg-void hover:bg-void-light text-white rounded-xl font-black transition-all shadow-xl shadow-void/20 hover:scale-105">
                                            {isUploading ? 'SINCRONIZANDO...' : 'INTEGRAR DATOS'}
                                        </button>
                                    </div>
                                )}
                                {uploadStats && (
                                    <div className="p-4 bg-midnight-950 rounded-xl border border-midnight-700 text-[10px] space-y-2 uppercase font-black tracking-widest animate-fade-in shadow-inner">
                                        <p className="text-green-500 flex justify-between"><span>✓ Integrados</span><span>{uploadStats.uploaded}</span></p>
                                        <p className="text-midnight-600 flex justify-between"><span>⚠ Duplicados</span><span>{uploadStats.duplicates}</span></p>
                                    </div>
                                )}
                                {!parsedRecords.length && file && (
                                    <button onClick={handleProcessFile} disabled={isProcessing} className="w-full py-3 bg-midnight-700 hover:bg-midnight-600 text-white rounded-xl font-black transition-all shadow-lg active:scale-95">
                                        PREVISUALIZAR
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className={isAdmin ? "lg:col-span-3" : "lg:col-span-4"}>
                    <div className="space-y-10">
                        {/* Tabla Principal */}
                        <div className="bg-midnight-800/40 rounded-3xl border border-midnight-700/50 overflow-hidden shadow-2xl backdrop-blur-md">
                            <div className="p-6 border-b border-midnight-700/50 flex justify-between items-center bg-midnight-900/50">
                                <h3 className="font-black text-white uppercase tracking-[0.2em] text-xs flex items-center gap-3">
                                    <Crown size={16} className="text-yellow-500" /> Ranking Global de Oro
                                </h3>
                                <button onClick={loadData} className="p-2 text-midnight-500 hover:text-white transition-colors">
                                    <RotateCw size={16} className={loadingRanking ? "animate-spin" : ""} />
                                </button>
                            </div>
                            <div className="overflow-x-auto max-h-[700px] scrollbar-thin scrollbar-thumb-midnight-700">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-midnight-950/80 sticky top-0 z-10 text-midnight-500 uppercase text-[10px] tracking-widest font-black border-b border-midnight-700/50">
                                        <tr><th className="p-6 w-20 text-center">#</th><th className="p-6">Jugador Identificado</th><th className="p-6 text-right">Balance Total</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-midnight-700/20">
                                        {loadingRanking ? (
                                            <tr><td colSpan={3} className="p-20 text-center text-midnight-500 font-black animate-pulse">Calculando balances...</td></tr>
                                        ) : ranking.length === 0 ? (
                                            <tr><td colSpan={3} className="p-20 text-center text-midnight-600 font-black">Sin registros</td></tr>
                                        ) : (
                                            ranking.map((row, idx) => {
                                                const classColor = row.className ? getClassColor(row.className) : '#FFFFFF';
                                                return (
                                                    <tr key={idx} className="hover:bg-void/5 transition-all duration-300 group">
                                                        <td className="p-6 text-center">
                                                            {idx < 3 ? <div className="w-10 h-10 bg-midnight-900 rounded-xl flex items-center justify-center border border-midnight-700 mx-auto text-xl">{['🥇', '🥈', '🥉'][idx]}</div> : <span className="text-midnight-600 font-black text-lg">{idx + 1}</span>}
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-4">
                                                                {row.className && (
                                                                    <div className="w-10 h-10 rounded-xl bg-midnight-900 border border-midnight-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                                        <img
                                                                            src={`https://render.worldofwarcraft.com/us/icons/56/classicon_${row.className.toLowerCase().replace(/\s+/g, '')}.jpg`}
                                                                            alt={row.className}
                                                                            className="w-7 h-7 rounded-lg"
                                                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                                                        />
                                                                    </div >
                                                                )}
                                                                <div className="flex flex-col">
                                                                    <span className="text-xl font-black tracking-tight group-hover:translate-x-1 transition-transform" style={{ color: classColor }}>
                                                                        {row.name}
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        {row.isPlayerToken && (
                                                                            <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 font-black uppercase tracking-tighter">
                                                                                Verificado
                                                                            </span>
                                                                        )}
                                                                        {row.className && (
                                                                            <span className="text-[10px] text-midnight-500 uppercase font-black tracking-widest opacity-60">
                                                                                {row.className}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div >
                                                        </td >
                                                        <td className="p-6 text-right">
                                                            <span className={clsx("font-black text-2xl tracking-tighter", row.amount < 0 ? "text-red-500" : "text-yellow-500")}>
                                                                {formatGold(row.amount)}
                                                            </span>
                                                        </td>
                                                    </tr >
                                                );
                                            })
                                        )}
                                    </tbody >
                                </table >
                            </div >
                        </div >

                        {/* Tabla de Huérfanos (Solo Admin) */}
                        {
                            isAdmin && orphanRecords.length > 0 && (
                                <div className="bg-midnight-800/20 rounded-3xl border border-midnight-700/30 overflow-hidden shadow-xl animate-fade-in">
                                    <div className="p-5 border-b border-midnight-700/30 flex justify-between items-center bg-midnight-950/40">
                                        <h3 className="font-black text-midnight-200 uppercase tracking-widest text-[10px] flex items-center gap-2">
                                            <AlertCircle size={14} className="text-orange-500" /> Registros de Oro sin Identidad (Huérfanos)
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto max-h-[400px]">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-midnight-950/60 text-midnight-600 uppercase text-[9px] tracking-widest font-black">
                                                <tr>
                                                    <th className="p-4">Personaje LUA</th>
                                                    <th className="p-4">Monto</th>
                                                    <th className="p-4 text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-midnight-700/10">
                                                {orphanRecords.map((rec) => (
                                                    <tr key={rec.id} className="hover:bg-midnight-900/40 transition-colors">
                                                        <td className="p-4">
                                                            <span className="text-sm font-black text-midnight-300">{rec.name}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-sm font-black text-yellow-500/80">{formatGold(rec.amount)}</span>
                                                        </td>
                                                        <td className="p-4 text-right flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleReturnGold(rec.id)}
                                                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border border-red-500/20"
                                                            >
                                                                Devolver
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setTransferringRecord(rec);
                                                                    setIsTransferModalOpen(true);
                                                                }}
                                                                className="px-3 py-1.5 bg-void/20 hover:bg-void/40 text-void-light rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border border-void-light/20"
                                                            >
                                                                Traspasar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        }
                    </div >
                </div >
            </div >

            {/* Modal de Traspaso */}
            {
                isTransferModalOpen && transferringRecord && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-lg bg-midnight-900 border border-midnight-700 p-8 rounded-[40px] shadow-2xl space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Traspasar Oro</h3>
                                <p className="text-xs text-midnight-400 font-medium">
                                    Asignando <span className="text-yellow-500 font-black">{formatGold(transferringRecord.amount)}</span> de <span className="text-white font-black">{transferringRecord.name}</span>
                                </p>
                            </div>

                            <div className="max-h-80 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-midnight-700">
                                {ranking.map((player) => (
                                    <button
                                        key={player.id}
                                        onClick={() => handleTransferGold(player.id)}
                                        className="w-full flex items-center justify-between p-4 bg-midnight-950/50 hover:bg-void/20 border border-midnight-800 hover:border-void-light/30 rounded-2xl transition-all group"
                                    >
                                        <span className="font-black text-white group-hover:text-void-light transition-colors uppercase tracking-tight">{player.name}</span>
                                        <span className="text-[10px] font-black text-midnight-600 uppercase tracking-widest group-hover:text-void-light/60 transition-colors">Seleccionar</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsTransferModalOpen(false)}
                                className="w-full py-4 text-midnight-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
