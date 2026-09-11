import express, { Application } from 'express';
import cors from 'cors';
import healthRouter from './routes/health.route.js';
import analyzeRouter from './routes/analyze.route.js';
import askRouter from './routes/ask.route.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app: Application = express();

// CORS configuration (supports configurable origin via CORS_ORIGIN environment variable)
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));

// Express JSON body limit (bounded to 100kb)
app.use(express.json({ limit: '100kb' }));

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/ask', askRouter);

// 404 Not Found handler for undefined routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
