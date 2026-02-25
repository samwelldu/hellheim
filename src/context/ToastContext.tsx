import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={clsx(
                                "pointer-events-auto min-w-[320px] max-w-md p-4 rounded-xl border flex items-start gap-3 shadow-2xl backdrop-blur-md",
                                toast.type === 'success' && "bg-green-500/10 border-green-500/20 text-green-400",
                                toast.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-400",
                                toast.type === 'info' && "bg-void/20 border-void-light/30 text-void-light"
                            )}
                        >
                            <div className="shrink-0 mt-0.5">
                                {toast.type === 'success' && <CheckCircle2 size={18} />}
                                {toast.type === 'error' && <AlertCircle size={18} />}
                                {toast.type === 'info' && <Info size={18} />}
                            </div>
                            <div className="flex-1 text-sm font-medium leading-tight">
                                {toast.message}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
