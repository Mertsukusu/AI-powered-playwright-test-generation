import { Request, Response } from 'express';
import { z } from 'zod';
import { CrawlerService } from '../services/crawler';
import { AIService } from '../services/ai';
import { TestGeneratorService } from '../services/testGenerator';
import { logger } from '../utils/logger';
import { GenerateRequest } from '../types';

const GenerateRequestSchema = z.object({
  projectId: z.string().optional(),
  runId: z.string(),
  url: z.string().url(),
  scenarios: z.number().min(2).max(10)
}).transform((data) => ({
  projectId: data.projectId,
  runId: data.runId,
  url: data.url,
  scenarios: data.scenarios
}));

export async function generateHandler(req: Request, res: Response): Promise<void> {
  try {
    // Validate request
    const validatedData = GenerateRequestSchema.parse(req.body);
    const { projectId, runId, url, scenarios } = validatedData;

    logger.info(`Starting generation for project ${projectId}, run ${runId}, URL: ${url}`);

    // Send immediate response
    res.status(202).json({ 
      status: 'accepted', 
      message: 'Generation started',
      runId 
    });

    // Start generation process asynchronously
    generateTestsAsync(validatedData).catch(error => {
      logger.error(`Generation failed for run ${runId}:`, error);
    });

  } catch (error) {
    logger.error('Invalid generation request:', error);
    res.status(400).json({ 
      error: 'Invalid request data',
      details: error instanceof z.ZodError ? error.errors : error
    });
  }
}

async function generateTestsAsync(request: GenerateRequest): Promise<void> {
  const { projectId, runId, url, scenarios } = request;
  const crawler = new CrawlerService();
  const aiService = new AIService();
  const testGenerator = new TestGeneratorService(projectId);

  try {
    // Step 1: Initialize crawler
    logger.info(`Initializing crawler for ${url}`);
    await crawler.initialize();

    // Step 2: Crawl the website
    logger.info('Starting website crawl');
    const crawlResults = await crawler.crawlSite(url);
    logger.info(`Crawled ${crawlResults.length} pages`);

    // Step 3: Generate Page Object Models using AI
    logger.info('Generating Page Object Models');
    const pageObjects = await aiService.generatePageObjects(crawlResults);
    logger.info(`Generated ${pageObjects.length} POM classes`);

    // Step 4: Generate test scenarios using AI
    logger.info(`Generating ${scenarios} test scenarios`);
    const testScenarios = await aiService.generateTestScenarios(crawlResults, pageObjects, scenarios);
    logger.info(`Generated ${testScenarios.length} scenarios`);

    // Step 5: Generate test files
    logger.info('Generating test files');
    const artifacts = await testGenerator.generateTests(pageObjects, testScenarios);
    logger.info(`Generated ${artifacts.length} artifacts`);

    // Step 6: Run tests and collect results
    logger.info('Running generated tests');
    const testResults = await runTests(projectId);

    // Step 7: Update Django API with results
    await updateDjangoAPI(runId, 'completed', artifacts, pageObjects, testScenarios, testResults);

    logger.info(`Generation completed successfully for run ${runId}`);

  } catch (error) {
    logger.error(`Generation failed for run ${runId}:`, error);
    await updateDjangoAPI(runId, 'failed', [], [], [], null, error instanceof Error ? error.message : 'Unknown error');
  } finally {
    await crawler.close();
  }
}

async function runTests(projectId: string): Promise<any> {
  const { exec } = require('child_process');
  const path = require('path');
  
  return new Promise((resolve, reject) => {
    const testDir = path.join(process.cwd(), 'tests', projectId);
    
    exec(`cd "${testDir}" && npx playwright test --reporter=json`, 
      { timeout: 300000 }, // 5 minutes timeout
      (error: any, stdout: string, stderr: string) => {
        if (error) {
          logger.warn('Test execution failed:', error);
          resolve({
            passed: 0,
            failed: 1,
            total: 1,
            error: error.message,
            details: []
          });
        } else {
          try {
            const results = JSON.parse(stdout);
            resolve({
              passed: results.stats.passed || 0,
              failed: results.stats.failed || 0,
              total: results.stats.total || 0,
              details: results.suites?.[0]?.specs || []
            });
          } catch (parseError) {
            logger.warn('Failed to parse test results:', parseError);
            resolve({
              passed: 0,
              failed: 0,
              total: 0,
              details: []
            });
          }
        }
      }
    );
  });
}

async function updateDjangoAPI(
  runId: string, 
  status: 'completed' | 'failed', 
  artifacts: any[], 
  pageObjects?: any[],
  scenarios?: any[],
  testResults?: any, 
  errorMessage?: string
): Promise<void> {
  const axios = require('axios');
  const djangoUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  
  try {
    // Update run with generated content
    await axios.patch(`${djangoUrl}/runs/${runId}/`, {
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      error_message: errorMessage || '',
      page_objects: pageObjects || [],
      scenarios: scenarios || [],
      test_results: testResults || null
    });

    // Create artifact records with content
    for (const artifact of artifacts) {
      const fs = require('fs-extra');
      let content = '';
      
      try {
        if (await fs.pathExists(artifact.filePath)) {
          content = await fs.readFile(artifact.filePath, 'utf-8');
        }
      } catch (readError) {
        logger.warn(`Could not read file content for ${artifact.filename}:`, readError);
      }

      await axios.post(`${djangoUrl}/artifacts/`, {
        run: runId,
        artifact_type: artifact.type,
        filename: artifact.filename,
        file_path: artifact.filePath,
        file_size: artifact.fileSize,
        content: content
      });
    }

    logger.info(`Updated Django API for run ${runId} with status: ${status}`);
  } catch (error) {
    logger.error(`Failed to update Django API for run ${runId}:`, error);
  }
}
