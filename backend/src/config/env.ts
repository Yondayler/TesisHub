import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || './database/database.db',
  jwtSecret: process.env.JWT_SECRET || 'secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // CORS_ORIGIN puede venir como "https://hostname" o solo "hostname"
  corsOrigin: process.env.CORS_ORIGIN 
    ? (process.env.CORS_ORIGIN.startsWith('http') 
        ? process.env.CORS_ORIGIN 
        : `https://${process.env.CORS_ORIGIN}`)
    : '*',
  // Gemini AI Configuration
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

// Asegurar que Mastra tenga la API Key correcta disponible
if (config.geminiApiKey) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = config.geminiApiKey;
}










