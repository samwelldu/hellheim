import React, { useState } from 'react';
import { Settings, Trash2, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';

export const AdminConfigPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isPurging, setIsPurging] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const handlePurge = async () => {
        if (confirmText !== 'PURGAR') return;

        setIsPurging(true);
        try {
            await adminService.TanPurgarBaseDeDatos(user?.email || '');
            showToast('Base de datos purgada con éxito. Sistema limpio para producción.', 'success');
            setShowConfirm(false);
            setConfirmText('');
        } catch (error) {
            showToast('Error crítico durante la purga.', 'error');
        } finally {
            setIsPurging(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in p-6">
            {/* Header */}
            <div className="flex items-center gap-4 glass p-6 relative">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 shadow-lg">
                    <Settings className="text-void-light" size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Configuración del Sistema</h1>
                    <p className="text-midnight-400 text-sm">Herramientas de administración y mantenimiento</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Purge Card */}
                <div className="glass p-6 hover:border-red-900/30 transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-900/20 text-red-500 rounded-lg group-hover:scale-110 transition-transform">
                                <Trash2 size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Mantenimiento de Datos</h2>
                        </div>
                    </div>

                    <p className="text-midnight-400 text-sm mb-6 leading-relaxed">
                        Esta acción eliminará todos los registros operativos de la base de datos (Míticas+, Asistencia, Cuotas, Postulaciones).
                        <span className="text-red-400 font-bold ml-1 italic">Este proceso es irreversible.</span>
                    </p>

                    {!showConfirm ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
                        >
                            <Trash2 size={16} />
                            Purgar Base de Datos
                        </button>
                    ) : (
                        <div className="space-y-4 animate-slide-up">
                            <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-xl flex items-center gap-3">
                                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                                <p className="text-[11px] text-red-400 font-bold uppercase tracking-wide leading-tight">
                                    Escribe "PURGAR" para confirmar la destrucción de los datos operativos.
                                </p>
                            </div>
                            <input
                                type="text"
                                placeholder="Escribe PURGAR aquí"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                className="w-full bg-black/60 border border-red-900/30 rounded-xl p-3 text-white text-center font-mono focus:border-red-500 focus:outline-none transition-all"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs transition-all border border-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={confirmText !== 'PURGAR' || isPurging}
                                    onClick={handlePurge}
                                    className={clsx(
                                        "flex-[2] py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                                        confirmText === 'PURGAR' ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20" : "bg-black/40 text-midnight-600 cursor-not-allowed border border-white/5"
                                    )}
                                >
                                    {isPurging ? <RefreshCw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                                    {isPurging ? 'Ejecutando Purga...' : 'Confirmar Destrucción'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Card (Future implementation placeholders) */}
                <div className="glass p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Settings size={120} className="animate-spin-slow" />
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight mb-4 flex items-center gap-3">
                        <CheckCircle className="text-emerald-500" size={20} />
                        Estado del Sistema
                    </h2>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-xs text-midnight-400 font-medium">Conexión Firebase</span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-xs text-midnight-400 font-medium">Blizzard Proxy</span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">ACTIVO</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5 opacity-50">
                            <span className="text-xs text-midnight-400 font-medium">Modo Producción</span>
                            <span className="text-[10px] bg-void/10 text-void-light px-2 py-0.5 rounded-full border border-void/20 font-bold uppercase">Staging</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
