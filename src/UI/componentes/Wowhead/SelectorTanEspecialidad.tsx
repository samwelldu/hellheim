import React from 'react';
import type { TanEspecialidad } from '../../../data/TanClasesWow';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface Props {
    TanClaseActivaNombre: string;
    TanColorClase: string;
    TanEspecialidades: TanEspecialidad[];
    TanEspecificaSeleccionada: string | null;
    alSeleccionarEspecialidad: (id: string) => void;
}

// Tan: Ahora dibujamos los botones para las especialidades, solo si ya tiene una clase.
export const SelectorTanEspecialidad: React.FC<Props> = ({
    TanClaseActivaNombre,
    TanColorClase,
    TanEspecialidades,
    TanEspecificaSeleccionada,
    alSeleccionarEspecialidad
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 mt-8"
        >
            <h2 className="text-xl font-bold text-white tracking-wide border-b border-midnight-700 pb-2 flex gap-2 items-center">
                2. Especialidad de <span style={{ color: TanColorClase }}>{TanClaseActivaNombre}</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {TanEspecialidades.map((spec) => {
                    const TanActiva = TanEspecificaSeleccionada === spec.id;
                    const TanIconoUrl = `https://wow.zamimg.com/images/wow/icons/large/${spec.icono.toLowerCase()}.jpg`;

                    return (
                        <button
                            key={spec.id}
                            onClick={() => alSeleccionarEspecialidad(spec.id)}
                            className={clsx(
                                "flex items-center gap-4 p-3 rounded-xl border transition-all duration-300 group",
                                TanActiva
                                    ? "bg-midnight-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                    : "bg-midnight-900/50 border-midnight-700 hover:border-midnight-500 hover:bg-midnight-800"
                            )}
                            style={{
                                borderColor: TanActiva ? TanColorClase : undefined,
                            }}
                        >
                            <img
                                src={TanIconoUrl}
                                alt={spec.nombre}
                                className={clsx(
                                    "w-10 h-10 rounded-full border-2 transition-all duration-300",
                                    TanActiva ? "opacity-100" : "opacity-70 border-midnight-600 group-hover:opacity-100"
                                )}
                                style={{ borderColor: TanActiva ? TanColorClase : undefined }}
                            />
                            <span
                                className="text-sm font-semibold text-center"
                                style={{ color: TanActiva ? TanColorClase : '#e5e7eb' }}
                            >
                                {spec.nombre}
                            </span>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
};
