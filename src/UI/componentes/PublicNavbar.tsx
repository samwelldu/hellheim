import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Inicio', href: '#hero' },
        { name: 'Noticias', href: '#news' },
        { name: 'Reclutamiento', href: '#recruitment' },
        { name: 'Postular', path: '/apply' },
    ];

    return (
        <nav className={clsx(
            "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 lg:px-12",
            isScrolled ? "py-4 bg-[#05020a]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl" : "py-8 bg-transparent"
        )}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo Area */}
                <Link to="/" className="group/logo flex items-center gap-3">
                    <img
                        src="/logo_hellheim_ice.png"
                        alt="Hellheim"
                        className="w-20 md:w-28 h-auto object-contain transition-all duration-500 group-hover/logo:scale-110 drop-shadow-[0_0_15px_rgba(0,195,255,0.3)]"
                    />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        link.path ? (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
                            >
                                {link.name}
                            </Link>
                        ) : (
                            <a
                                key={link.name}
                                href={link.href}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
                            >
                                {link.name}
                            </a>
                        )
                    ))}

                    <div className="w-[1px] h-4 bg-white/10 mx-2" />

                    <Link
                        to={user ? "/dashboard" : "/login"}
                        className="group flex items-center gap-3 px-6 py-2.5 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500"
                    >
                        {user ? "Perfil Jugador" : "Acceso Jugadores"}
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-white/70 hover:text-white"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden overflow-hidden bg-[#05020a] border-t border-white/5 mt-4 rounded-2xl"
                    >
                        <div className="flex flex-col p-6 gap-6">
                            {navLinks.map((link) => (
                                link.path ? (
                                    <Link
                                        key={link.name}
                                        to={link.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-xs font-black uppercase tracking-widest text-white/60"
                                    >
                                        {link.name}
                                    </Link>
                                ) : (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-xs font-black uppercase tracking-widest text-white/60"
                                    >
                                        {link.name}
                                    </a>
                                )
                            ))}
                            <Link
                                to={user ? "/dashboard" : "/login"}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-center gap-3 py-4 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest"
                            >
                                {user ? "Perfil Jugador" : "Acceso Jugadores"}
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
