import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    MessageSquare,
    Shield,
    Check,
    X,
    Zap,
    Target,
    Trash2
} from 'lucide-react';
import { applicationService, type GuildApplication } from '../services/applicationService';
import { useToast } from '../context/ToastContext';
import { getClassColor } from '../utils/wowClasses';
import { getClassIconUrl, getSpecIconUrl } from '../utils/wowIcons';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const ApplicationsPage: React.FC = () => {
    const { showToast } = useToast();
    const [apps, setApps] = useState<GuildApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<GuildApplication['status'] | 'Todas'>('Todas');
    const [selectedApp, setSelectedApp] = useState<GuildApplication | null>(null);

    useEffect(() => {
        const unsubscribe = applicationService.subscribeApplications((data) => {
            setApps(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleUpdateStatus = async (id: string, status: GuildApplication['status']) => {
        try {
            await applicationService.updateStatus(id, status);
            showToast(`Estado actualizado a ${status} 🫡`, "success");
            if (selectedApp?.id === id) {
                setSelectedApp(prev => prev ? { ...prev, status } : null);
            }
        } catch (e) {
            showToast("Error al actualizar el estado.", "error");
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("¿Seguro que quieres eliminar esta postulación? 🫡")) return;

        try {
            await applicationService.deleteApplication(id);
            showToast("Postulación eliminada para siempre 🫡", "success");
            if (selectedApp?.id === id) setSelectedApp(null);
        } catch (e) {
            showToast("Vaya, no se pudo eliminar.", "error");
        }
    };

    const filteredApps = apps.filter(a => {
        const matchesSearch = a.characterName.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'Todas' || a.status === filter;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-void/20 rounded-full border border-void/30 flex items-center justify-center">
                        <Users className="text-void-light" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-midnight-500">Escaneando Candidatos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-void/10 rounded-2xl flex items-center justify-center border border-void/20 text-void-light">
                        <Users size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Postulaciones</h2>
                        <p className="text-midnight-500 text-[10px] font-black uppercase tracking-widest">Gestión de Reclutamiento Hellheim</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-600 group-focus-within:text-void-light transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar personaje..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-midnight-950/60 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-void/50 w-64 transition-all"
                        />
                    </div>
                    <div className="flex bg-midnight-950/60 rounded-xl p-1 border border-white/5">
                        {['Todas', 'Pendiente', 'Revisando', 'Aceptado'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={clsx(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter === f ? "bg-void text-white shadow-lg" : "text-midnight-500 hover:text-white"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredApps.map(app => (
                    <motion.div
                        key={app.id}
                        layoutId={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="bg-midnight-950/40 backdrop-blur-sm border border-white/5 rounded-3xl p-6 hover:border-void/50 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black">
                                    <img
                                        src={app.spec ? getSpecIconUrl(app.className, app.spec) : getClassIconUrl(app.className)}
                                        className="w-full h-full object-cover"
                                        alt={app.className}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg leading-none mb-1 group-hover:text-void-light transition-colors" style={{ color: getClassColor(app.className) }}>
                                        {app.characterName}
                                    </h3>
                                    <p className="text-[10px] text-midnight-500 font-bold uppercase tracking-widest">
                                        {app.spec} {app.className}
                                    </p>
                                </div>
                            </div>
                            <div className={clsx(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                app.status === 'Pendiente' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                    app.status === 'Revisando' ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' :
                                        app.status === 'Aceptado' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                            'bg-red-500/10 border-red-500/20 text-red-500'
                            )}>
                                {app.status}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Zap size={12} className="text-void-light" />
                                    <span className="text-[10px] uppercase font-black text-midnight-500">Maestría</span>
                                </div>
                                <span className="text-sm font-black text-white">{app.masteryLevel}/10</span>
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex-1 flex items-center gap-2 text-midnight-500">
                                    <MessageSquare size={14} />
                                    <span className="truncate">{app.discord}</span>
                                </div>
                                <div className="text-[9px] text-midnight-600 font-bold uppercase">
                                    Hace {Math.floor((Date.now() - app.createdAt) / (1000 * 60 * 60 * 24))}d
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Hover */}
                        <div className="absolute inset-0 bg-void/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                            <button className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl">
                                <Eye size={20} />
                            </button>
                            {app.status === 'Pendiente' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id!, 'Aceptado'); }}
                                    className="p-3 bg-green-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                                >
                                    <Check size={20} />
                                </button>
                            )}
                            <button
                                onClick={(e) => handleDelete(e, app.id!)}
                                className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedApp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-midnight-950 border border-white/10 rounded-[48px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-10 border-b border-white/5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-void-light shadow-xl shadow-void/20">
                                        <img src={getSpecIconUrl(selectedApp.className, selectedApp.spec)} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tighter" style={{ color: getClassColor(selectedApp.className) }}>{selectedApp.characterName}</h3>
                                        <p className="text-midnight-500 text-xs font-black uppercase tracking-widest">{selectedApp.spec} {selectedApp.className} • Maestría {selectedApp.masteryLevel}/10</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedApp(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-void-light flex items-center gap-2">
                                            <Target size={14} /> Objetivos en Midnight
                                        </h4>
                                        <p className="text-midnight-300 leading-relaxed italic bg-black/20 p-6 rounded-3xl border border-white/5">
                                            "{selectedApp.objectives}"
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-void-light flex items-center gap-2">
                                            <Shield size={14} /> Filosofía de Guild
                                        </h4>
                                        <p className="text-midnight-300 leading-relaxed italic bg-black/20 p-6 rounded-3xl border border-white/5">
                                            "{selectedApp.guildMeaning}"
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="bg-black/20 p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-2 text-center">
                                        <Clock size={20} className="text-midnight-500 mb-2" />
                                        <span className="text-[9px] font-black tracking-widest text-midnight-600 uppercase">Asistencia</span>
                                        <span className="font-black text-white uppercase">{selectedApp.isConstant}</span>
                                    </div>
                                    <div className="bg-black/20 p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-2 text-center">
                                        <Zap size={20} className="text-midnight-500 mb-2" />
                                        <span className="text-[9px] font-black tracking-widest text-midnight-600 uppercase">Battle Tag</span>
                                        <span className="font-black text-white">{selectedApp.battleTag}</span>
                                    </div>
                                    <div className="bg-[#5865F2]/10 p-6 rounded-3xl border border-[#5865F2]/20 flex flex-col items-center gap-2 text-center">
                                        <MessageSquare size={20} className="text-[#5865F2] mb-2" />
                                        <span className="text-[9px] font-black tracking-widest text-midnight-600 uppercase">Discord</span>
                                        <span className="font-black text-white">{selectedApp.discord}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border-t border-white/5 flex items-center justify-between bg-black/20 shrink-0">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id!, 'Aceptado')}
                                        className="flex items-center gap-3 px-8 py-4 bg-green-500 text-white font-black rounded-full uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg shadow-green-500/20"
                                    >
                                        <CheckCircle2 size={18} /> Aceptar Candidato
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id!, 'Rechazado')}
                                        className="flex items-center gap-3 px-8 py-4 bg-red-900/30 text-red-500 font-black rounded-full border border-red-500/20 uppercase tracking-widest text-xs hover:bg-red-900/50 transition-all"
                                    >
                                        <XCircle size={18} /> Rechazar
                                    </button>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, selectedApp.id!)}
                                    className="flex items-center gap-3 px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black rounded-full border border-red-500/20 uppercase tracking-widest text-xs transition-all"
                                >
                                    <Trash2 size={18} /> Eliminar Permanente
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(selectedApp.id!, 'Revisando')}
                                    className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-midnight-400 font-black rounded-full border border-white/5 uppercase tracking-widest text-xs transition-all"
                                >
                                    Poner en Revisión
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
