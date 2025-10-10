require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('passport');
const { Server } = require('socket.io');

// ✅ Routes
const artworkRoutes = require('./routes/artworks');
const authRoutes = require('./routes/auth');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const followRoutes = require('./routes/follow');
const contactRoutes = require('./routes/contactRoutes');
const analyticsRoutes = require('./routes/analytics');
const similarityRoutes = require('./routes/similarity');
const boardRoutes = require('./routes/boards');
const collectionRoutes = require('./routes/collections');

// ✅ NEW — AI Tag Generator Route
const aiRoute = require('./routes/aiRoute');
const geminiRoute = require('./routes/geminiRoute');
const app = express();
require('./config/passport');

// ======================
// 🔹 Middlewares
// ======================
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ======================
// 🔹 Connect to MongoDB
// ======================
connectDB();

// ======================
// 🔹 Create HTTP Server + Socket.IO
// ======================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  },
});

// ⚠️ IMPORTANT: Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ======================
// 🔹 API Routes
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/similarity', similarityRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/ai', aiRoute);
app.use('/api/gemini', geminiRoute);

// ======================
// 🔹 Socket.IO Events
// ======================
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // ========== Existing User Events ==========
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined personal room`);
  });

  socket.on('leave-user', (userId) => {
    socket.leave(`user-${userId}`);
  });

  // ========== Existing Artwork Events ==========
  socket.on('join-artwork', (artworkId) => {
    socket.join(artworkId);
  });

  socket.on('leave-artwork', (artworkId) => {
    socket.leave(artworkId);
  });

  socket.on('comment-added', (data) => {
    io.to(data.artworkId).emit('new-comment', data.comment);
  });

  socket.on('like-updated', (data) => {
    io.to(data.artworkId).emit('like-updated', { likes: data.likes });
  });

  // ========== NEW: Board Events ==========
  socket.on('join-board', (boardId) => {
    socket.join(`board-${boardId}`);
    socket.to(`board-${boardId}`).emit('user-joined-board');
    console.log(`User ${socket.id} joined board ${boardId}`);
  });

  socket.on('leave-board', (boardId) => {
    socket.leave(`board-${boardId}`);
    socket.to(`board-${boardId}`).emit('user-left-board');
    console.log(`User ${socket.id} left board ${boardId}`);
  });

  socket.on('typing-board', (data) => {
    socket.to(`board-${data.boardId}`).emit('user-typing', {
      userId: data.userId,
      userName: data.userName
    });
  });

  socket.on('stop-typing-board', (data) => {
    socket.to(`board-${data.boardId}`).emit('user-stopped-typing', {
      userId: data.userId
    });
  });

  // ========== NEW: Personal Room Events ==========
  socket.on('join-personal-room', (roomId) => {
    socket.join(`room-${roomId}`);
    console.log(`User ${socket.id} joined personal room ${roomId}`);
  });

  socket.on('leave-personal-room', (roomId) => {
    socket.leave(`room-${roomId}`);
    console.log(`User ${socket.id} left personal room ${roomId}`);
  });

  socket.on('typing-personal-room', (data) => {
    socket.to(`room-${data.roomId}`).emit('user-typing-personal', {
      userId: data.userId,
      userName: data.userName
    });
  });

  socket.on('stop-typing-personal-room', (data) => {
    socket.to(`room-${data.roomId}`).emit('user-stopped-typing-personal', {
      userId: data.userId
    });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// ======================
// 🔹 Start Server
// ======================
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});