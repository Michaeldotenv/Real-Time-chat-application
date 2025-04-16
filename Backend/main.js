import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { app, server } from "./src/lib/socket.js";
import authRoutes from "./src/routes/authRoutes.js";
import msgRoutes from "./src/routes/msgRoutes.js";
import { connectDB } from "./src/lib/db.js";

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "https://chatxspace.onrender.com",
    "http://localhost:5173"
  ],
  credentials: true
}));

// Routes
app.get("/", (req, res) => res.send("Chat server is running"));
app.use("/api/auth", authRoutes);
app.use("/api/messages", msgRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server Error", message: err.message });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  connectDB().catch(err => {
    console.error("❌ DB connection failed:", err.message);
  });
});
