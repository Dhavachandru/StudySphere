import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { type ReactNode, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { Layout } from './components/Layout';
import { Loading } from './components/ui/State';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Notes = lazy(() => import('./pages/Notes'));
const Planner = lazy(() => import('./pages/Planner'));
const Assignments = lazy(() => import('./pages/Assignments'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const History = lazy(() => import('./pages/History'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const CodingHub = lazy(() => import('./pages/CodingHub'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const ExamSchedule = lazy(() => import('./pages/ExamSchedule'));
const CodingProgress = lazy(() => import('./pages/CodingProgress'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Connect = lazy(() => import('./pages/Connect'));
const GroupStudy = lazy(() => import('./pages/GroupStudy'));

function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Restoring your session…" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function Lazy({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading label="Loading…" />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
      <Route path="/forgot" element={<PublicOnly><ForgotPassword /></PublicOnly>} />

      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Lazy><Dashboard /></Lazy>} />
        <Route path="/notes" element={<Lazy><Notes /></Lazy>} />
        <Route path="/planner" element={<Lazy><Planner /></Lazy>} />
        <Route path="/assignments" element={<Lazy><Assignments /></Lazy>} />
        <Route path="/bookmarks" element={<Lazy><Bookmarks /></Lazy>} />
        <Route path="/history" element={<Lazy><History /></Lazy>} />
        <Route path="/ai" element={<Lazy><AIAssistant /></Lazy>} />
        <Route path="/coding" element={<Lazy><CodingHub /></Lazy>} />
        <Route path="/analytics" element={<Lazy><Analytics /></Lazy>} />
        <Route path="/profile" element={<Lazy><Profile /></Lazy>} />
        <Route path="/settings" element={<Lazy><Settings /></Lazy>} />
        <Route path="/help" element={<Lazy><HelpCenter /></Lazy>} />
        <Route path="/exams" element={<Lazy><ExamSchedule /></Lazy>} />
        <Route path="/coding-progress" element={<Lazy><CodingProgress /></Lazy>} />
        <Route path="/notifications" element={<Lazy><Notifications /></Lazy>} />
        <Route path="/connect" element={<Lazy><Connect /></Lazy>} />
        <Route path="/group-study" element={<Lazy><GroupStudy /></Lazy>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
