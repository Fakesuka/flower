import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { getDatabase, closeDatabase } from './database/db';

// Import routes
import productsRoutes from './routes/products';
import storiesRoutes from './routes/stories';
import categoriesRoutes from './routes/categories';
import discountCardsRoutes from './routes/discountCards';
import ordersRoutes from './routes/orders';
import favoritesRoutes from './routes/favorites';
import cartRoutes from './routes/cart';
import usersRoutes from './routes/users';
import settingsRoutes from './routes/settings';
import adminsRoutes from './routes/admins';

// Import bots
import { initFloristBot } from './bots/floristBot';
import { initCustomerBot } from './bots/customerBot';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for Telegram WebApp
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Telegram-Auth']
}));

app.use(express.json());

// Initialize database
getDatabase();

// Initialize Telegram bots
const floristBot = initFloristBot();
const customerBot = initCustomerBot();

// API Routes
app.use('/api/products', productsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/discount-cards', discountCardsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admins', adminsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Get current user info (for debugging)
app.get('/api/me', async (req, res) => {
  const authHeader = req.headers['x-telegram-auth'];
  res.json({
    hasAuth: !!authHeader,
    authHeader: authHeader ? 'present' : 'missing'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../../app/dist');
  app.use(express.static(staticPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
});

export default app;
