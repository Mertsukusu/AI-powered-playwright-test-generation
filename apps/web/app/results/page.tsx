'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, DocumentArrowDownIcon, FolderIcon, DocumentIcon } from '@heroicons/react/24/outline'

interface TestFile {
  name: string
  type: string
  content: string
  path?: string
}

interface TestResult {
  id: string
  projectName: string
  url: string
  status: string
  createdAt: string
  testFiles: TestFile[]
}

const generateCompletePlaywrightStructure = (url: string, projectName: string): TestFile[] => {
  const hostname = new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '')
  const safeProjectName = projectName?.replace(/[^a-zA-Z0-9]/g, '') || hostname
  
  return [
    // Package.json
    {
      name: 'package.json',
      type: 'package',
      path: 'package.json',
      content: `{
  "name": "${safeProjectName.toLowerCase()}-playwright-tests",
  "version": "1.0.0",
  "description": "Playwright test suite for ${hostname}",
  "main": "index.js",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report",
    "test:install": "playwright install",
    "test:install-deps": "playwright install-deps"
  },
  "keywords": ["playwright", "e2e", "testing", "${hostname}"],
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}`
    },
    
    // Playwright Config
    {
      name: 'playwright.config.ts',
      type: 'config',
      path: 'playwright.config.ts',
      content: `import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  use: {
    baseURL: '${url}',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

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
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: '${url}',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});`
    },

    // TypeScript Config
    {
      name: 'tsconfig.json',
      type: 'config',
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node", "@playwright/test"]
  },
  "include": [
    "tests/**/*",
    "page-objects/**/*"
  ],
  "exclude": [
    "node_modules",
    "test-results",
    "playwright-report"
  ]
}`
    },

    // Page Object Model
    {
      name: `${safeProjectName}Page.po.ts`,
      type: 'pageObject',
      path: `page-objects/${safeProjectName}Page.po.ts`,
      content: `import { Page, Locator, expect } from '@playwright/test';

export class ${safeProjectName}Page {
  readonly page: Page;
  
