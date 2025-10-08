
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
const contactRoutes = require('./routes/contactRoutes');
const { Server } = require('socket.io');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/contact', contactRoutes); 
// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
  },
});

// Attach io to app so controllers can use it
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Join user's personal room
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined personal room`);
  });

  // Leave user's personal room
  socket.on('leave-user', (userId) => {
    socket.leave(`user-${userId}`);
  });

  // Join artwork room
  socket.on('join-artwork', (artworkId) => {
    socket.join(artworkId);
  });

  // Leave artwork room
  socket.on('leave-artwork', (artworkId) => {
    socket.leave(artworkId);
  });

  // Handle comment events
  socket.on('comment-added', (data) => {
    io.to(data.artworkId).emit('new-comment', data.comment);
  });

  // Handle like events
  socket.on('like-updated', (data) => {
    io.to(data.artworkId).emit('like-updated', { likes: data.likes });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});