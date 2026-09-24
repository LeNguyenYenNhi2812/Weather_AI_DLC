// Unit BE-001: Express Server Setup
import { Sentry } from "./sentry.js";
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Export database pool for use in other modules
export { db };

// Sentry error tracking
if (process.env.NODE_ENV === "production") app.use(Sentry.requestHandler());

// Middleware setup
app.use(helmet());

app.use(cors({
  origin: [
    'https://weather-app.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Accept-Language']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(pinoHttp({
  level: process.env.LOG_LEVEL || 'info'
}));

// Health check endpoint (no rate limit)
app.get('/health', async (req, res) => {
  try {
    const dbResult = await db.query('SELECT NOW()');
    const cacheTest = await db.query('SELECT COUNT(*) FROM cache_entries');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      database: {
        connected: true,
        latency_ms: dbResult.rows[0] ? 0 : 'unknown',
        cache_entries: cacheTest.rows[0].count
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Import and register API routes
import weatherRoutes from './api/weather.js';
import forecastRoutes from './api/forecast.js';
import alertRoutes from './api/alerts.js';
import historyRoutes from './api/history.js';
import validateCityRoutes from './api/validate-city.js';
import preferencesRoutes from './api/preferences.js';

app.use('/api/weather', weatherRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/validate-city', validateCityRoutes);
app.use('/api/preferences', preferencesRoutes);

// Static files (served from public directory)
app.use(express.static('public'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Sentry error handler
if (process.env.NODE_ENV === "production") app.use(Sentry.errorHandler());

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = NODE_ENV === 'production' ? 'Internal Server Error' : err.message;

  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Weather API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

export default app;
