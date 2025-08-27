import { chromium, Browser, Page } from 'playwright';
import { CrawlResult, ElementInfo, FormInfo, LinkInfo } from '../types';
import { logger } from '../utils/logger';
import { URL } from 'url';

export class CrawlerService {
  private browser: Browser | null = null;
  private visitedUrls = new Set<string>();
  private maxPages: number;

  constructor(maxPages = 5) {
    this.maxPages = maxPages;
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async crawlSite(baseUrl: string): Promise<CrawlResult[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const results: CrawlResult[] = [];
    const baseHost = new URL(baseUrl).hostname;
    
    try {
      const page = await this.browser.newPage();
      
      // Set viewport and user agent
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      // Start with the base URL
      await this.crawlPage(page, baseUrl, baseHost, results);
      
      await page.close();
    } catch (error) {
      logger.error('Error during crawling:', error);
      throw error;
    }

    return results;
  }

  private async crawlPage(
    page: Page, 
    url: string, 
    baseHost: string, 
    results: CrawlResult[]
  ): Promise<void> {
    if (this.visitedUrls.has(url) || results.length >= this.maxPages) {
      return;
    }

    this.visitedUrls.add(url);
    logger.info(`Crawling page: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      const result = await this.extractPageInfo(page, url);
      results.push(result);

      // Find internal links for further crawling
      if (results.length < this.maxPages) {
        const links = await this.findInternalLinks(page, baseHost);
        for (const link of links.slice(0, this.maxPages - results.length)) {
          await this.crawlPage(page, link, baseHost, results);
        }
      }
    } catch (error) {
      logger.warn(`Failed to crawl ${url}:`, error);
    }
  }

  private async extractPageInfo(page: Page, url: string): Promise<CrawlResult> {
    const title = await page.title();
    
    const elements = await this.extractElements(page);
    const forms = await this.extractForms(page);
    const links = await this.extractLinks(page);

    return {
      url,
      title,
      elements,
      forms,
      links
    };
  }

  private async extractElements(page: Page): Promise<ElementInfo[]> {
    const elements = await page.evaluate(() => {
      const selectors = [
        'button', 'input', 'a', 'select', 'textarea', '[role]', '[data-testid]',
        '[aria-label]', '[placeholder]', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
      ];

      const results: ElementInfo[] = [];
      const seen = new Set<string>();

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
          const element = el as HTMLElement;
          
          // Skip hidden elements
          if (element.offsetParent === null) return;
          
          const tag = element.tagName.toLowerCase();
          const text = element.textContent?.trim();
          const role = element.getAttribute('role');
          const name = element.getAttribute('name');
          const label = element.getAttribute('label');
          const placeholder = element.getAttribute('placeholder');
          const alt = element.getAttribute('alt');
          const testId = element.getAttribute('data-testid');
          const ariaLabel = element.getAttribute('aria-label');
          const href = element.getAttribute('href');
          const type = element.getAttribute('type');
          const value = (element as HTMLInputElement).value;

          // Generate stable selector
          let selector = '';
          let locator = '';
          let priority = 0;

          // Priority 1: data-testid
          if (testId) {
            selector = `[data-testid="${testId}"]`;
            locator = `getByTestId('${testId}')`;
            priority = 1;
          }
          // Priority 2: role + accessible name
          else if (role && (text || ariaLabel)) {
            const name = text || ariaLabel;
            selector = `${tag}[role="${role}"]`;
            locator = `getByRole('${role}', { name: '${name}' })`;
            priority = 2;
          }
          // Priority 3: label association
          else if (name && document.querySelector(`label[for="${name}"]`)) {
            const label = document.querySelector(`label[for="${name}"]`)?.textContent?.trim();
            selector = `input[name="${name}"]`;
            locator = `getByLabel('${label}')`;
            priority = 3;
          }
          // Priority 4: placeholder
          else if (placeholder) {
            selector = `${tag}[placeholder="${placeholder}"]`;
            locator = `getByPlaceholder('${placeholder}')`;
            priority = 4;
          }
          // Priority 5: aria-label
          else if (ariaLabel) {
            selector = `${tag}[aria-label="${ariaLabel}"]`;
            locator = `getByLabel('${ariaLabel}')`;
            priority = 5;
          }
          // Priority 6: text content
          else if (text && text.length < 50) {
            selector = `${tag}`;
            locator = `getByText('${text}')`;
            priority = 6;
          }
          // Priority 7: nth match
          else {
            const siblings = Array.from(document.querySelectorAll(tag));
            const nth = siblings.indexOf(element) + 1;
            selector = `${tag}:nth-of-type(${nth})`;
            locator = `locator('${tag}').nth(${nth - 1})`;
            priority = 7;
          }

          const key = `${tag}-${selector}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              tag,
              text,
              role,
              name,
              label,
              placeholder,
              alt,
              'data-testid': testId,
              'aria-label': ariaLabel,
              href,
              type,
              value,
              selector,
              locator,
              priority
            });
          }
        });
      });

      return results.sort((a, b) => a.priority - b.priority);
    });

    return elements;
  }

  private async extractForms(page: Page): Promise<FormInfo[]> {
    return await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      return Array.from(forms).map(form => {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea')).map(input => {
          const element = input as HTMLInputElement;
          return {
            name: element.name || '',
            type: element.type || element.tagName.toLowerCase(),
            required: element.required,
            placeholder: element.placeholder || undefined,
            label: document.querySelector(`label[for="${element.id}"]`)?.textContent?.trim() || undefined
          };
        });

        return {
          action: form.action || undefined,
          method: form.method || undefined,
          inputs
        };
      });
    });
  }

  private async extractLinks(page: Page): Promise<LinkInfo[]> {
    return await page.evaluate((baseUrl) => {
      const links = document.querySelectorAll('a[href]');
      const baseHost = new URL(baseUrl).hostname;
      
      return Array.from(links).map(link => {
        const href = link.getAttribute('href')!;
        const text = link.textContent?.trim() || '';
        
        try {
          const url = new URL(href, baseUrl);
          return {
            text,
            href: url.href,
            isInternal: url.hostname === baseHost
          };
        } catch {
          return {
            text,
            href,
            isInternal: false
          };
        }
      }).filter(link => link.text.length > 0);
    }, page.url());
  }

  private async findInternalLinks(page: Page, baseHost: string): Promise<string[]> {
    const links = await this.extractLinks(page);
    return links
      .filter(link => link.isInternal)
      .map(link => link.href)
      .slice(0, 10); // Limit to 10 internal links
  }
}
