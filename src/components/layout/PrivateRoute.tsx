import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PrivateRouteProps {
    children: React.ReactNode;
    skipOnboardingCheck?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, skipOnboardingCheck = false }) => {
    const { user, blizzardUser, mainCharacter, loading } = useAuth();

    if (loading) return null; // Tan: Evitamos parpadeos mientras cargamos

    if (!user && !blizzardUser) {
        return <Navigate to="/login" replace />;
    }

    // Tan: Vínculo obligatorio de Personaje Principal (Onboarding)
    if (!skipOnboardingCheck && !mainCharacter) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
};
