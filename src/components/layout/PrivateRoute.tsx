import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, blizzardUser, loading } = useAuth();

    if (loading) return null; // Tan: Evitamos parpadeos mientras cargamos

    if (!user && !blizzardUser) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
