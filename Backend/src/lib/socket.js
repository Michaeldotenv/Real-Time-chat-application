import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

io.onlineUsers = new Map();
io.typingUsers = new Map();

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

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  socket.on("register-user", (userId) => {
    io.onlineUsers.set(userId.toString(), socket.id);
    io.emit("user-online", userId.toString());
    console.log(`User ${userId} is now online`);
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
    console.log("A user disconnected", socket.id);
    
    let disconnectedUserId = null;
    for (const [userId, socketId] of io.onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        io.onlineUsers.delete(userId);
        io.emit("user-offline", userId);
        console.log(`User ${userId} went offline`);
        break;
      }
    }

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

setInterval(cleanupTypingStatus, 5000);

export { io, app, server };