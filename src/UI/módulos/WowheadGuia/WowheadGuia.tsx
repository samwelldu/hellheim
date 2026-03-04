import React, { useState } from 'react';
import { TanCatalogoClases } from '../../../data/TanClasesWow';
import { SelectorTanClase } from '../../componentes/Wowhead/SelectorTanClase';
import { SelectorTanEspecialidad } from '../../componentes/Wowhead/SelectorTanEspecialidad';
import { TanTarjetasInfo } from '../../componentes/Wowhead/TanTarjetasInfo';

// Tan: Hija, aquí ensamblamos todo el módulo de Wowhead, la lógica y el estado viven en este componente padre.
export const WowheadGuia: React.FC = () => {
    const [TanClaseSeleccionada, setTanClaseSeleccionada] = useState<string | null>(null);
    const [TanEspecSeleccionada, setTanEspecSeleccionada] = useState<string | null>(null);

    // Tan: Buscamos la clase seleccionada en nuestro catálogo
    const TanClaseDatos = TanCatalogoClases.find(c => c.id === TanClaseSeleccionada);

    const alCambiarClase = (id: string) => {
        setTanClaseSeleccionada(id);
        setTanEspecSeleccionada(null); // Al cambiar la clase, limpiamos la spec hija
    };

    const alCambiarEspec = (id: string) => {
        setTanEspecSeleccionada(id);
    };

    return (
        <div className="space-y-6">
            <header className="mb-8 border-b border-midnight-700/50 pb-6">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00c3ff] tracking-tight mb-2">
                    Guías del Juego
                </h1>
                <p className="text-midnight-300">
                    Selecciona tu clase y especialidad para obtener rápidamente enlaces precisos a las guías Bis, Talentos y más recursos provenientes de Wowhead.
                </p>
            </header>

            <div className="bg-midnight-950 p-6 rounded-2xl border border-midnight-700 shadow-2xl">
                {/* 1. Selector de Clases */}
                <SelectorTanClase
                    TanCatalogo={TanCatalogoClases}
                    TanSeleccionada={TanClaseSeleccionada}
                    alSeleccionarClase={alCambiarClase}
                />

                {/* 2. Selector de Especialidades */}
                {TanClaseDatos && (
                    <SelectorTanEspecialidad
                        TanClaseActivaNombre={TanClaseDatos.nombre}
                        TanColorClase={TanClaseDatos.colorHex}
                        TanEspecialidades={TanClaseDatos.especialidades}
                        TanEspecificaSeleccionada={TanEspecSeleccionada}
                        alSeleccionarEspecialidad={alCambiarEspec}
                    />
                )}

                {/* 3. Tarjetas de Información Wowhead External Links */}
                {TanClaseDatos && TanEspecSeleccionada && (
                    <TanTarjetasInfo
                        TanClaseId={TanClaseDatos.id}
                        TanEspecId={TanEspecSeleccionada}
                        TanColorClase={TanClaseDatos.colorHex}
                    />
                )}
            </div>
        </div>
    );
};
