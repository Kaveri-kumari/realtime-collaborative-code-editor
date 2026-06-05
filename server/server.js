/**
 * server.js
 * Core bootstrapper for the Collaborative Code Editor.
 * Loads env configs, connects to MongoDB, starts the API routes, and launches Socket.IO.
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");

// Import Sockets
const socketHandler = require("./sockets/socketHandler");

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Health Check API
app.get("/health", (req, res) => {
  res.json({ status: "healthy", db: mongoose.connection.readyState });
});

// Bind Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    methods: ["GET", "POST"],
  },
});

socketHandler(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Collaborative workspace server running on port ${PORT}`);
});
