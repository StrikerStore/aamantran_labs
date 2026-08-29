import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { isAuthenticated } from './lib/auth';

import Login     from './pages/Login';
import Templates from './pages/Templates';

// The test page pulls in the QR library, so it is worth splitting out.
const Test  = lazy(() => import('./pages/Test'));
const Guide = lazy(() => import('./pages/Guide'));

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
            <Route path="test"      element={<Suspense fallback={<RouteFallback />}><Test /></Suspense>} />
            <Route path="guide"     element={<Suspense fallback={<RouteFallback />}><Guide /></Suspense>} />
          </Route>

          <Route path="*" element={<Navigate to="/templates" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
