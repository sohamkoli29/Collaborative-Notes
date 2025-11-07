import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authConfig } from './config/auth.js';
import SocketServer from './sockets/socketServer.js';
import shareRoutes from './routes/share.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const server = createServer(app);

// Log startup info
console.log('🚀 Starting Collaborative Notes API Server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('JWT Secret configured:', !!authConfig.jwtSecret);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/shares', shareRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Collaborative Notes API is running',
    timestamp: new Date().toISOString(),
    jwtConfigured: !!authConfig.jwtSecret
  });
});

// Socket.io test endpoint
app.get('/api/socket-test', (req, res) => {
  res.json({ 
    message: 'Socket.io server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(errorHandler);

// Initialize Socket.io server
let socketServer;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📝 Collaborative Notes API is ready!`);
    console.log(`🔐 JWT Authentication: ${authConfig.jwtSecret ? 'Configured' : 'NOT CONFIGURED'}`);
    
    // Initialize Socket.io after HTTP server is running
    socketServer = new SocketServer(server);
    console.log(`🔌 Socket.io server initialized`);
  });
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export { app, server };