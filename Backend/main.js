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

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Additional headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

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