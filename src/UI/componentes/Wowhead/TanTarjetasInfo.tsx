import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Sword, Crown, Activity, Target, Zap, Wrench, Droplets } from 'lucide-react';

interface Props {
    TanClaseId: string;
    TanEspecId: string;
    TanColorClase: string;
}

// Tan: Definamos a dónde mandamos al usuario, porque no podemos poner un iframe directo (Wowhead no lo permite cómodamente para páginas completas).
// Mandaremos directamente a la pestaña correcta de la guía de la especialidad.
const TanOpcionesGuia = [
    { id: 'bis-gear', titulo: 'Bis Gear', icono: Crown, ruta: 'bis-gear', params: '' },
    { id: 'raid-drops', titulo: 'Raid Drops', icono: Sword, ruta: 'bis-gear', params: '#raid-drops' },
    { id: 'mythic-plus', titulo: 'Mythic+ Drops', icono: Shield, ruta: 'bis-gear', params: '#mythic-drops' },
    { id: 'trinkets', titulo: 'Trinkets', icono: Sparkles, ruta: 'bis-gear', params: '#trinkets' },
    { id: 'crafted', titulo: 'Crafter Gear', icono: Wrench, ruta: 'bis-gear', params: '#crafted-gear' },
    { id: 'crests', titulo: 'Crest Upgrade', icono: Zap, ruta: 'bis-gear', params: '#crest-upgrades' },
    { id: 'consumables', titulo: 'Consumables', icono: Droplets, ruta: 'enchants-gems-pve', params: '' },
    { id: 'stats', titulo: 'Stat Priority', icono: Activity, ruta: 'stat-priority-pve', params: '' },
    { id: 'talents', titulo: 'Talentos', icono: Target, ruta: 'talent-builds-pve', params: '' },
];

export const TanTarjetasInfo: React.FC<Props> = ({ TanClaseId, TanEspecId, TanColorClase }) => {
    // Tan: Identifiquemos el rol del monito porque Wowhead cambia sus links
    const getRolSuffix = (spec: string) => {
        const rolesEspeciales: Record<string, string> = {
            'blood': 'tank', 'vengeance': 'tank', 'guardian': 'tank',
            'brewmaster': 'tank', 'protection': 'tank',
            'restoration': 'healer', 'preservation': 'healer',
            'mistweaver': 'healer', 'holy': 'healer', 'discipline': 'healer',
            'augmentation': 'dps', // Aug es especial pero wowhead lo trata como dps
            'aldrachi-reaver': 'dps'
        };
        // Si está en la lista de arriba, saca su rol, si no, es DPS
        return rolesEspeciales[spec] || 'dps';
    };

    const rol = getRolSuffix(TanEspecId);

    // Tan: Miremos cómo armamos el link principal a Wowhead
    const TanArmarLink = (rutaBase: string, params: string) => {
        // Algunas rutas como consumibles no llevan el sufijo de rol en Wowhead
        let rutaFinal = rutaBase;

        if (rutaBase.includes('-pve')) {
            rutaFinal = `${rutaBase}-${rol}`;
        }

        return `https://www.wowhead.com/es/guide/classes/${TanClaseId}/${TanEspecId}/${rutaFinal}${params}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 mt-8"
        >
            <h2 className="text-xl font-bold text-white tracking-wide border-b border-midnight-700 pb-2 flex gap-2 items-center">
                3. Información Disponible en Wowhead
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                {TanOpcionesGuia.map((opcion) => {
                    return (
                        <a
                            key={opcion.id}
                            href={TanArmarLink(opcion.ruta, opcion.params)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col p-5 bg-midnight-900/40 rounded-xl border border-midnight-700 hover:bg-midnight-800 transition-all duration-300 shadow-lg relative overflow-hidden"
                        >
                            <div
                                className="absolute top-0 left-0 w-1 h-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                                style={{ backgroundColor: TanColorClase }}
                            />
                            <div className="flex items-center gap-3">
                                <div
                                    className="p-3 rounded-lg bg-midnight-950 border border-midnight-800 transition-all duration-300 group-hover:bg-[#00c3ff]/5"
                                    style={{ borderColor: `${TanColorClase}20` }}
                                >
                                    <opcion.icono
                                        size={24}
                                        className="transition-colors duration-300"
                                        style={{ color: TanColorClase }}
                                    />
                                </div>
                                <span className="font-semibold text-white tracking-wide group-hover:text-[#00c3ff] transition-colors">
                                    {opcion.titulo}
                                </span>
                            </div>
                            <div className="mt-4 text-xs text-midnight-400 group-hover:text-midnight-300">
                                Consultar guía oficial en Wowhead ↗
                            </div>
                        </a>
                    );
                })}
            </div>
        </motion.div>
    );
};
