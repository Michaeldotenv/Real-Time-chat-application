import express from 'express';
import protectRoute from '../middleware/protectUpdateRoute.js';
import { 
  getUsers, 
  getMessages, 
  sendMessage,
  markMessageAsRead 
} from '../controllers/msgcontrollers.js';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  });

const router = express.Router();

router.get('/users', protectRoute, getUsers);
router.get('/:userId', protectRoute, getMessages);
router.post('/send/:receiverId', protectRoute, upload.single('image'), sendMessage);
router.put('/read/:messageId', protectRoute, markMessageAsRead);

export default router;