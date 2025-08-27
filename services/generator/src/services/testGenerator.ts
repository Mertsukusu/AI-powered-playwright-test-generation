import fs from 'fs-extra';
import path from 'path';
import { PageObjectModel, TestScenario, ArtifactInfo } from '../types';
import { logger } from '../utils/logger';

export class TestGeneratorService {
  private projectDir: string;
  private pageObjects: PageObjectModel[] = [];

  constructor(projectId: string) {
    this.projectDir = path.join(process.cwd(), 'tests', projectId);
  }

  private getBaseURL(): string {
    if (this.pageObjects.length > 0) {
      const url = new URL(this.pageObjects[0].url);
      return `${url.protocol}//${url.host}`;
    }
    return 'http://localhost:3000';
  }

  async generateTests(
    pageObjects: PageObjectModel[], 
    scenarios: TestScenario[]
  ): Promise<ArtifactInfo[]> {
    const artifacts: ArtifactInfo[] = [];

    try {
      // Store page objects for use in config generation
      this.pageObjects = pageObjects;

      // Ensure project directory exists
      await fs.ensureDir(this.projectDir);

      // Generate POM files
      const pomArtifacts = await this.generatePOMFiles(pageObjects);
      artifacts.push(...pomArtifacts);

      // Generate test files
      const testArtifacts = await this.generateTestFiles(scenarios, pageObjects);
      artifacts.push(...testArtifacts);

      // Generate Playwright config
      const configArtifact = await this.generatePlaywrightConfig();
      artifacts.push(configArtifact);

      // Generate summary
      const summaryArtifact = await this.generateSummary(pageObjects, scenarios);
      artifacts.push(summaryArtifact);

      logger.info(`Generated ${artifacts.length} artifacts for project`);
      return artifacts;
    } catch (error) {
      logger.error('Error generating tests:', error);
      throw error;
    }
  }

  private async generatePOMFiles(pageObjects: PageObjectModel[]): Promise<ArtifactInfo[]> {
    const artifacts: ArtifactInfo[] = [];

    for (const pom of pageObjects) {
      const filename = `${pom.className}.ts`;
      const filePath = path.join(this.projectDir, 'pages', filename);
      
      await fs.ensureDir(path.dirname(filePath));
      
      const content = this.generatePOMContent(pom);
      await fs.writeFile(filePath, content);
      
      const stats = await fs.stat(filePath);
      artifacts.push({
        type: 'pom',
        filename,
        filePath,
        fileSize: stats.size
      });
    }

    return artifacts;
  }

  private generatePOMContent(pom: PageObjectModel): string {
    const methods = pom.methods.map(method => {
      const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
      return `
  /**
   * ${method.description}
   */
  async ${method.name}(${params}): Promise<void> {
    ${method.code}
  }`;
    }).join('');

    const hostname = new URL(pom.url).hostname;
    const className = pom.className;

    return `import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for ${className}
 * URL: ${pom.url}
 * Website: ${hostname}
 */
export class ${className} {
  readonly page: Page;
  
  // Locators for ${hostname} page elements
  ${this.generateLocators(pom)}

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to this page
   */
  async goto(): Promise<void> {
    await this.page.goto('${pom.url}');
  }${methods}

  // Helper methods for ${hostname}
  ${this.generateHelperMethods(pom)}
}
`;
  }

