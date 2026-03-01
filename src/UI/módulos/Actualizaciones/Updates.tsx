import React, { useState } from 'react';
import { History, ChevronDown, Rocket, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { changelogData } from './changelogData';

export const Updates: React.FC = () => {
    // Tan: Mantenemos abierto el primer acordeón (el más reciente) por defecto.
    const [openId, setOpenId] = useState<string | null>(changelogData[0]?.id || null);

    const toggleAccordion = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <div className="space-y-6 animate-fade-in p-4 md:p-8 max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-void/10 rounded-lg text-void-light border border-void/20">
                            <History size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">ACTUALIZACIONES</h1>
                    </div>
                    <p className="text-midnight-400 font-medium">Historial de cambios, mejoras y correcciones de la plataforma.</p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl border-void/30">
                    <Rocket size={14} className="text-void-light animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Versión Actual: {changelogData[0]?.version}
                    </span>
                </div>
            </header>

            <div className="space-y-4">
                {changelogData.map((log) => {
                    const isOpen = openId === log.id;

                    return (
                        <div
                            key={log.id}
                            className={clsx(
                                "glass rounded-2xl border transition-all duration-300 overflow-hidden",
                                isOpen ? "border-void/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]" : "border-white/5 hover:border-white/20"
                            )}
                        >
                            {/* Cabecera del Acordeón (Clickable) */}
                            <button
                                onClick={() => toggleAccordion(log.id)}
                                className="w-full text-left p-5 flex items-center justify-between bg-black/20 hover:bg-black/40 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "p-2 rounded-lg transition-colors",
                                        isOpen ? "bg-void/20 text-void-light" : "bg-midnight-800 text-midnight-400"
                                    )}>
                                        <History size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xs font-black uppercase tracking-widest text-void-light">
                                                {log.version}
                                            </span>
                                            <span className="text-[10px] font-bold text-midnight-500">
                                                {log.date}
                                            </span>
                                        </div>
                                        <h3 className={clsx(
                                            "font-bold text-base transition-colors",
                                            isOpen ? "text-white" : "text-midnight-300"
                                        )}>
                                            {log.title}
                                        </h3>
                                    </div>
                                </div>

                                <div className={clsx(
                                    "p-2 rounded-full transition-transform duration-300",
                                    isOpen ? "rotate-180 text-white bg-white/5" : "text-midnight-500"
                                )}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>

                            {/* Contenido Desplegable (Cambios) */}
                            <div
                                className={clsx(
                                    "grid transition-all duration-300 ease-in-out",
                                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                )}
                            >
                                <div className="overflow-hidden">
                                    <div className="p-5 pt-2 border-t border-white/5 bg-black/40">
                                        <ul className="space-y-3">
                                            {log.changes.map((change, index) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <div className="mt-0.5 mt-1 shrink-0">
                                                        <ChevronRight size={14} className="text-void-light/70" />
                                                    </div>
                                                    <span className="text-sm font-medium text-midnight-300 leading-relaxed">
                                                        {change}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
