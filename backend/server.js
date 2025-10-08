import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import connectDB from "./config/db.js";
import artworkRoutes from "./routes/artworks.js";
import authRoutes from "./routes/auth.js";
import commentRoutes from "./routes/comments.js";
import userRoutes from "./routes/users.js";
import aiRoute from "./routes/aiRoute.js"; // AI route
import { Server } from "socket.io";

dotenv.config();

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const artworkRoutes = require('./routes/artworks');
const authRoutes = require('./routes/auth');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const followRoutes = require('./routes/follow');
const { Server } = require('socket.io');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/follow', followRoutes);
// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
  },
});

// Attach io to app
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-user", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined personal room`);
  });

  socket.on("leave-user", (userId) => {
    socket.leave(`user-${userId}`);
  });

  socket.on("join-artwork", (artworkId) => {
    socket.join(artworkId);
  });

  socket.on("leave-artwork", (artworkId) => {
    socket.leave(artworkId);
  });

  socket.on("comment-added", (data) => {
    io.to(data.artworkId).emit("new-comment", data.comment);
  });

  socket.on("like-updated", (data) => {
    io.to(data.artworkId).emit("like-updated", { likes: data.likes });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
