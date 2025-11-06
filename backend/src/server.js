import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authConfig } from './config/auth.js';
import notesRoutes from './routes/notes.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Log startup info
console.log('🚀 Starting Collaborative Notes API Server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('JWT Secret configured:', !!authConfig.jwtSecret);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
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


// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Collaborative Notes API is running',
    timestamp: new Date().toISOString(),
    jwtConfigured: !!authConfig.jwtSecret
  });
});

// Error handling
app.use(errorHandler);

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📝 Collaborative Notes API is ready!`);
    console.log(`🔐 JWT Authentication: ${authConfig.jwtSecret ? 'Configured' : 'NOT CONFIGURED'}`);
  });
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});