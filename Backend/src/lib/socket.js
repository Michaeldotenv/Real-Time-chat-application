import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// Production-ready Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production"
      ? [
          process.env.FRONTEND_URL,
          "https://your-frontend-app.onrender.com",
          "http://your-frontend-app.onrender.com"
        ]
      : "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  path: "/socket.io", // Explicit path for Render proxy
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes recovery window
    skipMiddlewares: true
  },
  transports: ["websocket", "polling"] // Enable both for reliability
});

// Connection state tracking
io.onlineUsers = new Map();
io.typingUsers = new Map();

// Cleanup stale typing indicators
const cleanupTypingStatus = () => {
  const now = Date.now();
  for (const [chatId, typingInfo] of io.typingUsers.entries()) {
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
  }
};

// Enhanced connection handling
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id} (${process.env.NODE_ENV || 'development'})`);

  // Debugging events
  socket.onAny((event, ...args) => {
    console.log(`Socket event: ${event}`, args);
  });

  socket.on("register-user", (userId) => {
    const userIdStr = userId.toString();
    io.onlineUsers.set(userIdStr, socket.id);
    io.emit("user-online", userIdStr);
    console.log(`User ${userIdStr} online (${io.onlineUsers.size} total)`);
  });

  socket.on("typing-started", ({ senderId, receiverId }) => {
    const chatId = [senderId, receiverId].sort().join('-');
    io.typingUsers.set(chatId, {
      userId: senderId,
      timestamp: Date.now()
    });
    
    const receiverSocketId = io.onlineUsers.get(receiverId.toString());
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
    
    const receiverSocketId = io.onlineUsers.get(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user-typing", { 
        userId: senderId, 
        isTyping: false 
      });
    }
  });

  socket.on("message-read", ({ messageId, readerId, senderId }) => {
    const senderSocketId = io.onlineUsers.get(senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-read-receipt", { 
        messageId, 
        readerId 
      });
    }
  });

  socket.on("message-delivered", ({ messageId, senderId }) => {
    const senderSocketId = io.onlineUsers.get(senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-delivered-receipt", { 
        messageId 
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
    
    let disconnectedUserId = null;
    for (const [userId, socketId] of io.onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        io.onlineUsers.delete(userId);
        io.emit("user-offline", userId);
        console.log(`User ${userId} offline (${io.onlineUsers.size} remaining)`);
        break;
      }
    }

    // Cleanup typing indicators for disconnected user
    if (disconnectedUserId) {
      for (const [chatId, typingInfo] of io.typingUsers.entries()) {
        if (typingInfo.userId === disconnectedUserId) {
          io.typingUsers.delete(chatId);
          const [user1, user2] = chatId.split('-');
          const otherUserId = user1 === disconnectedUserId ? user2 : user1;
          const otherUserSocketId = io.onlineUsers.get(otherUserId);
          if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("user-typing", { 
              userId: disconnectedUserId, 
              isTyping: false 
            });
          }
        }
      }
    }
  });
});

// Error handling
io.engine.on("connection_error", (err) => {
  console.error("Socket.IO connection error:", {
    code: err.code,
    message: err.message,
    context: err.context
  });
});

// Regular cleanup
setInterval(cleanupTypingStatus, 5000);

export { io, app, server };