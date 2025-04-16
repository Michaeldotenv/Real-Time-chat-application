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
const FRONTEND_URL = "https://chatxspace.onrender.com";
const BACKEND_URL = "https://chatspacev2.onrender.com";

// Root route
app.get("/", (req, res) => {
  res.send("Real-time Chat Application Server is running");
});

// ========== MIDDLEWARE ==========
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Enhanced CORS configuration
const allowedOrigins = [
  "https://chatxspace.onrender.com",
  "http://chatxspace.onrender.com",
  "http://localhost:5173"
];

// HTTPS redirection but only for web pages, not API calls
app.use((req, res, next) => {
  // Skip HTTPS redirect for API calls and socket connections
  if (
    req.path.startsWith('/api') || 
    req.path.startsWith('/socket.io') ||
    req.path === '/health' ||
    process.env.NODE_ENV !== 'production'
  ) {
    return next();
  }
  
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// CORS config - more permissive
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      // Log the origin for debugging
      console.log(`CORS request from unauthorized origin: ${origin}`);
      
      // Still allow it in production to troubleshoot
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicit options handling
app.options('*', cors());

// ========== ROUTES ==========
app.use("/api/auth", authRoutes);
app.use("/api/messages", msgRoutes);

// ========== HEALTH CHECK ==========
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK",
    serverTime: new Date().toISOString(), 
    environment: process.env.NODE_ENV || 'development',
    origin: res.getHeader('Access-Control-Allow-Origin') || '*'
  });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({ 
    error: "Server Error", 
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message 
  });
});

// ========== START SERVER ==========
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  
  connectDB().catch(err => {
    console.error("Database connection failed:", err);
    // Don't exit, keep server running even with DB issues
    console.log("Server continuing without database connection");
  });
});