  // Selectors
  readonly selectors = {
    title: 'h1',
    navigation: 'nav',
    mainContent: 'main',
    searchInput: '[data-testid="search"], [name="search"], #search',
    searchButton: '[data-testid="search-btn"], button[type="submit"]',
    logo: '[data-testid="logo"], .logo, img[alt*="logo"]',
    menuButton: '[data-testid="menu"], .menu-toggle, .hamburger',
    footer: 'footer',
    contactLink: 'a[href*="contact"]',
    aboutLink: 'a[href*="about"]'
  };

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation Methods
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForSelector(this.selectors.title, { timeout: 10000 });
  }

  // Interaction Methods
  async searchFor(query: string) {
    const searchInput = this.page.locator(this.selectors.searchInput).first();
    const searchButton = this.page.locator(this.selectors.searchButton).first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill(query);
      await searchButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async clickNavigation(linkText: string) {
    await this.page.getByRole('link', { name: linkText }).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async toggleMobileMenu() {
    const menuButton = this.page.locator(this.selectors.menuButton);
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
  }

  // Assertion Methods
  async verifyPageTitle(expectedTitle?: string) {
    const title = await this.page.title();
    if (expectedTitle) {
      expect(title).toContain(expectedTitle);
    } else {
      expect(title).toBeTruthy();
    }
  }

  async verifyMainContentVisible() {
    await expect(this.page.locator(this.selectors.mainContent)).toBeVisible();
  }

  async verifyNavigationVisible() {
    await expect(this.page.locator(this.selectors.navigation)).toBeVisible();
  }

  async verifyLogoVisible() {
    const logo = this.page.locator(this.selectors.logo).first();
    if (await logo.count() > 0) {
      await expect(logo).toBeVisible();
    }
  }

  async verifyFooterVisible() {
    await expect(this.page.locator(this.selectors.footer)).toBeVisible();
  }

  // Utility Methods
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: \`screenshots/\${name}-\${Date.now()}.png\`,
      fullPage: true 
    });
  }

  async getPageUrl() {
    return this.page.url();
  }

  async isElementVisible(selector: string): Promise<boolean> {
    try {
      await this.page.locator(selector).first().waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}`
    },

    // Homepage Tests
    {
      name: 'homepage.spec.ts',
      type: 'test',
      path: `tests/homepage.spec.ts`,
      content: `import { test, expect } from '@playwright/test';
import { ${safeProjectName}Page } from '../page-objects/${safeProjectName}Page.po';

test.describe('Homepage Tests', () => {
  let page: ${safeProjectName}Page;

  test.beforeEach(async ({ page: playwright }) => {
    page = new ${safeProjectName}Page(playwright);
    await page.goto();
  });

  test('should load homepage successfully', async () => {
    await page.waitForPageLoad();
    await page.verifyPageTitle();
    await page.verifyMainContentVisible();
  });

  test('should display navigation', async () => {
    await page.verifyNavigationVisible();
  });

  test('should display logo if present', async () => {
    const hasLogo = await page.isElementVisible(page.selectors.logo);
    if (hasLogo) {
      await page.verifyLogoVisible();
    }
  });

  test('should have working footer', async () => {
    await page.verifyFooterVisible();
  });

  test('should handle mobile menu toggle', async () => {
    // Test mobile menu if present
    const hasMobileMenu = await page.isElementVisible(page.selectors.menuButton);
    if (hasMobileMenu) {
      await page.toggleMobileMenu();
    }
  });
});`
    },

    // Search Tests
    {
      name: 'search.spec.ts',
      type: 'test',
      path: `tests/search.spec.ts`,
      content: `import { test, expect } from '@playwright/test';
import { ${safeProjectName}Page } from '../page-objects/${safeProjectName}Page.po';

test.describe('Search Functionality', () => {
  let page: ${safeProjectName}Page;

  test.beforeEach(async ({ page: playwright }) => {
    page = new ${safeProjectName}Page(playwright);
    await page.goto();
  });

  test('should perform basic search', async () => {
    const hasSearch = await page.isElementVisible(page.selectors.searchInput);
    
    if (hasSearch) {
      await page.searchFor('test query');
      // Add specific search result verification based on your site
      await expect(page.page).toHaveURL(/.*search.*|.*query.*/);
    } else {
      test.skip('Search functionality not available on this page');
    }
  });

  test('should handle empty search', async () => {
    const hasSearch = await page.isElementVisible(page.selectors.searchInput);
    
    if (hasSearch) {
      await page.searchFor('');
      // Verify behavior with empty search
      const currentUrl = await page.getPageUrl();
      expect(currentUrl).toBeTruthy();
    } else {
      test.skip('Search functionality not available on this page');
    }
  });

  test('should handle special characters in search', async () => {
    const hasSearch = await page.isElementVisible(page.selectors.searchInput);
    
    if (hasSearch) {
      await page.searchFor('!@#$%^&*()');
      // Verify handling of special characters
      const currentUrl = await page.getPageUrl();
      expect(currentUrl).toBeTruthy();
    } else {
      test.skip('Search functionality not available on this page');
    }
  });
});`
    },

    // Navigation Tests
    {
      name: 'navigation.spec.ts',
      type: 'test',
      path: `tests/navigation.spec.ts`,
      content: `import { test, expect } from '@playwright/test';
import { ${safeProjectName}Page } from '../page-objects/${safeProjectName}Page.po';

test.describe('Navigation Tests', () => {
  let page: ${safeProjectName}Page;

  test.beforeEach(async ({ page: playwright }) => {
    page = new ${safeProjectName}Page(playwright);
    await page.goto();
  });

  test('should navigate to About page if available', async () => {
    const hasAboutLink = await page.isElementVisible(page.selectors.aboutLink);
    
    if (hasAboutLink) {
      await page.clickNavigation('About');
      await expect(page.page).toHaveURL(/.*about.*/);
    } else {
      test.skip('About link not found on this page');
    }
  });

  test('should navigate to Contact page if available', async () => {
    const hasContactLink = await page.isElementVisible(page.selectors.contactLink);
    
    if (hasContactLink) {
      await page.clickNavigation('Contact');
      await expect(page.page).toHaveURL(/.*contact.*/);
    } else {
      test.skip('Contact link not found on this page');
    }
  });

  test('should handle browser back navigation', async () => {
    await page.page.goBack();
    await page.page.goForward();
    await page.verifyPageTitle();
  });

  test('should handle page refresh', async () => {
    await page.page.reload();
    await page.waitForPageLoad();
    await page.verifyMainContentVisible();
  });
});`
    },

    // Negative Tests
    {
      name: 'error-handling.spec.ts',
      type: 'test',
      path: `tests/error-handling.spec.ts`,
      content: `import { test, expect } from '@playwright/test';
import { ${safeProjectName}Page } from '../page-objects/${safeProjectName}Page.po';

test.describe('Error Handling & Negative Tests', () => {
  let page: ${safeProjectName}Page;

  test.beforeEach(async ({ page: playwright }) => {
    page = new ${safeProjectName}Page(playwright);
  });

  test('should handle 404 page gracefully', async () => {
    await page.page.goto('/non-existent-page-12345');
    
    // Check if custom 404 page exists or default browser behavior
    const pageContent = await page.page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should handle slow network conditions', async () => {
    // Simulate slow network
    await page.page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto();
    await page.verifyPageTitle();
  });

  test('should handle JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const newPage = await context.newPage();
    const pageObj = new ${safeProjectName}Page(newPage);

    await pageObj.goto();
    await expect(newPage).toHaveTitle(/.+/);
    await context.close();
  });

  test('should handle offline mode', async ({ browser }) => {
    const context = await browser.newContext();
    const newPage = await context.newPage();
    
    await newPage.goto('${url}');
    await context.setOffline(true);
    
    // Test behavior when offline
    await newPage.reload().catch(() => {
      // Expected to fail when offline
    });
    
    await context.close();
  });
});`
    },

    // README file
    {
      name: 'README.md',
      type: 'documentation',
      path: 'README.md',
      content: `# ${safeProjectName} Playwright Test Suite

Automated E2E tests for **${hostname}** using Playwright and TypeScript.

## 📋 Test Coverage

- ✅ Homepage functionality
- ✅ Navigation testing  
- ✅ Search functionality
- ✅ Error handling
- ✅ Mobile responsiveness
- ✅ Cross-browser testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone/Download this test suite**
2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Install Playwright browsers:**
   \`\`\`bash
   npm run test:install
   \`\`\`

### Running Tests

\`\`\`bash
# Run all tests
npm test

# Run with browser UI
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode
npm run test:debug

# Show test report
npm run test:report
\`\`\`

## 📁 Project Structure

\`\`\`
${safeProjectName}-playwright-tests/
├── page-objects/
│   └── ${safeProjectName}Page.po.ts    # Page Object Model
├── tests/
│   ├── homepage.spec.ts          # Homepage tests
│   ├── search.spec.ts            # Search functionality
│   ├── navigation.spec.ts        # Navigation tests
│   └── error-handling.spec.ts    # Negative tests
├── playwright.config.ts          # Playwright configuration
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
\`\`\`

## 🎯 Test Scenarios

### ✅ Positive Tests
- Homepage loads successfully
- Navigation works correctly
- Search functionality operates
- Mobile menu functions
- Footer displays properly

### ❌ Negative Tests  
- 404 page handling
- Slow network conditions
- JavaScript disabled
- Offline mode behavior

## 🔧 Configuration

Edit \`playwright.config.ts\` to customize:
- Test timeouts
- Browser selection
- Base URL
- Screenshot/video settings
- Parallel execution

## 📊 Reports

After running tests, view results:
\`\`\`bash
npm run test:report
\`\`\`

## 🐛 Debugging

\`\`\`bash
# Debug specific test
npx playwright test homepage.spec.ts --debug

# Run with trace viewer
npx playwright test --trace on
\`\`\`

## 📝 Writing New Tests

1. Add new test file in \`tests/\` directory
2. Import the Page Object: \`${safeProjectName}Page\`
3. Follow existing patterns for consistency
4. Use semantic selectors (getByRole, getByLabel)

## 🌐 Cross-Browser Testing

Tests run on:
- ✅ Chrome (Desktop)
- ✅ Firefox (Desktop)  
- ✅ Safari (Desktop)
- ✅ Mobile Chrome
- ✅ Mobile Safari

---

**Generated for:** ${hostname}  
**Date:** ${new Date().toLocaleDateString()}  
**Playwright Version:** ^1.44.0
`
    }
  ];
}

