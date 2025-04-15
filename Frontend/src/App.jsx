import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import SignUpPage from './pages/SignUpPage';
import LogInPage from './pages/LogInPage';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import { ThemeProvider } from './components/ThemeProvider';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  const location = useLocation();
  const showNavbar = !['/signin', '/signup'].includes(location.pathname);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-base-100 text-base-content">
        {showNavbar && <Navbar />}
        <Routes>
          <Route path="/signin" element={<LogInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={
            <Navigate to="/signin" replace />
          } />
        </Routes>
      </div>
    </ThemeProvider>
  );
};

export default App;