import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { PageLoader } from './components/ui/Common.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Workspace from './pages/Workspace.jsx';
import History from './pages/History.jsx';
import Templates from './pages/Templates.jsx';
import TemplateEditor from './pages/TemplateEditor.jsx';
import Settings from './pages/Settings.jsx';
import AdminPage from './pages/Admin.jsx';
import Guides from './pages/Guides.jsx';
import GuideArticle from './pages/GuideArticle.jsx';
import SharedTemplate from './pages/SharedTemplate.jsx';
import NotFound from './pages/NotFound.jsx';
import JoinGroupPopup from './components/JoinGroupPopup.jsx';

const Writing = lazy(() => import('./pages/Writing.jsx'));
function WritingRoute() {
  return <Protected><Suspense fallback={<PageLoader label="Memuat editor…" />}><Writing /></Suspense></Protected>;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <PageLoader label="Menyiapkan workspace…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <PageLoader label="Menyiapkan workspace…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <PageLoader label="Memuat…" />
      </div>
    );
  }
  if (user) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/panduan" element={<Guides />} />
        <Route path="/panduan/:slug" element={<GuideArticle />} />
        <Route path="/t/:shareId" element={<SharedTemplate />} />
        <Route path="/app" element={<Protected><Dashboard /></Protected>} />
        <Route path="/app/writing" element={<WritingRoute />} />
        <Route path="/app/writing/:id" element={<WritingRoute />} />
        <Route path="/app/documents" element={<Protected><History /></Protected>} />
        <Route path="/app/documents/new" element={<Protected><Workspace /></Protected>} />
        <Route path="/app/documents/:id" element={<Protected><Workspace /></Protected>} />
        <Route path="/app/templates" element={<Protected><Templates /></Protected>} />
        <Route path="/app/templates/new" element={<Protected><TemplateEditor /></Protected>} />
        <Route path="/app/templates/:id" element={<Protected><TemplateEditor /></Protected>} />
        <Route path="/app/settings" element={<Protected><Settings /></Protected>} />
        <Route path="/app/admin" element={<AdminOnly><AdminPage /></AdminOnly>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <JoinGroupPopup />
    </>
  );
}
