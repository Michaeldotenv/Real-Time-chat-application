// Enhanced NoChatSelected.jsx with animations
import { motion } from 'framer-motion';

const NoChatSelected = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full bg-base-100 p-4"
    >
      <motion.div 
        className="text-center"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <motion.div 
          className="text-6xl mb-4 opacity-30"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          💬
        </motion.div>
        <motion.h2 
          className="text-2xl font-bold mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Welcome to ChatSpace!
        </motion.h2>
        <motion.p 
          className="text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Select a conversation from the sidebar to start chatting
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default NoChatSelected;