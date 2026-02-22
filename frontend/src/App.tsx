import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// We will create these screens next
import LoginScreen from '../src/screens/LoginScreen';
import SignupScreen from '../src/screens/SignupScreen';
import DashboardScreen from '../src/screens/DashboardScreen';
import VideoPlayerScreen from '../src/screens/VideoPlayerScreen';
import SettingsScreen from '../src/screens/SettingsScreen';

// Navbar wrapper
import Navbar from '../src/components/Navbar';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-center animate-fade-in" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={
        <PublicRoute>
          <LoginScreen />
        </PublicRoute>
      } />

      <Route path="/signup" element={
        <PublicRoute>
          <SignupScreen />
        </PublicRoute>
      } />

      {/* Protected Routes with Navbar */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <>
            <Navbar />
            <DashboardScreen />
          </>
        </ProtectedRoute>
      } />

      <Route path="/video/:id" element={
        <ProtectedRoute>
          <>
            <Navbar />
            <VideoPlayerScreen />
          </>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <>
            <Navbar />
            <SettingsScreen />
          </>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
