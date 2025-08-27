import OpenAI from 'openai';
import { CrawlResult, PageObjectModel, TestScenario } from '../types';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { pageObjectPrompt, scenarioPrompt } from './prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Zod schemas for validation
const POMethodSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string()
  })),
  code: z.string()
});

const PageObjectModelSchema = z.object({
  className: z.string(),
  url: z.string(),
  methods: z.array(POMethodSchema)
});

const TestStepSchema = z.object({
  description: z.string(),
  action: z.string(),
  expectedResult: z.string()
});

const TestScenarioSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum(['positive', 'negative']),
  steps: z.array(TestStepSchema)
});

const GenerationResponseSchema = z.object({
  pageObjects: z.array(PageObjectModelSchema),
  scenarios: z.array(TestScenarioSchema)
});

export class AIService {
  private model: string;

  constructor(model = 'gpt-5-mini') {
    this.model = model;
  }

  async generatePageObjects(crawlResults: CrawlResult[]): Promise<PageObjectModel[]> {
    const websiteUrl = crawlResults[0]?.url || '';
    const prompt = pageObjectPrompt(crawlResults, websiteUrl);
    
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert test automation engineer specializing in Page Object Model design for Playwright tests. Generate clean, maintainable POM classes with semantic method names.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse and validate the response
      const parsed = this.parseJSONResponse(content);
      const validated = GenerationResponseSchema.parse(parsed);
      
      return validated.pageObjects;
    } catch (error) {
      logger.error('Error generating page objects:', error);
      throw new Error(`Failed to generate page objects: ${error}`);
    }
  }

  async generateTestScenarios(
    crawlResults: CrawlResult[], 
    pageObjects: PageObjectModel[], 
    count: number
  ): Promise<TestScenario[]> {
    const websiteUrl = crawlResults[0]?.url || '';
    const prompt = scenarioPrompt(crawlResults, pageObjects, count, websiteUrl);
    
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert QA engineer. Generate realistic test scenarios that cover both positive and negative cases. Focus on user workflows and edge cases.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 3000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse and validate the response
      const parsed = this.parseJSONResponse(content);
      const validated = GenerationResponseSchema.parse(parsed);
      
      // Validate exact scenario count
      if (validated.scenarios.length !== count) {
        logger.warn(`AI returned ${validated.scenarios.length} scenarios, expected ${count}`);
        throw new Error(`Expected ${count} scenarios, but got ${validated.scenarios.length}`);
      }
      
      // Validate positive/negative distribution
      const positiveCount = Math.ceil(count * 0.6);
      const negativeCount = count - positiveCount;
      const actualPositive = validated.scenarios.filter(s => s.type === 'positive').length;
      const actualNegative = validated.scenarios.filter(s => s.type === 'negative').length;
      
      if (actualPositive !== positiveCount || actualNegative !== negativeCount) {
        logger.warn(`Scenario distribution mismatch: expected ${positiveCount} positive, ${negativeCount} negative, got ${actualPositive} positive, ${actualNegative} negative`);
      }
      
      return validated.scenarios;
    } catch (error) {
      logger.error('Error generating test scenarios:', error);
      throw new Error(`Failed to generate test scenarios: ${error}`);
    }
  }



  private parseJSONResponse(content: string): unknown {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, try parsing the entire content
      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }
  }
}
