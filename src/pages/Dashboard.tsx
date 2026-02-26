import React, { useMemo, useState, useEffect } from 'react';
import { Sword, TrendingUp, Calendar, User, Zap, Loader2, ArrowUpRight, ArrowDownRight, Minus, Settings2, Save } from 'lucide-react';
import { clsx } from 'clsx';
import { useCollection } from '../hooks/useCollection';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getClassColor } from '../utils/wowClasses';
import { useAuth } from '../context/AuthContext';

interface AttendanceProfile {
    id: string;
    name: string;
    className: string;
    attendedRaids: number;
}

interface HistoryRecord {
    id: string;
    periodId: number;
    performanceColor: 'green' | 'yellow' | 'red';
    weeklyHistory: Record<string, number>;
    attendanceCount?: number;
    goldAmount?: number;
    snapshotAt: any;
}

interface CharacterProfile {
    id: string;
    name: string;
    weeklyHistory: Record<string, number>;
    mythic0Count: number;
}

interface QuoteRecord {
    id: string;
    name: string;
    amount: number;
}

interface QuotaUpload {
    id: string;
    name: string;
    amount: number;
    timestamp: number;
}

interface SeasonSettings {
    startDate: string; // ISO Date
    modules: {
        attendance: { active: boolean; startWeek: number };
        mythicPlus: { active: boolean; startWeek: number };
        quota: { active: boolean; startWeek: number };
    };
}

