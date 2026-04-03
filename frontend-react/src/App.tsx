import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TemplatesPage from './pages/TemplatesPage';
import TemplatesLayoutPatternsPage from './pages/TemplatesLayoutPatternsPage';
import TemplatesAssetsPage from './pages/TemplatesAssetsPage';
import ProjectSetupPage from './pages/ProjectSetupPage';
import ProjectEditorPage from './pages/ProjectEditorPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <TemplatesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates/layout-patterns"
        element={
          <ProtectedRoute>
            <TemplatesLayoutPatternsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates/assets"
        element={
          <ProtectedRoute>
            <TemplatesAssetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id/setup"
        element={
          <ProtectedRoute>
            <ProjectSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id/editor"
        element={
          <ProtectedRoute>
            <ProjectEditorPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
