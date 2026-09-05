import express, { Application } from 'express';
import cors from 'cors';
import healthRouter from './routes/health.route';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/health', healthRouter);

// 404 Not Found handler for undefined routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
