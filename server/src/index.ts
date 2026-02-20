import express from 'express';
import cors from 'cors';
import path from 'path';
import { config, validateConfig } from './config';
import apiRouter from './routes/api';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { initStore } from './services/projectStore';

validateConfig();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Serve generated files statically
app.use('/output', express.static(path.resolve(config.outputDir)));

// API routes
app.use('/api', apiRouter);

// Error handler
app.use(errorHandler);

async function start() {
  await initStore();
  app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`);
    logger.info(`Output directory: ${config.outputDir}`);
  });
}

start().catch(err => {
  logger.error(`Failed to start server: ${err}`);
  process.exit(1);
});

export default app;
