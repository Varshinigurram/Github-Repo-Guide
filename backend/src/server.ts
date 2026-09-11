import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
  console.log(`[server]: Health check available at http://localhost:${PORT}/api/health`);
  console.log(`[config]: GITHUB_TOKEN configured: ${Boolean(process.env.GITHUB_TOKEN?.trim())}`);
  console.log(`[config]: OPENROUTER_API_KEY configured: ${Boolean(process.env.OPENROUTER_API_KEY?.trim())}`);
  console.log(`[config]: OPENROUTER_MODEL: ${process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b'}`);
});

// Graceful shutdown handling for SIGINT and SIGTERM signals
const shutdown = (signal: string) => {
  console.log(`[server]: Received ${signal}, closing HTTP server gracefully...`);
  server.close(() => {
    console.log('[server]: HTTP server closed cleanly. Exiting process.');
    process.exit(0);
  });

  // Force shutdown if active requests do not finish within 5 seconds
  setTimeout(() => {
    console.error('[server]: Forced shutdown due to timeout waiting for active connections.');
    process.exit(1);
  }, 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
