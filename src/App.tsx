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

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Landing Page Pública */}
            <Route path="/" element={<LandingPage />} />

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
            } />            <Route path="/perfil" element={
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

            <Route path="/users" element={
              <PrivateRoute>
                <Layout>
                  <UsersPage />
                </Layout>
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
