import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import SignUpPage from './pages/SignUpPage';
import LogInPage from './pages/LogInPage';
import Preloader1 from './components/loaders.jsx';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import { useAuthStore } from './store/authStore.js';
import { ThemeProvider } from './components/ThemeProvider';

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <Preloader1 />;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-base-100 text-base-content">
        {!['/signin', '/signup'].includes(location.pathname) && <Navbar />}
        <Routes>
          <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/signin" state={{ from: location }} replace />} />
          <Route path='/signin' element={!authUser ? <LogInPage /> : <Navigate to="/" replace />} />
          <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to="/" replace />} />
          <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/signin" state={{ from: location }} replace />} />
          <Route path='/settings' element={authUser ? <SettingsPage /> : <Navigate to="/signin" state={{ from: location }} replace />} />
          <Route path='*' element={<Navigate to={authUser ? '/' : '/signin'} replace />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
};

export default App;