export const Dashboard: React.FC = () => {
    const { isAdmin } = useAuth();
    // Data fetching
    const { data: attendanceData, loading: loadingAttendance } = useCollection<AttendanceProfile>('attendance_roster');
    const { data: mythicData, loading: loadingMythic } = useCollection<CharacterProfile>('mythic_progress');
    const { data: mythicHistory } = useCollection<HistoryRecord>('mythic_history');
    const { data: quotaData, loading: loadingQuota } = useCollection<QuoteRecord>('quote');
    const { data: uploadData, loading: loadingUploads } = useCollection<QuotaUpload>('quota_uploads');

    // Metadata & Season Settings
    const [metadata, setMetadata] = useState({
        totalRaids: 0,
        raidQuota: 0,
        mythicRules: {
            requiredSlots: 1,
            levelSlot1: 2,
            levelSlot2: 2,
            levelSlot3: 2
        }
    });
    const [season, setSeason] = useState<SeasonSettings>({
        startDate: new Date().toISOString().split('T')[0],
        modules: {
            attendance: { active: true, startWeek: 1 },
            mythicPlus: { active: true, startWeek: 1 },
            quota: { active: true, startWeek: 1 }
        }
    });
    const [showSettings, setShowSettings] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsubscribeMeta = onSnapshot(doc(db, 'attendance_roster', 'metadata'), (doc) => {
            if (doc.exists()) setMetadata(prev => ({ ...prev, totalRaids: doc.data().totalRaids || 0 }));
        });
        const unsubscribeQuota = onSnapshot(doc(db, 'config', 'raid_quota'), (doc) => {
            if (doc.exists()) setMetadata(prev => ({ ...prev, raidQuota: doc.data().amount || 0 }));
        });
        const unsubscribeRules = onSnapshot(doc(db, 'config', 'mythic_rules'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setMetadata(prev => ({
                    ...prev,
                    mythicRules: {
                        requiredSlots: data.requiredSlots || 1,
                        levelSlot1: data.levelSlot1 || 2,
                        levelSlot2: data.levelSlot2 || 2,
                        levelSlot3: data.levelSlot3 || 2
                    }
                }));
            }
        });
        const unsubscribeSeason = onSnapshot(doc(db, 'config', 'season'), (doc) => {
            if (doc.exists()) setSeason(doc.data() as SeasonSettings);
        });
        return () => {
            unsubscribeMeta();
            unsubscribeQuota();
            unsubscribeRules();
            unsubscribeSeason();
        };
    }, []);

    const handleSaveSeason = async () => {
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'config', 'season'), season);
            setShowSettings(false);
        } catch (error) {
            console.error("Error saving season settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate relative week from season start
    const currentWeekRel = useMemo(() => {
        if (!season.startDate) return 1;
        const start = new Date(season.startDate).getTime();
        const now = Date.now();
        const diff = now - start;
        if (diff < 0) return 1;
        return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    }, [season.startDate]);

    const getWeekNumber = (timestamp: number) => {
        const date = new Date(timestamp);
        const day = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return { year: date.getUTCFullYear(), week: weekNo };
    };

    // Advanced Weekly Stats & Trend
    const weeklyTrend = useMemo(() => {
        if (!uploadData.length) return [];

        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const weeks: Record<string, { total: number, count: number, label: string }> = {};

        for (let i = 0; i < 4; i++) {
            const date = new Date(now - (i * oneWeek));
            const { year, week } = getWeekNumber(date.getTime());
            const key = `${year}-W${week}`;
            weeks[key] = { total: 0, count: 0, label: `Sem. ${week}` };
        }

        uploadData.forEach(up => {
            const { year, week } = getWeekNumber(up.timestamp || 0);
            const key = `${year}-W${week}`;
            if (weeks[key]) {
                weeks[key].total += up.amount;
                weeks[key].count++;
            }
        });

        return Object.entries(weeks).map(([key, data]) => ({
            key,
            value: data.total,
            label: data.label
        })).reverse();
    }, [uploadData]);

    // Process players and calculate performance
    const playersPerformance = useMemo(() => {
        if (!attendanceData.length) return [];

        const actualPlayers = attendanceData.filter(p => p.id !== 'metadata');
        const activeModules = [
            season.modules.attendance.active && currentWeekRel >= season.modules.attendance.startWeek,
            season.modules.mythicPlus.active && currentWeekRel >= season.modules.mythicPlus.startWeek,
            season.modules.quota.active && currentWeekRel >= season.modules.quota.startWeek
        ];
        const divisor = activeModules.filter(a => a).length || 1;

        return actualPlayers.map(player => {
            const mplus = mythicData.find(m => m.name?.toLowerCase() === player.name?.toLowerCase());
            const quota = quotaData.find(q => q.name?.toLowerCase() === player.name?.toLowerCase());

            let attendPct = metadata.totalRaids > 0 ? (player.attendedRaids / metadata.totalRaids) * 100 : 0;
            if (!activeModules[0]) attendPct = 0;

            let mplusPct = 0;
            if (activeModules[1] && mplus) {
                // Tan: Reutilizamos la lógica de ranuras de Míticas
                const history = mplus.weeklyHistory || {};
                const runs: number[] = [];
                Object.entries(history).forEach(([level, count]) => {
                    for (let i = 0; i < count; i++) runs.push(parseInt(level));
                });
                const sortedRuns = runs.sort((a, b) => b - a);

                // Slots en 1, 4, 8 runs
                const valSlot1 = sortedRuns.length >= 1 ? sortedRuns[0] : 0;
                const valSlot2 = sortedRuns.length >= 4 ? sortedRuns[3] : 0;
                const valSlot3 = sortedRuns.length >= 8 ? sortedRuns[7] : 0;

                const rules = metadata.mythicRules;
                let validSlots = 0;
                if (valSlot1 >= rules.levelSlot1) validSlots++;
                if (valSlot2 >= rules.levelSlot2) validSlots++;
                if (valSlot3 >= rules.levelSlot3) validSlots++;

                const required = rules.requiredSlots || 1;
                // Tan: Cálculo Proporcional (No binario)
                mplusPct = Math.min((validSlots / required) * 100, 100);
            }

            let quotaPct = metadata.raidQuota > 0 ? Math.min((quota?.amount || 0) / metadata.raidQuota * 100, 100) : 100;
            if (!activeModules[2]) quotaPct = 0;

            const globalPerf = Math.round((
                (activeModules[0] ? attendPct : 0) +
                (activeModules[1] ? mplusPct : 0) +
                (activeModules[2] ? quotaPct : 0)
            ) / divisor);

            return {
                name: player.name,
                class: player.className,
                attendPct: Math.round(attendPct),
                mplusPct: Math.round(mplusPct),
                quotaPct: Math.round(quotaPct),
                globalPerf: globalPerf,
                activeModules
            };
        }).sort((a, b) => b.globalPerf - a.globalPerf);
    }, [attendanceData, mythicData, quotaData, metadata, season, currentWeekRel]);

    // Global Stats
    const stats = useMemo(() => {
        const total = playersPerformance.length;
        if (total === 0) return { avgAttend: 0, avgMPlus: 0, avgQuota: 0, avgGlobal: 0, trend: 0 };

        const avgGlobal = Math.round(playersPerformance.reduce((acc, p) => acc + p.globalPerf, 0) / total);

        let trend = 0;
        if (weeklyTrend.length >= 2) {
            const last = weeklyTrend[weeklyTrend.length - 1].value;
            const prev = weeklyTrend[weeklyTrend.length - 2].value;
            if (prev > 0) trend = Math.round(((last - prev) / prev) * 100);
        }

        return {
            avgAttend: Math.round(playersPerformance.reduce((acc, p) => acc + p.attendPct, 0) / total),
            avgMPlus: Math.round(playersPerformance.reduce((acc, p) => acc + p.mplusPct, 0) / total),
            avgQuota: Math.round(playersPerformance.reduce((acc, p) => acc + p.quotaPct, 0) / total),
            avgGlobal,
            trend
        };
    }, [playersPerformance, weeklyTrend]);

    if ((loadingAttendance || loadingMythic || loadingQuota || loadingUploads) && !playersPerformance.length) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-void-light" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in p-4 md:p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-void/10 rounded-lg text-void-light border border-void/20">
                            <TrendingUp size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">ANALYTICS <span className="text-void-light">PRO</span></h1>
                    </div>
                    <p className="text-midnight-400 font-medium">Panel de control avanzado y métricas de rendimiento semanal.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {isAdmin && (
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={clsx(
                                "px-4 py-2 border rounded-xl backdrop-blur-sm flex items-center gap-2 transition-all",
                                showSettings ? "bg-void/20 border-void/50 text-white" : "bg-midnight-800/50 border-midnight-700 text-midnight-400 hover:text-white"
                            )}
                        >
                            <Settings2 size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Temporada</span>
                        </button>
                    )}
                    <div className="px-4 py-2 bg-midnight-800/50 border border-midnight-700 rounded-xl backdrop-blur-sm flex items-center gap-2">
                        <Calendar size={14} className="text-void-light" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Semana {currentWeekRel}
                        </span>
                    </div>
                </div>
            </header>

            {showSettings && (
                <div className="bg-void/5 border border-void/20 p-6 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <Settings2 className="text-void-light" size={20} /> Ajustes de Temporada
                        </h2>
                        <button
                            onClick={handleSaveSeason}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-void-light hover:bg-void text-white px-6 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Guardar Cambios
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-midnight-500 uppercase tracking-widest pl-1">Semana 1 (Inicio)</label>
                            <input
                                type="date"
                                value={season.startDate}
                                onChange={(e) => setSeason({ ...season, startDate: e.target.value })}
                                className="w-full bg-midnight-900 border border-midnight-700 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-void/50 transition-colors"
                            />
                        </div>

                        {Object.entries(season.modules).map(([key, config]) => (
                            <div key={key} className="p-4 bg-midnight-900/50 border border-midnight-700 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-white uppercase tracking-tighter">
                                        {key === 'attendance' ? 'Asistencia' : key === 'mythicPlus' ? 'Míticas+' : 'Cuota Oro'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.active}
                                            onChange={(e) => setSeason({
                                                ...season,
                                                modules: {
                                                    ...season.modules,
                                                    [key]: { ...config, active: e.target.checked }
                                                }
                                            })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-midnight-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-midnight-300 after:border-midnight-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-void"></div>
                                    </label>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-midnight-500 uppercase">Activar en Semana</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={config.startWeek}
                                        onChange={(e) => setSeason({
                                            ...season,
                                            modules: {
                                                ...season.modules,
                                                [key]: { ...config, startWeek: parseInt(e.target.value) || 1 }
                                            }
                                        })}
                                        className="w-full bg-midnight-800 border border-midnight-700 rounded-lg px-3 py-1.5 text-white font-bold text-sm outline-none focus:border-void-light/30"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Stats */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-midnight-800/40 border border-midnight-700 p-6 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap size={120} />
                        </div>
                        <p className="text-midnight-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Rendimiento Global</p>
                        <div className="flex items-end gap-3">
                            <h2 className="text-6xl font-black text-white">{stats.avgGlobal}%</h2>
                            <div className={clsx(
                                "flex items-center gap-1 mb-2 px-2 py-1 rounded-full text-[10px] font-bold",
                                stats.trend > 0 ? "bg-green-500/20 text-green-400" : stats.trend < 0 ? "bg-red-500/20 text-red-400" : "bg-midnight-700 text-midnight-400"
                            )}>
                                {stats.trend > 0 ? <ArrowUpRight size={12} /> : stats.trend < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                                {Math.abs(stats.trend)}%
                            </div>
                        </div>
                        <div className="mt-6 h-2 bg-midnight-900 rounded-full overflow-hidden border border-midnight-700">
                            <div className="h-full bg-void-light shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-1000" style={{ width: `${stats.avgGlobal}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-midnight-800/40 border border-midnight-700 p-6 rounded-3xl">
                        <p className="text-midnight-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Tendencia Semanal (Oro)</p>
                        <div className="flex items-end justify-between h-24 gap-2">
                            {weeklyTrend.map((w) => {
                                const max = Math.max(...weeklyTrend.map(v => v.value), 1);
                                const height = (w.value / max) * 100;
                                return (
                                    <div key={w.key} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="w-full bg-midnight-900 rounded-t-lg relative flex items-end overflow-hidden border border-midnight-700/50 h-full">
                                            <div
                                                className="w-full bg-void/40 group-hover:bg-void transition-all duration-500 border-t border-void-light/30"
                                                style={{ height: `${height}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-midnight-500 uppercase">{w.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sub Stats Cards */}
                <div className="space-y-4">
                    <div className={clsx(
                        "bg-midnight-900/50 border border-midnight-700 p-4 rounded-2xl flex items-center justify-between hover:border-void-light/30 transition-colors relative transition-opacity",
                        !(season.modules.attendance.active && currentWeekRel >= season.modules.attendance.startWeek) && "opacity-40 grayscale"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-midnight-800 rounded-xl text-void-light"><Calendar size={20} /></div>
                            <div>
                                <p className="text-[10px] font-black text-midnight-500 uppercase tracking-widest">Asistencia</p>
                                <p className="text-xl font-black text-white">{stats.avgAttend}%</p>
                            </div>
                        </div>
                        {!season.modules.attendance.active || currentWeekRel < season.modules.attendance.startWeek ?
                            <span className="text-[8px] font-black text-void-light border border-void/30 px-2 py-1 rounded">OFF</span> :
                            <ArrowUpRight size={20} className="text-midnight-600" />
                        }
                    </div>
                    <div className={clsx(
                        "bg-midnight-900/50 border border-midnight-700 p-4 rounded-2xl flex items-center justify-between hover:border-accent-cyan/30 transition-colors relative transition-opacity",
                        !(season.modules.mythicPlus.active && currentWeekRel >= season.modules.mythicPlus.startWeek) && "opacity-40 grayscale"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-midnight-800 rounded-xl text-accent-cyan"><Sword size={20} /></div>
                            <div>
                                <p className="text-[10px] font-black text-midnight-500 uppercase tracking-widest">Míticas+</p>
                                <p className="text-xl font-black text-white">{stats.avgMPlus}%</p>
                            </div>
                        </div>
                        {!season.modules.mythicPlus.active || currentWeekRel < season.modules.mythicPlus.startWeek ?
                            <span className="text-[8px] font-black text-accent-cyan border border-accent-cyan/30 px-2 py-1 rounded">OFF</span> :
                            <ArrowUpRight size={20} className="text-midnight-600" />
                        }
                    </div>
                    <div className={clsx(
                        "bg-midnight-900/50 border border-midnight-700 p-4 rounded-2xl flex items-center justify-between hover:border-yellow-500/30 transition-colors relative transition-opacity",
                        !(season.modules.quota.active && currentWeekRel >= season.modules.quota.startWeek) && "opacity-40 grayscale"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-midnight-800 rounded-xl text-yellow-500"><Zap size={20} /></div>
                            <div>
                                <p className="text-[10px] font-black text-midnight-500 uppercase tracking-widest">Cuota Oro</p>
                                <p className="text-xl font-black text-white">{stats.avgQuota}%</p>
                            </div>
                        </div>
                        {!season.modules.quota.active || currentWeekRel < season.modules.quota.startWeek ?
                            <span className="text-[8px] font-black text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded">OFF</span> :
                            <ArrowUpRight size={20} className="text-midnight-600" />
                        }
                    </div>
                </div>
            </div>

            {/* Performance Heatmap Table */}
            <div className="bg-midnight-800/40 rounded-3xl border border-midnight-700 overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="p-6 border-b border-midnight-700/50 flex justify-between items-center bg-midnight-900/30">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                            Matriz de Rendimiento
                        </h3>
                        <p className="text-xs text-midnight-400 font-medium">Historial de objetivos cumplidos por semana.</p>
                    </div>
                    <div className="flex gap-2">
                        {[
                            { color: 'bg-green-500', label: 'Efectivo' },
                            { color: 'bg-yellow-500', label: 'Parcial' },
                            { color: 'bg-red-500', label: 'Faltante' }
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 bg-midnight-900/50 px-3 py-1.5 rounded-lg border border-midnight-700">
                                <div className={clsx("w-2 h-2 rounded-full", item.color)}></div>
                                <span className="text-[10px] font-bold text-midnight-300 uppercase">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-midnight-900/50 text-[10px] font-black text-midnight-500 uppercase tracking-[0.2em]">
                                <th className="p-5 text-left border-r border-midnight-700/30 sticky left-0 bg-midnight-900/50 z-10 text-white min-w-[200px]">Personaje</th>
                                {/* Tan: Generamos columnas para las últimas semanas */}
                                {Array.from({ length: 6 }).map((_, i) => {
                                    const weekNum = currentWeekRel - (5 - i);
                                    if (weekNum <= 0) return null;
                                    return (
                                        <th key={i} className="p-5 text-center border-r border-midnight-700/30 min-w-[80px]">
                                            Sem {weekNum}
                                        </th>
                                    );
                                })}
                                <th className="p-5 text-center bg-void/5">Tendencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-midnight-700/20">
                            {playersPerformance.map((player) => {
                                const classColor = getClassColor(player.class);

                                // Tan: Buscamos el historial para este personaje
                                const charHistory = mythicHistory.filter(h => h.id.startsWith(player.name.toLowerCase()));

                                return (
                                    <tr key={player.name} className="hover:bg-void/5 transition-all duration-300 group">
                                        <td className="p-5 border-r border-midnight-700/20 sticky left-0 bg-midnight-900/95 backdrop-blur-md z-10">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
                                                    style={{ borderColor: `${classColor}33`, backgroundColor: `${classColor}11` }}
                                                >
                                                    <User size={14} style={{ color: classColor }} />
                                                </div>
                                                <div className="text-white font-bold text-sm tracking-tight truncate" style={{ color: classColor }}>
                                                    {player.name}
                                                </div>
                                            </div>
                                        </td>

                                        {Array.from({ length: 6 }).map((_, i) => {
                                            const weekOffset = 5 - i;
                                            const isCurrentWeek = i === 5;

                                            // Tan: Estimamos el periodId buscando el máximo en el historial y restando
                                            // Esto es más preciso que un índice simple
                                            const currentPeriod = Math.max(...mythicHistory.map(h => h.periodId), 0);
                                            const targetPeriod = currentPeriod - weekOffset;

                                            // Buscamos si hay un registro para este personaje en esta semana
                                            const historyEntry = charHistory.find(h => h.periodId === targetPeriod);

                                            let color = 'bg-midnight-800/20';
                                            let tooltip = `Semana ${currentWeekRel - weekOffset}`;

                                            if (isCurrentWeek) {
                                                color = player.globalPerf >= 80 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                                                    player.globalPerf >= 50 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' :
                                                        'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
                                                tooltip += " (Actual) - Pendiente de Publicar";
                                            } else if (historyEntry) {
                                                const hColor = historyEntry.performanceColor;
                                                color = hColor === 'green' ? 'bg-green-500/60' :
                                                    hColor === 'yellow' ? 'bg-yellow-500/60' : 'bg-red-500/60';
                                                tooltip += ` - Estado: ${hColor === 'green' ? 'Efectivo' : hColor === 'yellow' ? 'Parcial' : 'Faltante'}`;
                                            }

                                            return (
                                                <td key={i} className="p-2 border-r border-midnight-700/10 text-center">
                                                    <div className="flex justify-center">
                                                        <div
                                                            className={clsx(
                                                                "w-10 h-10 rounded-lg transition-all border border-black/20 shadow-inner group-hover:scale-110",
                                                                color
                                                            )}
                                                            title={tooltip}
                                                        ></div>
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        <td className="p-5 bg-void/5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <TrendingUp size={14} className={player.globalPerf >= 50 ? "text-green-400" : "text-red-400"} />
                                                <span className="text-xs font-black text-white">{player.globalPerf}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
