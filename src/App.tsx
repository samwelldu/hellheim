import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { LandingPage } from './pages/LandingPage';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PrivateRoute } from './components/layout/PrivateRoute';
import { Login } from './pages/Login';
import { UsersPage } from './pages/UsersPage';
import { KeystonesPage } from './pages/KeystonesPage';
import { AttendancePage } from './pages/AttendancePage';
import { QuotaPage } from './pages/QuotaPage';
import { Loot } from './UI/módulos/Loot/Loot';
import { CMSPage } from './pages/CMSPage';
import { AuthCallback } from './pages/AuthCallback';
import { PerfilPage } from './pages/PerfilPage';
import { ApplyPage } from './pages/ApplyPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { AdminConfigPage } from './pages/AdminConfigPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { Updates } from './UI/módulos/Actualizaciones/Updates';
import { WowheadGuia } from './UI/módulos/WowheadGuia/WowheadGuia';
import { ComoFunciona } from './UI/módulos/ComoFunciona/ComoFunciona';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Landing Page Pública */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/apply" element={<ApplyPage />} />

            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Dashboard y Secciones Privadas */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/mythicplus" element={
              <PrivateRoute>
                <Layout>
                  <KeystonesPage />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/quota" element={
              <PrivateRoute>
                <Layout>
                  <QuotaPage />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/attendance" element={
              <PrivateRoute>
                <Layout>
                  <AttendancePage />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/loot" element={
              <PrivateRoute>
                <Layout>
                  <Loot />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/actualizaciones" element={
              <PrivateRoute>
                <Layout>
                  <Updates />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/guias" element={
              <PrivateRoute>
                <Layout>
                  <WowheadGuia />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/como-funciona" element={
              <PrivateRoute>
                <Layout>
                  <ComoFunciona />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/perfil" element={
              <PrivateRoute>
                <Layout>
                  <PerfilPage />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/cms" element={
              <PrivateRoute>
                <Layout>
                  <CMSPage />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/applications" element={
              <PrivateRoute>
                <Layout>
                  <ApplicationsPage />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/users" element={
              <PrivateRoute>
                <Layout>
                  <UsersPage />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/admin/config" element={
              <PrivateRoute>
                <Layout>
                  <AdminConfigPage />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/onboarding" element={
              <PrivateRoute skipOnboardingCheck>
                <OnboardingPage />
              </PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
