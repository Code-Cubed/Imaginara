require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('passport');
const { Server } = require('socket.io');

// ======================
// 🔹 Routes
// ======================
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

// ✅ AI Routes
const aiRoute = require('./routes/aiRoute');              // Tag generation
const geminiRoute = require('./routes/geminiRoute');      // Chatbot
const imageGenerationRoute = require('./routes/imageGeneration'); // ✅ NEW - Image Generator

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
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
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

// ✅ AI Routes
app.use('/api/ai', aiRoute);                              // Tag generation
app.use('/api/gemini', geminiRoute);                      // Chatbot
app.use('/api/image-generation', imageGenerationRoute);  // ✅ NEW - Image Generator

// ======================
// 🔹 Create HTTP Server + Socket.IO
// ======================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
  },
});

app.set('io', io);

// ======================
// 🔹 Socket.IO Events
// ======================
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined personal room`);
  });

  socket.on('leave-user', (userId) => {
    socket.leave(`user-${userId}`);
  });

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

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// ======================
// 🔹 Health Check Route
// ======================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    routes: {
      auth: '/api/auth',
      artworks: '/api/artworks',
      comments: '/api/comments',
      users: '/api/users',
      follow: '/api/follow',
      contact: '/api/contact',
      analytics: '/api/analytics',
      similarity: '/api/similarity',
      boards: '/api/boards',
      collections: '/api/collections',
      ai: {
        tagGeneration: '/api/ai/generate-tags',
        chatbot: '/api/gemini/chat',
        imageGeneration: '/api/image-generation/generate'
      }
    }
  });
});

// ======================
// 🔹 Start Server
// ======================
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI Routes available:`);
  console.log(`   - Tag Generation: POST /api/ai/generate-tags`);
  console.log(`   - Chatbot: POST /api/gemini/chat`);
  console.log(`   - Image Generation: POST /api/image-generation/generate`);
});