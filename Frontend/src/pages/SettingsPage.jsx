import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Moon, Sun } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const { theme, changeTheme, themes } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const handleThemeChange = (id) => {
    setSelectedTheme(id);
  };

  const saveTheme = () => {
    changeTheme(selectedTheme);
    navigate('/');
  };

  const cancelChanges = () => {
    changeTheme(theme); // Re-apply current theme
    navigate('/');
  };

  return (
    <motion.div
      className="min-h-screen bg-base-100 text-base-content pt-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <main className="container mx-auto px-4 py-6 max-w-xl">
        <div className="flex items-center mb-6">
          <motion.button
            onClick={cancelChanges}
            className="btn btn-ghost btn-circle mr-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft />
          </motion.button>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <motion.div className="ml-auto">
            <motion.button
              onClick={saveTheme}
              className="btn btn-primary btn-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Save Changes
            </motion.button>
          </motion.div>
        </div>

        <motion.div
          className="card bg-base-200 shadow-xl border border-base-300 backdrop-blur-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="card-body space-y-6">
            <h2 className="card-title text-xl">Theme Mode</h2>
            <div className="flex gap-4">
              {themes.map(({ id, name }) => (
                <motion.div
                  key={id}
                  onClick={() => handleThemeChange(id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`cursor-pointer flex items-center justify-between w-full px-5 py-4 rounded-lg border transition-all duration-300 shadow-sm ${
                    selectedTheme === id
                      ? 'border-primary bg-base-300 shadow-md'
                      : 'border-base-300 bg-base-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {id === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  {selectedTheme === id && (
                    <Check size={18} className="text-primary" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
};

export default SettingsPage;
