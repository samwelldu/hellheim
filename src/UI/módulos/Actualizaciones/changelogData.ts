export interface ChangelogEntry {
    id: string;
    version: string;
    date: string;
    title: string;
    changes: string[];
}

export const changelogData: ChangelogEntry[] = [
    {
        id: "v1.2.0",
        version: "v1.2.0",
        date: "01/03/2026",
        title: "Actualización: Automatización y Seguridad de Roster",
        changes: [
            "Adición de módulo \"Actualizaciones\"",
            "Fix: Sincronización de usuarios en módulo Usuarios de administradores",
            "Fix: Entrega de roles a usuarios de BattleTag",
            "Fix: Módulo \"Cuota\" -> Se soluciona el mapeo de personajes entre si.",
            "Fix: Módulo \"Cuota\" -> Ahora espera la asistencia para activar el descuento y muestra a quienes lo realizará.",
            "Se quita el botón \"Añadir personaje\" de todos los módulos, para generar automatización del sistema"
        ]
    },
    {
        id: "v1.1.0",
        version: "v1.1.0",
        date: "01/03/2026",
        title: "Actualización: Cambios en interfaz de usuario",
        changes: [
            "Filas de módulos más compactas",
            "Módulo nuevo 'Actualizaciones' para roles = TODOS/ADMIN/MIEMBRO",
            "Ordenamiento alfabético en listas de personajes",
            "Ajustes de padding y lectura de información densa"
        ]
    },
    {
        id: "v1.0.5",
        version: "v1.0.5",
        date: "28/02/2026",
        title: "Corrección: Módulo de Inicio de Sesión",
        changes: [
            "Solución a permisos insuficientes de Firebase",
            "Corrección de carga infinita en Landing Page por BBDD vacía",
            "Ajustes en el servicio CMS de sincronización de noticias"
        ]
    }
];
