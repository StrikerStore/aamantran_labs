import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { isAuthenticated } from './lib/auth';

import Login     from './pages/Login';
import Templates from './pages/Templates';

// The preview page pulls in the QR library, so it is worth splitting out.
const Sandbox = lazy(() => import('./pages/Sandbox'));
const Preview = lazy(() => import('./pages/Preview'));
const Guide   = lazy(() => import('./pages/Guide'));

function ProtectedRoute({ children }) {
  const location = useLocation();
  if (isAuthenticated()) return children;
  const next = location.pathname + location.search;
  return <Navigate to={next && next !== '/' ? `/?next=${encodeURIComponent(next)}` : '/'} replace />;
}

function RouteFallback() {
  return <div className="spinner-wrap"><div className="spinner" /></div>;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="templates" element={<Templates />} />
            <Route path="sandbox"   element={<Suspense fallback={<RouteFallback />}><Sandbox /></Suspense>} />
            <Route path="preview"   element={<Suspense fallback={<RouteFallback />}><Preview /></Suspense>} />
            <Route path="guide"     element={<Suspense fallback={<RouteFallback />}><Guide /></Suspense>} />
          </Route>

          <Route path="*" element={<Navigate to="/templates" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
