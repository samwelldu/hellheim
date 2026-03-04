import React from 'react';
import type { TanClaseInfo } from '../../../data/TanClasesWow';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface Props {
    TanCatalogo: TanClaseInfo[];
    TanSeleccionada: string | null;
    alSeleccionarClase: (id: string) => void;
}

// Tan: Hija, aquí dibujamos los botones para que elija su clase.
export const SelectorTanClase: React.FC<Props> = ({ TanCatalogo, TanSeleccionada, alSeleccionarClase }) => {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white tracking-wide border-b border-midnight-700 pb-2">
                1. Selecciona tu Clase
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
                {TanCatalogo.map((clase) => {
                    const TanActiva = TanSeleccionada === clase.id;
                    const TanIconoUrl = `https://wow.zamimg.com/images/wow/icons/large/${clase.icono.toLowerCase()}.jpg`;

                    return (
                        <motion.button
                            key={clase.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => alSeleccionarClase(clase.id)}
                            className={clsx(
                                "relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-300",
                                TanActiva
                                    ? "bg-midnight-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                    : "bg-midnight-900/50 border-midnight-700 hover:border-midnight-500 hover:bg-midnight-800"
                            )}
                            style={{
                                borderColor: TanActiva ? clase.colorHex : undefined,
                                boxShadow: TanActiva ? `0 0 15px ${clase.colorHex}40` : undefined
                            }}
                        >
                            <img
                                src={TanIconoUrl}
                                alt={clase.nombre}
                                className={clsx(
                                    "w-12 h-12 rounded-lg border-2 transition-all duration-300",
                                    TanActiva ? "border-transparent" : "border-midnight-600 grayscale hover:grayscale-0"
                                )}
                                style={{ borderColor: TanActiva ? clase.colorHex : undefined }}
                            />
                            <span
                                className="text-xs font-semibold text-center mt-1"
                                style={{ color: TanActiva ? clase.colorHex : '#9ca3af' }}
                            >
                                {clase.nombre}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
