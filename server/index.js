process.env.TZ = 'Asia/Jakarta';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import walletRoutes from './routes/wallets.js';
import budgetRoutes from './routes/budgets.js';
import transferRoutes from './routes/transfers.js';
import dataRoutes from './routes/data.js';
import aiRoutes from './routes/ai.js';
import { documentationMarkdown } from './utils/documentation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🔌 Connected to MongoDB database successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/v1/ai', aiRoutes);

// Public API integration documentation for AI Agents
app.get('/api/dokumentasi', (req, res) => {
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.send(documentationMarkdown);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SmartFinance API is running', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

// Start server for local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 SmartFinance API running on http://localhost:${PORT}`);
  });
}

// Export app for Vercel Serverless Functions
export default app;
