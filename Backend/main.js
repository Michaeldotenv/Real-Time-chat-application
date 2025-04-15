import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { app, server } from "./src/lib/socket.js";
import authRoutes from "./src/routes/authRoutes.js"; // Matches your file structure
import msgRoutes from "./src/routes/msgRoutes.js";   // Matches your file structure
import { connectDB } from "./src/lib/db.js";
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;
// Add this to your server code before the other routes
app.get("/", (req, res) => {
  res.send("Real-time Chat Application Server is running");

})
// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  next();
});
app.use(cors({
  origin: "https://chatxspace.onrender.com" ||
    "http://localhost:5173",
    credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
const io = new Server(server, {
  cors: {
    origin: [
      'https://chatxspace.onrender.com',
      'http://localhost:5173'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Enable both transports
});
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
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