import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authConfig } from '../config/auth.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  try {
    console.log('Generating token for user:', userId);
    console.log('Using JWT secret:', authConfig.jwtSecret ? 'Present' : 'Missing');
    
    const token = jwt.sign({ userId }, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn
    });
    
    console.log('Token generated successfully, length:', token.length);
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log('Signup request received:', { username, email, password: password ? '***' : 'missing' });

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    console.log('User created successfully:', user._id);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: await User.findById(user._id), // Get user without password
        token
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// @desc    Authenticate user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login request received:', { email, password: password ? '***' : 'missing' });

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('Password valid for user:', user._id);

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Get user without password for response
    const userWithoutPassword = await User.findById(user._id);

    console.log('Login successful, sending response with token');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;