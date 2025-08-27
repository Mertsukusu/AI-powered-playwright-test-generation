import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export async function statusHandler(req: Request, res: Response): Promise<void> {
  try {
    const { runId } = req.params;
    
    if (!runId) {
      res.status(400).json({ error: 'Run ID is required' });
      return;
    }

    logger.info(`Checking status for run ${runId}`);

    // Query Django API for run status
    const axios = require('axios');
    const djangoUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    const response = await axios.get(`${djangoUrl}/runs/${runId}/`);
    const run = response.data;

    res.json({
      runId,
      status: run.status,
      project: run.project,
      scenariosCount: run.scenarios_count,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      errorMessage: run.error_message,
      artifacts: run.artifacts || [],
      crawls: run.crawls || []
    });

  } catch (error) {
    logger.error(`Error checking status for run ${req.params.runId}:`, error);
    res.status(500).json({ 
      error: 'Failed to check run status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
