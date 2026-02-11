import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import storesRoutes from './routes/stores';
import usersRoutes from './routes/users';
import productsRoutes from './routes/products';
import storiesRoutes from './routes/stories';
import ordersRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import { errorHandler, notFoundHandler } from './middleware/error';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
