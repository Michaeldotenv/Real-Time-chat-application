import dotenv from "dotenv";
dotenv.config();
import express from "express"
import { server, app } from './src/lib/socket.js'; // Import both `server` and `app`
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/authRoutes.js";
import msgRoutes from "./src/routes/msgRoutes.js";
import { connectDB } from "./src/lib/db.js";

const PORT = process.env.PORT || 5001;

// Apply middleware to the actual `app` (not server)
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', msgRoutes);

// Start the HTTP + WebSocket server
server.listen(PORT, () => {
  console.log(`✅ Socket + Express server running on http://localhost:${PORT}`);
  connectDB();
});
