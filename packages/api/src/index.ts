import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import uploadsRoutes from './routes/uploads';
import productsRoutes from './routes/products';
import categoriesRoutes from './routes/categories';
import brandsRoutes from './routes/brands';
import ordersRoutes from './routes/orders';
import addressesRoutes from './routes/addresses';
import inventoryRoutes from './routes/inventory';
import invoicesRoutes from './routes/invoices';
import couponsRoutes from './routes/coupons';
import reviewsRoutes from './routes/reviews';
import pagesRoutes from './routes/pages';
import reportsRoutes from './routes/reports';
import wishlistRoutes from './routes/wishlist';
import bannersRoutes from './routes/banners';
import importRoutes from './routes/import';

dotenv.config();

// ── Startup validation ─────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGO_URI'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();

// ── CORS — restrict to known origins in production ─────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/uploads', uploadsRoutes);
app.use('/products', productsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/brands', brandsRoutes);
app.use('/orders', ordersRoutes);
app.use('/addresses', addressesRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/invoices', invoicesRoutes);
app.use('/coupons', couponsRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/pages', pagesRoutes);
app.use('/reports', reportsRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/banners', bannersRoutes);
app.use('/import', importRoutes);

const port = process.env.PORT || 4000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error', err);
    process.exit(1);
  }
  app.listen(port, () => console.log(`API listening on port ${port}`));
}

start();
