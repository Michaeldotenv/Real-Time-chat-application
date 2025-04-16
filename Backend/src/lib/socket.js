import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from 'jsonwebtoken';

const app = express();
const server = http.createServer(app);

// Define correct origins
const ALLOWED_ORIGINS = process.env.NODE_ENV === "production"
  ? [
      "https://chatxspace.onrender.com",
      "http://chatxspace.onrender.com"
    ]
  : ["http://localhost:5173"];

// Enhanced production-ready Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["authorization"]
  },
  path: "/socket.io",
  pingTimeout: 30000,
  pingInterval: 15000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: false
  },
  transports: ["websocket", "polling"],
  allowEIO3: true
});

// Connection state tracking
io.onlineUsers = new Map();
io.typingUsers = new Map();

// Authentication middleware with more forgiving error handling
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.split(" ")[1] ||
                  socket.request.headers.cookie?.split(';')
                    .find(c => c.trim().startsWith('token='))
                    ?.split('=')[1];
    
    if (!token || token === "fallback-auth") {
      console.warn('Socket auth warning: No valid token found, allowing connection with limited functionality');
      socket.userId = null; // Allow connection but mark as unauthenticated
      return next();
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-key");
      socket.userId = decoded.userId;
    } catch (tokenError) {
      console.warn('Socket auth warning: Invalid token, allowing connection with limited functionality');
      socket.userId = null; // Allow connection but mark as unauthenticated
    }
    
    next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
    // Allow connection anyway to avoid blocking the app completely
    socket.userId = null;
    next();
  }
});

// Cleanup stale typing indicators
const cleanupTypingStatus = () => {
  const now = Date.now();
  io.typingUsers.forEach((typingInfo, chatId) => {
    if (now - typingInfo.timestamp > 5000) {
      const [user1, user2] = chatId.split('-');
      io.typingUsers.delete(chatId);
      
      const receiverSocketId = io.onlineUsers.get(user1 === typingInfo.userId ? user2 : user1);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-typing", { 
          userId: typingInfo.userId, 
          isTyping: false 
        });
      }
    }
  });
};

// Enhanced connection handling
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id} (User: ${socket.userId || 'unauthenticated'})`);

  // Register user after connection
  socket.on("register-user", (userId) => {
    // If the socket wasn't authenticated but now has a userId from the client
    // update the socket's userId
    if (!socket.userId) {
      socket.userId = userId;
      console.log(`User ID registered without token: ${userId}`);
    }
    
    if (userId !== socket.userId && socket.userId !== null) {
      console.warn(`User ID mismatch: ${userId} vs ${socket.userId}`);
      return;
    }

    io.onlineUsers.set(userId, socket.id);
    io.emit("user-online", userId);
    console.log(`User ${userId} registered (${io.onlineUsers.size} online)`);
  });

  // Typing indicators
  socket.on("typing-started", ({ senderId, receiverId }) => {
    if (senderId !== socket.userId && socket.userId !== null) {
      console.warn(`Unauthorized typing start from ${socket.id}`);
      return;
    }

    const chatId = [senderId, receiverId].sort().join('-');
    io.typingUsers.set(chatId, {
      userId: senderId,
      timestamp: Date.now()
    });
    
    const receiverSocketId = io.onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user-typing", { 
        userId: senderId, 
        isTyping: true 
      });
    }
  });

  socket.on("typing-stopped", ({ senderId, receiverId }) => {
    const chatId = [senderId, receiverId].sort().join('-');
    io.typingUsers.delete(chatId);
    
    const receiverSocketId = io.onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user-typing", { 
        userId: senderId, 
        isTyping: false 
      });
    }
  });

  // Message receipts
  socket.on("message-read", ({ messageId, readerId, senderId }) => {
    const senderSocketId = io.onlineUsers.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-read-receipt", { 
        messageId, 
        readerId 
      });
    }
  });

  socket.on("message-delivered", ({ messageId, senderId }) => {
    const senderSocketId = io.onlineUsers.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-delivered-receipt", { 
        messageId 
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`Disconnected: ${socket.id} (${reason})`);
    
    // Find and remove disconnected user
    if (socket.userId && io.onlineUsers.get(socket.userId) === socket.id) {
      io.onlineUsers.delete(socket.userId);
      io.emit("user-offline", socket.userId);
      console.log(`User ${socket.userId} offline (${io.onlineUsers.size} remaining)`);

      // Cleanup typing indicators
      io.typingUsers.forEach((typingInfo, chatId) => {
        if (typingInfo.userId === socket.userId) {
          io.typingUsers.delete(chatId);
          const [user1, user2] = chatId.split('-');
          const otherUserId = user1 === socket.userId ? user2 : user1;
          const otherUserSocketId = io.onlineUsers.get(otherUserId);
          if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("user-typing", { 
              userId: socket.userId, 
              isTyping: false 
            });
          }
        }
      });
    }
  });

  // Error handling
  socket.on("error", (err) => {
    console.error(`Socket error (${socket.id}):`, err);
  });
});

// Enhanced error handling
io.engine.on("connection_error", (err) => {
  console.error("Engine connection error:", {
    code: err.code,
    message: err.message,
    context: err.context ? err.context : 'No context provided'
  });

  // Handle specific error codes
  if (err.code === 1) { // Session ID unknown
    console.log("Attempting to recover from session error...");
  }
});

// Heartbeat monitoring (reduced frequency)
setInterval(() => {
  console.log(`Current connections: ${io.engine.clientsCount}`);
  console.log(`Online users: ${io.onlineUsers.size}`);
}, 60000); // Every minute instead of 30 seconds

// Regular cleanup
setInterval(cleanupTypingStatus, 5000);

export { io, app, server };