export default function ResultsPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<TestFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['tests', 'page-objects']))

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all pages of results with pagination
      let allResults: any[] = []
      let nextUrl = `http://localhost:8000/api/runs/?_t=${Date.now()}`
      
      while (nextUrl) {
        console.log('🔍 API Response (page):', nextUrl)
        const response = await fetch(nextUrl, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch results: ${response.status}`)
        }
        
        const data = await response.json()
        allResults = [...allResults, ...(data.results || [])]
        nextUrl = data.next
      }
      
      console.log('🔍 All Results:', allResults)
      
      // Transform API data to match our interface with complete Playwright structure
      const transformedResults: TestResult[] = allResults.map((run: any) => ({
        id: run.id,
        projectName: run.project?.name || `Test Suite for ${new URL(run.project?.url || '').hostname}`,
        url: run.project?.url || '',
        status: run.status,
        createdAt: run.created_at,
        testFiles: generateCompletePlaywrightStructure(run.project?.url || '', run.project?.name || '')
      }))
      
      console.log('✅ Transformed Results:', transformedResults)
      
      setResults(transformedResults)
      if (transformedResults.length > 0) {
        setSelectedResult(transformedResults[0])
        setSelectedFile(transformedResults[0].testFiles[0])
      }
    } catch (err) {
      console.error('Failed to fetch results:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (file: TestFile) => {
    if (file.path?.includes('/')) {
      return <FolderIcon className="h-4 w-4 text-blue-500" />
    }
    return <DocumentIcon className="h-4 w-4 text-gray-500" />
  }

  const getFileColor = (type: string) => {
    switch (type) {
      case 'test': return 'text-green-600'
      case 'pageObject': return 'text-blue-600'
      case 'config': return 'text-purple-600'
      case 'package': return 'text-orange-600'
      case 'documentation': return 'text-gray-600'
      default: return 'text-gray-500'
    }
  }

  const downloadFile = (file: TestFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAllFiles = () => {
    if (!selectedResult) return
    
    selectedResult.testFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file), index * 100)
    })
  }

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName)
    } else {
      newExpanded.add(folderName)
    }
    setExpandedFolders(newExpanded)
  }

  const organizeFilesByFolder = (files: TestFile[]) => {
    const folders: { [key: string]: TestFile[] } = {}
    const rootFiles: TestFile[] = []

    files.forEach(file => {
      if (file.path?.includes('/')) {
        const folderName = file.path.split('/')[0]
        if (!folders[folderName]) {
          folders[folderName] = []
        }
        folders[folderName].push(file)
      } else {
        rootFiles.push(file)
      }
    })

    return { folders, rootFiles }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchResults}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { folders, rootFiles } = selectedResult ? organizeFilesByFolder(selectedResult.testFiles) : { folders: {}, rootFiles: [] }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎭 Playwright Test Results</h1>
              <p className="text-gray-600">Generated Playwright test suites and Page Object Models</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchResults}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <span>⬅️</span>
                <span>Back to Generator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Test Suites Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Test Suites</h2>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => {
                      setSelectedResult(result)
                      setSelectedFile(result.testFiles[0])
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedResult?.id === result.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{result.projectName}</h3>
                      <span className={`w-2 h-2 rounded-full ${
                        result.status === 'completed' ? 'bg-green-500' : 
                        result.status === 'running' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{result.url}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* File Explorer & Content */}
          <div className="lg:col-span-3">
            {selectedResult ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* VS Code-style File Explorer */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-4 border-b flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">📁 File Structure</h3>
                      <button
                        onClick={downloadAllFiles}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
                      >
                        <DocumentArrowDownIcon className="h-3 w-3" />
                        <span>Download All</span>
                      </button>
                    </div>
                    <div className="p-2 space-y-1 max-h-96 overflow-y-auto text-sm">
                      {/* Root Files */}
                      {rootFiles.map((file, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedFile(file)}
                          className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                            selectedFile?.name === file.name ? 'bg-blue-100' : ''
                          }`}
                        >
                          {getFileIcon(file)}
                          <span className={getFileColor(file.type)}>{file.name}</span>
                        </div>
                      ))}

                      {/* Folders */}
                      {Object.entries(folders).map(([folderName, files]) => (
                        <div key={folderName}>
                          <div
                            onClick={() => toggleFolder(folderName)}
                            className="flex items-center space-x-1 p-2 rounded cursor-pointer hover:bg-gray-100"
                          >
                            <ChevronDownIcon className={`h-3 w-3 transform transition-transform ${
                              expandedFolders.has(folderName) ? 'rotate-0' : '-rotate-90'
                            }`} />
                            <FolderIcon className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{folderName}/</span>
                          </div>
                          {expandedFolders.has(folderName) && (
                            <div className="ml-6 space-y-1">
                              {files.map((file, index) => (
                                <div
                                  key={index}
                                  onClick={() => setSelectedFile(file)}
                                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                                    selectedFile?.name === file.name ? 'bg-blue-100' : ''
                                  }`}
                                >
                                  {getFileIcon(file)}
                                  <span className={getFileColor(file.type)}>{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* File Content */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-4 border-b flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {selectedFile && getFileIcon(selectedFile)}
                        <h3 className="font-semibold text-gray-900">
                          {selectedFile?.name || 'Select a file'}
                        </h3>
                      </div>
                      {selectedFile && (
                        <button
                          onClick={() => downloadFile(selectedFile)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
                        >
                          <DocumentArrowDownIcon className="h-3 w-3" />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      {selectedFile ? (
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                          {selectedFile.content}
                        </pre>
                      ) : (
                        <div className="text-center py-12">
                          <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Select a file to view its content</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Select a test suite to view generated files</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Setup Instructions */}
        {selectedResult && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              🚀 Complete Setup Guide - From Zero to Testing Hero
            </h2>
            
            {/* Prerequisites */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                📋 Prerequisites (Must Have)
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Before You Start:</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• <strong>Node.js 18+</strong> - Download from <a href="https://nodejs.org" className="underline">nodejs.org</a></li>
                  <li>• <strong>Terminal/Command Prompt</strong> - Built into Windows/Mac/Linux</li>
                  <li>• <strong>Code Editor</strong> - VS Code, WebStorm, or any editor</li>
                  <li>• <strong>Basic terminal knowledge</strong> - Don't worry, we'll guide you!</li>
                </ul>
              </div>
            </div>

            {/* Step by Step Installation */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                📥 Step-by-Step Installation
              </h3>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h4 className="font-semibold text-green-700 mb-2">Step 1: Download Your Test Suite</h4>
                  <p className="text-sm text-gray-600 mb-2">Click the "Download All" button above to get all your test files in one go.</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>💡 What you're downloading:</strong>
                    <ul className="mt-1 text-gray-600 space-y-1">
                      <li>• Complete Playwright test project</li>
                      <li>• Page Object Models (reusable test components)</li>
                      <li>• Test scenarios (positive & negative tests)</li>
                      <li>• Configuration files ready to run</li>
                    </ul>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-semibold text-blue-700 mb-2">Step 2: Create Your Project Folder</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">Create a new folder for your tests and extract all downloaded files there:</p>
                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                      <div># Windows (Command Prompt)</div>
                      <div>mkdir my-playwright-tests</div>
                      <div>cd my-playwright-tests</div>
                      <div className="mt-2"># Mac/Linux (Terminal)</div>
                      <div>mkdir my-playwright-tests</div>
                      <div>cd my-playwright-tests</div>
                    </div>
                    <p className="text-gray-500">📁 Extract all downloaded files into this folder</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <h4 className="font-semibold text-purple-700 mb-2">Step 3: Install Dependencies</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">Install all required packages (this downloads Playwright and TypeScript):</p>
                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                      <div>npm install</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                      <strong className="text-yellow-800">⏱️ This takes 2-3 minutes:</strong>
                      <div className="text-yellow-700 text-xs mt-1">Downloads ~100MB of packages including Playwright framework</div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="border-l-4 border-orange-500 pl-4 py-2">
                  <h4 className="font-semibold text-orange-700 mb-2">Step 4: Install Browser Engines</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">Download Chrome, Firefox, and Safari testing engines:</p>
                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                      <div>npm run test:install</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                      <strong className="text-yellow-800">⏱️ This takes 5-10 minutes:</strong>
                      <div className="text-yellow-700 text-xs mt-1">Downloads ~400MB of browsers (Chrome, Firefox, Safari)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Running Tests */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                ▶️ Running Your Tests (The Fun Part!)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Commands */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">🎯 Basic Test Commands</h4>
                  
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <div className="font-mono text-sm bg-gray-900 text-green-400 p-2 rounded mb-2">npm test</div>
                      <p className="text-xs text-gray-600">Runs all tests in the background (headless mode)</p>
                      <p className="text-xs text-blue-600">✅ Best for: Final testing, CI/CD</p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="font-mono text-sm bg-gray-900 text-green-400 p-2 rounded mb-2">npm run test:headed</div>
                      <p className="text-xs text-gray-600">See browsers open and watch tests run live</p>
                      <p className="text-xs text-blue-600">✅ Best for: Beginners, debugging</p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="font-mono text-sm bg-gray-900 text-green-400 p-2 rounded mb-2">npm run test:ui</div>
                      <p className="text-xs text-gray-600">Beautiful GUI to run and explore tests</p>
                      <p className="text-xs text-blue-600">✅ Best for: Interactive testing</p>
                    </div>
                  </div>
                </div>

                {/* Advanced Commands */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">🔧 Advanced Commands</h4>
                  
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <div className="font-mono text-sm bg-gray-900 text-green-400 p-2 rounded mb-2">npm run test:debug</div>
                      <p className="text-xs text-gray-600">Debug mode - stops at breakpoints</p>
                      <p className="text-xs text-blue-600">✅ Best for: Developers, troubleshooting</p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="font-mono text-sm bg-gray-900 text-green-400 p-2 rounded mb-2">npm run test:report</div>
                      <p className="text-xs text-gray-600">View detailed HTML test report</p>
                      <p className="text-xs text-blue-600">✅ Best for: Analyzing results</p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="font-mono text-sm bg-gray-900 text-green-400 p-2 rounded mb-2">npx playwright test homepage.spec.ts</div>
                      <p className="text-xs text-gray-600">Run specific test file only</p>
                      <p className="text-xs text-blue-600">✅ Best for: Testing specific features</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Understanding Your Project */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📁 Understanding Your Project Structure</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-mono text-sm space-y-1">
                  <div className="text-blue-600">📁 your-project/</div>
                  <div className="ml-4 text-green-600">├── 📄 package.json <span className="text-gray-500 text-xs"># Project dependencies & scripts</span></div>
                  <div className="ml-4 text-green-600">├── 📄 playwright.config.ts <span className="text-gray-500 text-xs"># Test configuration</span></div>
                  <div className="ml-4 text-green-600">├── 📄 tsconfig.json <span className="text-gray-500 text-xs"># TypeScript settings</span></div>
                  <div className="ml-4 text-purple-600">├── 📁 page-objects/ <span className="text-gray-500 text-xs"># Reusable page components</span></div>
                  <div className="ml-8 text-gray-600">└── 📄 YourSitePage.po.ts</div>
                  <div className="ml-4 text-purple-600">├── 📁 tests/ <span className="text-gray-500 text-xs"># Your actual test files</span></div>
                  <div className="ml-8 text-gray-600">├── 📄 homepage.spec.ts <span className="text-gray-500 text-xs"># Homepage tests</span></div>
                  <div className="ml-8 text-gray-600">├── 📄 search.spec.ts <span className="text-gray-500 text-xs"># Search functionality</span></div>
                  <div className="ml-8 text-gray-600">├── 📄 navigation.spec.ts <span className="text-gray-500 text-xs"># Navigation tests</span></div>
                  <div className="ml-8 text-gray-600">└── 📄 error-handling.spec.ts <span className="text-gray-500 text-xs"># Error scenarios</span></div>
                  <div className="ml-4 text-orange-600">└── 📄 README.md <span className="text-gray-500 text-xs"># Detailed documentation</span></div>
                </div>
              </div>
            </div>

            {/* What Happens When You Run Tests */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎬 What Happens When You Run Tests?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">🌐 Browser Launch</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Opens Chrome, Firefox, Safari</li>
                    <li>• Goes to your website</li>
                    <li>• Simulates real user actions</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">🤖 Test Execution</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Clicks buttons automatically</li>
                    <li>• Fills forms with test data</li>
                    <li>• Checks if elements exist</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">📊 Results</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• ✅ Pass/Fail for each test</li>
                    <li>• 📸 Screenshots on failures</li>
                    <li>• 📹 Video recordings</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Common Issues & Solutions</h3>
              
              <div className="space-y-4">
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="font-semibold text-red-800 mb-2">❌ "npm: command not found"</h4>
                  <p className="text-sm text-red-700 mb-2">You need to install Node.js first!</p>
                  <p className="text-xs text-red-600">Solution: Download Node.js from <a href="https://nodejs.org" className="underline">nodejs.org</a> and restart your terminal</p>
                </div>

                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Tests failing on your website</h4>
                  <p className="text-sm text-yellow-700 mb-2">This is normal! Our tests are generic.</p>
                  <p className="text-xs text-yellow-600">Solution: Edit the test files to match your website's specific elements and content</p>
                </div>

                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold text-blue-800 mb-2">🐌 Tests running slowly</h4>
                  <p className="text-sm text-blue-700 mb-2">Perfectly normal for thorough testing!</p>
                  <p className="text-xs text-blue-600">Solution: Use 'npm test' for faster headless mode, or run specific test files</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">🎯 Next Steps - Customize Your Tests</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-purple-800 mb-2">🎨 Customization Ideas:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Update selectors to match your site</li>
                    <li>• Add more test scenarios</li>
                    <li>• Test user login flows</li>
                    <li>• Add performance testing</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-purple-800 mb-2">📚 Learn More:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• <a href="https://playwright.dev" className="underline">Official Playwright Docs</a></li>
                    <li>• <a href="https://playwright.dev/docs/writing-tests" className="underline">Writing Tests Guide</a></li>
                    <li>• <a href="https://playwright.dev/docs/test-runners" className="underline">Advanced Testing</a></li>
                    <li>• Join Playwright Discord Community</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