  private generateLocators(pom: PageObjectModel): string {
    // Extract unique selectors from methods
    const selectors = new Set<string>();
    pom.methods.forEach(method => {
      const code = method.code;
      const selectorMatches = code.match(/['"`]([^'"`]+)['"`]/g);
      if (selectorMatches) {
        selectorMatches.forEach(match => {
          const selector = match.replace(/['"`]/g, '');
          if (selector.includes('getBy') || selector.includes('locator')) {
            selectors.add(selector);
          }
        });
      }
    });

    return Array.from(selectors).map(selector => {
      const name = selector.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      return `readonly ${name}: Locator;`;
    }).join('\n  ');
  }

  private generateHelperMethods(pom: PageObjectModel): string {
    const hostname = new URL(pom.url).hostname;
    return `
  /**
   * Wait for page to load completely
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot of the ${hostname} page
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: \`test-results/\${name}.png\` });
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if page is loaded
   */
  async isPageLoaded(): Promise<boolean> {
    try {
      await this.page.waitForLoadState('domcontentloaded');
      return true;
    } catch {
      return false;
    }
  }`;
  }

  private async generateTestFiles(
    scenarios: TestScenario[], 
    pageObjects: PageObjectModel[]
  ): Promise<ArtifactInfo[]> {
    const artifacts: ArtifactInfo[] = [];

    // Group scenarios by type
    const positiveScenarios = scenarios.filter(s => s.type === 'positive');
    const negativeScenarios = scenarios.filter(s => s.type === 'negative');

    // Generate positive test file
    if (positiveScenarios.length > 0) {
      const positiveArtifact = await this.generateScenarioFile(
        'positive-scenarios.spec.ts',
        positiveScenarios,
        pageObjects,
        'Positive Test Scenarios'
      );
      artifacts.push(positiveArtifact);
    }

    // Generate negative test file
    if (negativeScenarios.length > 0) {
      const negativeArtifact = await this.generateScenarioFile(
        'negative-scenarios.spec.ts',
        negativeScenarios,
        pageObjects,
        'Negative Test Scenarios'
      );
      artifacts.push(negativeArtifact);
    }

    return artifacts;
  }

  private async generateScenarioFile(
    filename: string,
    scenarios: TestScenario[],
    pageObjects: PageObjectModel[],
    description: string
  ): Promise<ArtifactInfo> {
    const filePath = path.join(this.projectDir, 'tests', filename);
    
    await fs.ensureDir(path.dirname(filePath));
    
    const content = this.generateScenarioContent(scenarios, pageObjects, description);
    await fs.writeFile(filePath, content);
    
    const stats = await fs.stat(filePath);
    return {
      type: 'test',
      filename,
      filePath,
      fileSize: stats.size
    };
  }

  private generateScenarioContent(
    scenarios: TestScenario[],
    pageObjects: PageObjectModel[],
    description: string
  ): string {
    const imports = pageObjects.map(pom => 
      `import { ${pom.className} } from '../pages/${pom.className}';`
    ).join('\n');

    const hostname = this.getBaseURL() ? new URL(this.getBaseURL()).hostname : 'website';
    const baseURL = this.getBaseURL();

    const testCases = scenarios.map(scenario => {
      const steps = scenario.steps.map(step => 
        `    // ${step.description}\n    ${step.action}`
      ).join('\n\n');

      return `
  test('${scenario.name}', async ({ page }) => {
    // ${scenario.description}
${steps}
  });`;
    }).join('');

    return `import { test, expect } from '@playwright/test';
${imports}

/**
 * ${description}
 * Generated by AI Test Generator for ${hostname}
 * Base URL: ${baseURL}
 */
test.describe('${hostname} Website Tests', () => {
  let pageObjects: { [key: string]: any } = {};

  test.beforeEach(async ({ page }) => {
    // Initialize page objects for ${hostname}
    ${pageObjects.map(pom => `pageObjects['${pom.className}'] = new ${pom.className}(page);`).join('\n    ')}
  });

${testCases}
});
`;
  }

  private async generatePlaywrightConfig(): Promise<ArtifactInfo> {
    const filename = 'playwright.config.ts';
    const filePath = path.join(this.projectDir, filename);
    
    // Get the base URL from the first page object
    const baseURL = this.getBaseURL();
    
    const content = `import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like \`await page.goto('/')\`. */
    baseURL: '${baseURL}',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
`;

    await fs.writeFile(filePath, content);
    
    const stats = await fs.stat(filePath);
    return {
      type: 'test',
      filename,
      filePath,
      fileSize: stats.size
    };
  }

  private async generateSummary(
    pageObjects: PageObjectModel[], 
    scenarios: TestScenario[]
  ): Promise<ArtifactInfo> {
    const filename = 'SUMMARY.md';
    const filePath = path.join(this.projectDir, filename);
    
    const baseURL = this.getBaseURL();
    const hostname = new URL(baseURL).hostname;
    
    const pomSummary = pageObjects.map(pom => 
      `- **${pom.className}** (${pom.url}): ${pom.methods.length} methods`
    ).join('\n');

    const scenarioSummary = scenarios.map(scenario => 
      `- **${scenario.name}** (${scenario.type}): ${scenario.steps.length} steps`
    ).join('\n');

    const positiveScenarios = scenarios.filter(s => s.type === 'positive');
    const negativeScenarios = scenarios.filter(s => s.type === 'negative');

    const content = `# AI-Generated Test Summary

## Generated on: ${new Date().toISOString()}

## Website: ${hostname}
**Base URL:** ${baseURL}

## Page Object Models (${pageObjects.length})
${pomSummary}

## Test Scenarios (${scenarios.length})
- **Positive Scenarios:** ${positiveScenarios.length}
- **Negative Scenarios:** ${negativeScenarios.length}

${scenarioSummary}

## Files Generated
- \`pages/\` - Page Object Model classes
- \`tests/\` - Playwright test specifications
- \`playwright.config.ts\` - Playwright configuration
- \`SUMMARY.md\` - This summary file

## Running Tests
\`\`\`bash
cd ${this.projectDir}
npx playwright test
\`\`\`

## View Results
\`\`\`bash
npx playwright show-report
\`\`\`

## Test Coverage
This test suite covers:
- Page navigation and user interactions
- Form submissions and data validation
- Error handling and edge cases
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Visual regression testing with screenshots
- Performance monitoring with traces
`;

    await fs.writeFile(filePath, content);
    
    const stats = await fs.stat(filePath);
    return {
      type: 'summary',
      filename,
      filePath,
      fileSize: stats.size
    };
  }
}
