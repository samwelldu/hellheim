import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Shield,
    Scroll,
    Users,
    Menu,
    X,
    LogOut,
    LayoutDashboard,
    Coins,
    User,
    Settings,
    FileText
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const navItems = [
    { name: 'General', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Míticas+ (M+)', path: '/mythicplus', icon: Shield },
    { name: 'Asistencia', path: '/attendance', icon: Users },
    { name: 'Cuota', path: '/quota', icon: Scroll },
    { name: 'Loot', path: '/loot', icon: Coins },
    { name: 'Perfil', path: '/perfil', icon: User },
    { name: 'Postulaciones', path: '/applications', icon: Users },
    { name: 'Usuarios', path: '/users', icon: Shield },
    { name: 'CMS', path: '/cms', icon: FileText },
    { name: 'Configuración', path: '/admin/config', icon: Settings },
];

export const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const { user, blizzardUser, isAdmin, setBlizzardUser } = useAuth();
    const navigate = useNavigate();

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleLogout = async () => {
        try {
            // Tan: Limpiamos ambos mundos (Firebase y Blizzard)
            if (user) await signOut(auth);
            if (blizzardUser) setBlizzardUser(null);

            navigate('/login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    }

    // Tan: Solo los oficiales ven herramientas avanzadas
    const TanMenuItems = navItems.filter(item => {
        if (item.path === '/cms' || item.path === '/users' || item.path === '/applications' || item.path === '/admin/config') {
            return isAdmin;
        }
        return true;
    });

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={toggleOpen}
                className="fixed top-4 left-4 z-50 p-2 bg-midnight-800 rounded-md border border-midnight-600 md:hidden text-void-light"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Container */}
            <AnimatePresence>
                {(isOpen || window.innerWidth >= 768) && (
                    <motion.aside
                        initial={{ x: -250 }}
                        animate={{ x: 0 }}
                        exit={{ x: -250 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={clsx(
                            "fixed inset-y-0 left-0 z-40 w-64 bg-midnight-900/95 backdrop-blur-xl border-r border-midnight-700 shadow-2xl shadow-void/10",
                            "md:translate-x-0 transform", // Always visible on desktop
                            !isOpen && "hidden md:block" // Force block on desktop
                        )}
                    >
                        <div className="flex flex-col h-full p-6">
                            {/* Logo / Header */}
                            <div className="mb-10 text-center">
                                <h1 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-void-light to-accent-cyan animate-pulse">
                                    HELLHEIM
                                </h1>
                                {blizzardUser ? (
                                    <div className="mt-2 text-[10px] font-black p-1 bg-[#00c3ff]/10 border border-[#00c3ff]/20 rounded-md text-[#00c3ff] uppercase tracking-widest shadow-[0_0_10px_rgba(0,195,255,0.1)]">
                                        {blizzardUser.displayName} ⚔️
                                    </div>
                                ) : (
                                    <p className="text-sm text-midnight-400 tracking-wider mt-1">MIDNIGHT</p>
                                )}
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 space-y-2">
                                {TanMenuItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) => clsx(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group",
                                            isActive
                                                ? "bg-[#00c3ff]/10 text-[#00c3ff] border border-[#00c3ff]/20 shadow-[0_0_15px_rgba(0,195,255,0.15)]"
                                                : "text-midnight-300 hover:bg-midnight-800 hover:text-white hover:pl-5"
                                        )}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <item.icon size={20} className={clsx(
                                            "transition-colors",
                                            item.path === '/perfil' ? "text-[#00c3ff]" : "group-hover:text-accent-cyan"
                                        )} />
                                        <span className="font-medium tracking-wide">{item.name}</span>
                                    </NavLink>
                                ))}
                            </nav>

                            {/* Logout Button */}
                            <div className="px-4 py-2 mt-4 border-t border-midnight-700/50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-midnight-800 hover:text-red-300 transition-all duration-300 group"
                                >
                                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                                    <span className="font-medium tracking-wide">Cerrar Sesión</span>
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="mt-auto pt-6 border-t border-midnight-700 text-center">
                                <p className="text-xs text-midnight-500">For the Horde?</p>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};
