import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface TanCalendarioProps {
    TanFechaSeleccionada: string;
    TanAlCambiarFecha: (fecha: string) => void;
    TanDiasConLoot: string[]; // Formato YYYY-MM-DD
}

export const TanCalendario: React.FC<TanCalendarioProps> = ({
    TanFechaSeleccionada,
    TanAlCambiarFecha,
    TanDiasConLoot
}) => {
    const [TanVistaMes, setTanVistaMes] = useState(new Date());
    const [TanEstaAbierto, setTanEstaAbierto] = useState(false);

    // Tan calcula los días del mes para que la cuadrícula sea perfecta
    const TanObtenerDiasMes = () => {
        const año = TanVistaMes.getFullYear();
        const mes = TanVistaMes.getMonth();
        const primerDia = new Date(año, mes, 1).getDay();
        const diasEnMes = new Date(año, mes + 1, 0).getDate();

        const dias = [];
        // Ajuste para que la semana empiece en Lunes (estilo EU/WoW)
        const diaInicio = primerDia === 0 ? 6 : primerDia - 1;

        for (let i = 0; i < diaInicio; i++) {
            dias.push(null);
        }
        for (let i = 1; i <= diasEnMes; i++) {
            dias.push(new Date(año, mes, i));
        }
        return dias;
    };

    const TanCambiarMes = (offset: number) => {
        setTanVistaMes(new Date(TanVistaMes.getFullYear(), TanVistaMes.getMonth() + offset, 1));
    };

    const TanFormatearFecha = (date: Date) => {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const TanMeses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const TanDiasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    return (
        <div className="relative">
            {/* Botón Activador del Calendario de Tan */}
            <button
                onClick={() => setTanEstaAbierto(!TanEstaAbierto)}
                className={clsx(
                    "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-500",
                    TanFechaSeleccionada
                        ? "bg-void/20 border-void-light/50 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                        : "bg-midnight-950/40 border-white/10 text-midnight-400 hover:border-white/20"
                )}
            >
                <CalendarIcon size={18} className={TanFechaSeleccionada ? "text-void-light" : ""} />
                <span className="text-xs font-black uppercase tracking-widest">
                    {TanFechaSeleccionada ? `Filtro: ${TanFechaSeleccionada}` : "Seleccionar Raid"}
                </span>
            </button>

            {/* El Panel del Calendario - Tan lo hace flotar con elegancia */}
            <AnimatePresence>
                {TanEstaAbierto && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-4 z-[9999] w-80 bg-[#05020a] border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl"
                    >
                        {/* Cabecera de Navegación */}
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={() => TanCambiarMes(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <ChevronLeft size={20} className="text-midnight-400" />
                            </button>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">
                                {TanMeses[TanVistaMes.getMonth()]} {TanVistaMes.getFullYear()}
                            </h4>
                            <button onClick={() => TanCambiarMes(1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <ChevronRight size={20} className="text-midnight-400" />
                            </button>
                        </div>

                        {/* Cuadrícula de Tan */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {TanDiasSemana.map(d => (
                                <div key={d} className="text-[10px] font-black text-midnight-600 text-center uppercase py-2">
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {TanObtenerDiasMes().map((dia, idx) => {
                                if (!dia) return <div key={`empty-${idx}`} />;

                                const fechaStr = TanFormatearFecha(dia);
                                const esHoy = TanFormatearFecha(new Date()) === fechaStr;
                                const esSeleccionado = TanFechaSeleccionada === fechaStr;
                                const tieneLoot = TanDiasConLoot.includes(fechaStr);

                                return (
                                    <button
                                        key={fechaStr}
                                        onClick={() => {
                                            TanAlCambiarFecha(fechaStr);
                                            setTanEstaAbierto(false);
                                        }}
                                        className={clsx(
                                            "relative aspect-square rounded-xl flex items-center justify-center text-[11px] font-bold transition-all duration-300",
                                            esSeleccionado
                                                ? "bg-void text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                                                : "hover:bg-white/5 text-midnight-300 hover:text-white",
                                            esHoy && !esSeleccionado && "border border-void/30"
                                        )}
                                    >
                                        {dia.getDate()}
                                        {/* Punto de notificación de Tan para días con historia de loot */}
                                        {tieneLoot && !esSeleccionado && (
                                            <div className="absolute bottom-1.5 w-1 h-1 bg-void-light rounded-full shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Pie del Calendario - Acceso rápido de Tan */}
                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-center">
                            <button
                                onClick={() => {
                                    TanAlCambiarFecha('');
                                    setTanEstaAbierto(false);
                                }}
                                className="text-[9px] font-black text-midnight-500 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                Mostrar Todos los Registros
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
