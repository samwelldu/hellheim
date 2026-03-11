import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Info, Shield, Users, Scroll, Coins, History, BookOpen, LayoutDashboard, ChevronDown, CheckCircle2 } from 'lucide-react';

export const ComoFunciona: React.FC = () => {
    // Tan: Definimos los módulos para explicarlos de forma humana y clara
    const TanModulosApp = [
        {
            id: 'm-general',
            icono: LayoutDashboard,
            titulo: 'General (Dashboard)',
            descripcion: 'Aquí puedes ver un resumen rápido de tu actividad, próximos eventos y tu progreso general en la guild.',
            esRequisito: true,
            detalle: [
                'El estado general suma tus contribuciones en todos los submódulos.',
                'Un estado verde ("Ejemplar") significa que cumples o superas todos los requerimientos semanales (Asistencia, Míticas, Cuota).',
                'Un estado amarillo, naranja o rojo te informa qué área específica debes mejorar para la semana actual.'
            ]
        },
        {
            id: 'm-miticas',
            icono: Shield,
            titulo: 'Míticas+ (M+)',
            descripcion: 'Registra tus llaves míticas y asegura el armamento semanal de tu Gran Cámara (Great Vault).',
            esRequisito: true,
            detalle: [
                'Para alcanzar el estado "Completado" (Verde), debes cumplir TRES reglas simultáneas:',
                '1. Cofres exigidos: Completar la cantidad de m+ que te piden los oficiales.',
                '2. Niveles mínimos: Que el nivel de tus llaves alcance el rango exigido para cada slot habilitado.',
                '3. Item Level General: Que tu equipo actual alcance o supere el item level mínimo.',
                'Si haces los runs, pero no llegas con el nivel de la piedra o el item level, o te faltó 1 run, quedarás como "Regular" hasta solucionarlo.'
            ]
        },
        {
            id: 'm-asistencia',
            icono: Users,
            titulo: 'Asistencia',
            descripcion: 'Módulo para el control de la presencia de nuestros raiders en los eventos programados.',
            esRequisito: true,
            detalle: [
                'La asistencia se marca de forma automática al final de la raid mediante la carga del WarcraftLog oficial del evento.',
                'Si el porcentaje total de asistencia en el log refleja tu participación completa, tu estado será óptimo.',
                'Una inasistencia esporádica puede ocurrir, pero la falta de compromiso y ausencias constantes comprometerán tu spot en el core.'
            ]
        },
        {
            id: 'm-cuota',
            icono: Scroll,
            titulo: 'Cuota',
            descripcion: 'Sistema de contribución semanal de oro y/o materiales para el banco de hermandad.',
            esRequisito: true,
            detalle: [
                'El estado "Al día" se mantiene intacto siempre y cuando tu saldo de oro (o aporte) sea 0 o superior.',
                'Solo si tu saldo llega a estar en oro negativo (debajo de 0), el porcentaje de tu General empezará a bajar.',
                'Las cuotas nos permiten mantener reparaciones de raid, compra de frascos y buffos para la roster activa.'
            ]
        },
        {
            id: 'm-loot',
            icono: Coins,
            titulo: 'Loot',
            descripcion: 'Historial transparente de distribución del botín de banda.',
            esRequisito: false,
            detalle: [
                'Nos regimos por un sistema transparente (DKP, Loot Council, Dados, etc). Esta sección muestra tu historial de items recibidos.',
                'Mantener buenos niveles en Míticas, Asistencia y Cuota te otorga prioridad ante casos de empate.',
                'No hay un "Completado" semanal aquí, simplemente es tu carta de transparencia de lo que has ganado.'
            ]
        },
        {
            id: 'm-actualizaciones',
            icono: History,
            titulo: 'Actualizaciones',
            descripcion: 'Notas del parche que aplicamos aquí mismo en nuestra app para tu comodidad.',
            esRequisito: false,
            detalle: [
                'Listado completo de nuevas herramientas, reglas que fueron configuradas por los oficiales y bugs corregidos.',
                'Estar atento a este módulo te ayuda a usar la plataforma a su máxima capacidad.'
            ]
        },
        {
            id: 'm-guias',
            icono: BookOpen,
            titulo: 'Guías Wowhead',
            descripcion: 'Acceso directo a las mejores guías de clases y encuentros raider.',
            esRequisito: false,
            detalle: [
                'Usa este módulo para redirigirte exactamente a las rotaciones, talentos (Raids/M+) y equipo BIS (Best in Slot) actual de tu clase activa.',
                'Revisarlo periódicamente en cada cambio de parche es tu deber como jugador de core.'
            ]
        }
    ];

    const [TanModuloAbierto, setTanModuloAbierto] = useState<string | null>(null);

    const toggleModulo = (id: string) => {
        setTanModuloAbierto(TanModuloAbierto === id ? null : id);
    };

    const TanContainerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const TanItemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header del Módulo */}
            <div className="bg-midnight-900/50 backdrop-blur-md border border-midnight-700 p-8 rounded-2xl shadow-xl shadow-void/20">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-accent-cyan/10 rounded-xl border border-accent-cyan/20">
                        <Info className="w-8 h-8 text-accent-cyan" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                            ¿Cómo Funciona la App?
                        </h1>
                        <p className="text-midnight-300 mt-1">
                            Tu herramienta definitiva para mantenerte sincronizado con la guild.
                        </p>
                    </div>
                </div>
                <div className="prose prose-invert max-w-none text-midnight-200 mt-6">
                    <p className="leading-relaxed text-lg">
                        Esta aplicación fue diseñada para facilitar nuestra vida en Azeroth. No es solo una página,
                        es el núcleo operativo de nuestra hermandad. Aquí centralizamos todo lo importante: desde las
                        llaves míticas de la semana hasta la asistencia a raid y la distribución de botín.
                        A continuación, verás una explicación detallada de cada módulo disponible.
                    </p>
                </div>
            </div>

            {/* Grid de Módulos */}
            <motion.div
                variants={TanContainerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
            >
                {TanModulosApp.map((TanModulo) => (
                    <motion.div
                        key={TanModulo.id}
                        variants={TanItemVariants}
                        className={`bg-midnight-800/60 backdrop-blur-md border ${TanModuloAbierto === TanModulo.id
                            ? 'border-accent-cyan/50 shadow-[0_0_15px_rgba(0,195,255,0.1)]'
                            : 'border-midnight-700/60 hover:border-accent-cyan/30'
                            } rounded-xl overflow-hidden transition-all duration-300 group shadow-lg flex flex-col`}
                    >
                        {/* Cabecera Clicable */}
                        <div
                            className="p-5 cursor-pointer flex-1"
                            onClick={() => toggleModulo(TanModulo.id)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-colors ${TanModuloAbierto === TanModulo.id
                                        ? 'bg-accent-cyan/20 text-accent-cyan'
                                        : 'bg-midnight-900 text-accent-cyan group-hover:bg-accent-cyan/10'
                                        }`}>
                                        <TanModulo.icono className="w-6 h-6" />
                                    </div>
                                    <h3 className={`text-xl font-bold transition-colors ${TanModuloAbierto === TanModulo.id
                                        ? 'text-accent-cyan'
                                        : 'text-white group-hover:text-accent-cyan'
                                        }`}>
                                        {TanModulo.titulo}
                                    </h3>
                                </div>
                                <div className={`p-1.5 rounded-full transition-colors ml-4 ${TanModuloAbierto === TanModulo.id
                                    ? 'bg-accent-cyan/10 text-accent-cyan rotate-180'
                                    : 'bg-midnight-900/60 text-midnight-400 group-hover:text-white group-hover:bg-midnight-700'
                                    }`}>
                                    <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                                </div>
                            </div>
                            <p className="text-midnight-300/90 leading-snug text-sm pr-2">
                                {TanModulo.descripcion}
                            </p>
                        </div>

                        {/* Contenido Expandible (Acordeón) */}
                        <AnimatePresence>
                            {TanModuloAbierto === TanModulo.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="border-t border-midnight-700/60 bg-midnight-900/40"
                                >
                                    <div className="p-5 pt-4 space-y-2">
                                        {TanModulo.esRequisito && (
                                            <h4 className="text-white text-sm font-semibold flex items-center gap-2 mb-2">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-accent-cyan" />
                                                ¿Cómo estar al día? Reglas:
                                            </h4>
                                        )}
                                        {!TanModulo.esRequisito && (
                                            <h4 className="text-white text-sm font-semibold flex items-center gap-2 mb-2">
                                                <Info className="w-3.5 h-3.5 text-accent-cyan" />
                                                Información:
                                            </h4>
                                        )}
                                        <ul className="space-y-2">
                                            {TanModulo.detalle.map((item, i) => (
                                                <li key={i} className="text-midnight-200/90 text-xs leading-relaxed flex items-start gap-2">
                                                    <span className="text-accent-cyan/60 block mt-0.5">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </motion.div>

            {/* Cierre */}
            <div className="text-center mt-12 p-6 border-t border-midnight-800">
                <p className="text-midnight-400 font-medium tracking-wide">
                    Explora la app y mantente siempre conectado.
                </p>
            </div>
        </div>
    );
};
