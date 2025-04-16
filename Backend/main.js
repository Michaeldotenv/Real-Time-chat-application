import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { app, server } from "./src/lib/socket.js";
import authRoutes from "./src/routes/authRoutes.js";
import msgRoutes from "./src/routes/msgRoutes.js";
import { connectDB } from "./src/lib/db.js";
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;

// Root route
app.get("/", (req, res) => {
  res.send("Real-time Chat Application Server is running");
});

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(cookieParser());

// Enhanced CORS configuration
const allowedOrigins = [
  "https://chatxspace.onrender.com",
  "http://localhost:5173"
];

//Enforce HTTPS in production

app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// CORS config
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// ========== ROUTES ==========
app.use("/api/auth", authRoutes);
app.use("/api/messages", msgRoutes);

// ========== HEALTH CHECK ==========
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server Error" });
});

// ========== START SERVER ==========
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  connectDB().catch(err => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
});