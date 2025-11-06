import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file');
  process.exit(1);
}

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: 12
};

console.log('✅ Auth config loaded successfully');
console.log('JWT Secret present:', !!authConfig.jwtSecret);