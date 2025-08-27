import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateHandler } from './handlers/generate';
import { statusHandler } from './handlers/status';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const port = process.env.GENERATOR_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.post('/generate', generateHandler);
app.get('/status/:runId', statusHandler);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  logger.info(`Generator service running on port ${port}`);
});
