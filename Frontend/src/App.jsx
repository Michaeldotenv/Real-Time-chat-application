import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./components/Navbar";
import SignUpPage from './pages/SignUpPage';
import LogInPage from './pages/LoginPage';
import Preloader1 from './components/loaders.jsx';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import { useAuthStore } from './store/authStore.js';
import { ThemeProvider } from './components/ThemeProvider';

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <Preloader1 />;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-base-100 text-base-content">
        <Navbar />
        <Routes>
          <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/signin" replace />} />
          <Route path='/signin' element={!authUser ? <LogInPage /> : <Navigate to="/" replace />} />
          <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to="/" replace />} />
          <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/signin" replace />} />
          <Route path='/settings' element={authUser ? <SettingsPage /> : <Navigate to="/signin" replace />} />
          <Route path='*' element={<Navigate to={authUser ? '/' : '/signin'} replace />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
};

export default App;
