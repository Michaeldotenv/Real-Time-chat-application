import Message from '../models/messagemodel.js';
import User from '../models/usermodel.js';
import { io } from '../lib/socket.js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';


export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password');
    
    const usersWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const latestMessage = await Message.findOne({
          $or: [
            { senderId: req.user._id, receiverId: user._id },
            { senderId: user._id, receiverId: req.user._id }
          ]
        }).sort({ createdAt: -1 });
        
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: req.user._id,
          readBy: { $ne: req.user._id }
        });
        
        const isOnline = io.onlineUsers.has(user._id.toString());
        
        return {
          ...user._doc,
          latestMessage,
          unreadCount,
          status: isOnline ? 'online' : 'offline'
        };
      })
    );
    
    usersWithLastMessage.sort((a, b) => {
      if (!a.latestMessage) return 1;
      if (!b.latestMessage) return -1;
      return new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt);
    });
    
    res.status(200).json(usersWithLastMessage);
  } catch (error) {
    console.error('Error in getUsers: ', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 });
    
    await Message.updateMany(
      {
        senderId: userId,
        receiverId: currentUserId,
        readBy: { $ne: currentUserId }
      },
      {
        $addToSet: { readBy: currentUserId }
      }
    );
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getMessages: ', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const sendMessage = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;
    
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Handle image upload if file exists
    let imageUrl = null;
    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'chat-app' },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              return reject(new Error('Image upload failed'));
            }
            resolve(result.secure_url);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
    }

    // Create and save message
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || null,
      image: imageUrl,
      delivered: true
    });

    const savedMessage = await newMessage.save();

    // Notify receiver if online
    const receiverSocketId = io.onlineUsers.get(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive-message', savedMessage);
    }

    // Confirm delivery to sender
    const senderSocketId = io.onlineUsers.get(senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit('message-delivered-receipt', {
        messageId: savedMessage._id
      });
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to send message' 
    });
  }
};
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
      
      const senderSocketId = io.onlineUsers.get(message.senderId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit('message-read-receipt', {
          messageId,
          readerId: userId
        });
      }
    }
    
    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error in markMessageAsRead: ', error);
    res.status(500).json({ message: 'Server error' });
  }
};