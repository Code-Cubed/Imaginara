require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('passport');
const { Server } = require('socket.io');

 
// Routes

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

//  AI Routes
const aiRoute = require('./routes/aiRoute');
const geminiRoute = require('./routes/geminiRoute');
const imageGenerationRoute = require('./routes/imageGeneration');

const app = express();
require('./config/passport');


//  Middlewares

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


connectDB();


//  Create HTTP Server + Socket.IO

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling']
});

// Make io accessible to routes
app.set('io', io);


//  Socket.IO Events

const boardUsers = new Map(); // Track users per board

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  // Existing User Events 
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined personal room`);
  });

  socket.on('leave-user', (userId) => {
    socket.leave(`user-${userId}`);
  });

  // Existing Artwork Events 
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

  // FIXED: Board Events 
  socket.on('join-board', (boardId) => {
    // Use boardId directly (no prefix) to match frontend
    socket.join(boardId);
    
    // Track user in board
    if (!boardUsers.has(boardId)) {
      boardUsers.set(boardId, new Set());
    }
    boardUsers.get(boardId).add(socket.id);
    
    console.log(`✅ Socket ${socket.id} joined board ${boardId}`);
    console.log(`📊 Board ${boardId} now has ${boardUsers.get(boardId).size} users`);
    
    // Notify others in the board
    socket.to(boardId).emit('user-joined-board', {
      socketId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('leave-board', (boardId) => {
    socket.leave(boardId);
    
    // Remove from tracking
    if (boardUsers.has(boardId)) {
      boardUsers.get(boardId).delete(socket.id);
      if (boardUsers.get(boardId).size === 0) {
        boardUsers.delete(boardId);
      }
    }
    
    console.log(`❌ Socket ${socket.id} left board ${boardId}`);
    
    // Notify others
    socket.to(boardId).emit('user-left-board', {
      socketId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('typing-board', (data) => {
    console.log(`⌨️ ${data.userName} typing in board ${data.boardId}`);
    // Broadcast to others in the room (excluding sender)
    socket.to(data.boardId).emit('user-typing', {
      userId: data.userId,
      userName: data.userName,
      timestamp: new Date()
    });
  });

  socket.on('stop-typing-board', (data) => {
    console.log(`⏹️ User ${data.userId} stopped typing in board ${data.boardId}`);
    socket.to(data.boardId).emit('user-stopped-typing', {
      userId: data.userId,
      timestamp: new Date()
    });
  });

  // Personal Room Events 
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

  //  Disconnect Event 
  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
    
    // Remove from all boards
    boardUsers.forEach((users, boardId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(boardId).emit('user-left-board', {
          socketId: socket.id,
          timestamp: new Date()
        });
        
        if (users.size === 0) {
          boardUsers.delete(boardId);
        }
      }
    });
  });
});


//  API Routes

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

// AI Routes
app.use('/api/ai', aiRoute);
app.use('/api/gemini', geminiRoute);
app.use('/api/image-generation', imageGenerationRoute);


// Health Check Route

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


//  Start Server

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI Routes available:`);
  console.log(`   - Tag Generation: POST /api/ai/generate-tags`);
  console.log(`   - Chatbot: POST /api/gemini/chat`);
  console.log(`   - Image Generation: POST /api/image-generation/generate`);
});