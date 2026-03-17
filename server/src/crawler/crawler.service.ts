import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { firstValueFrom } from 'rxjs';

export interface CrawlPreviewRequest {
  baseUrl: string;
  titleSelector: string;
  salarySelector?: string;
  descriptionSelector: string;
  renderJs?: boolean;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Main entry for testing a crawl configuration
   */
  async testCrawl(config: CrawlPreviewRequest) {
    this.logger.log(`Starting test crawl for: ${config.baseUrl} (renderJs: ${config.renderJs})`);
    
    try {
      if (config.renderJs) {
        return await this.crawlDynamic(config);
      } else {
        return await this.crawlStatic(config);
      }
    } catch (error) {
      this.logger.error(`Crawl failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Crawl failed: ${error.message}`);
    }
  }

  /**
   * Fast static HTML extraction using Axios & Cheerio
   */
  async crawlStatic(config: CrawlPreviewRequest) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(config.baseUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })
      );
      
      const $ = cheerio.load(data);
      return this.extractItems($, config);
    } catch (error) {
      throw new Error(`Failed to fetch static page: ${error.message}`);
    }
  }

  /**
   * Headless browser extraction for SPA/React websites using Puppeteer
   */
  async crawlDynamic(config: CrawlPreviewRequest) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Wait until network is mostly idle (good for SPA)
      await page.goto(config.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      return this.extractItems($, config);
    } catch (error) {
      throw new Error(`Failed to render dynamic page: ${error.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * Shared DOM traversal logic using selectors
   */
  private extractItems($: cheerio.CheerioAPI, config: CrawlPreviewRequest) {
    // Determine the broadest wrapping element based on the selectors.
    // In a real robust system, we would have an item wrapper selector.
    // For now, we attempt to find the parent that contains these elements, 
    // or just search globally and map them.
    
    // We assume the title selector uniquely identifies job items on a list page.
    const results: Array<{title: string; salary: string; description: string; originalUrl: string}> = [];
    
    const titleElements = $(config.titleSelector);
    
    // Fallback: If no titles found, return empty early
    if (titleElements.length === 0) {
      return results;
    }
    
    // Scrape up to 5 items for preview
    const limit = Math.min(titleElements.length, 5);
    
    for (let i = 0; i < limit; i++) {
      const titleEl = titleElements.eq(i);
      
      // Attempt to find the closest wrapper (e.g., job card)
      // We look for a common ancestor, but for simplicity, we'll try to find
      // salary and description inside the parent, or fetch them globally by index if they are parallel lists.
      
      // Simple heuristic: Get parent card
      let container = titleEl.parent();
      let foundContainer = false;
      
      // Navigate up to 5 levels to find a container that has the other selectors
      for (let j = 0; j < 5; j++) {
        const hasSalary = config.salarySelector ? container.find(config.salarySelector).length > 0 : true;
        const hasDesc = container.find(config.descriptionSelector).length > 0;
        
        if (hasSalary || hasDesc) {
          foundContainer = true;
          break;
        }
        
        const nextParent = container.parent();
        if (nextParent.length === 0) break;
        container = nextParent;
      }
      
      // If we found a container, query inside it. Otherwise, query globally by index.
      let title = titleEl.text().trim();
      let salary = '';
      let description = '';
      
      if (foundContainer) {
        if (config.salarySelector) salary = container.find(config.salarySelector).first().text().trim();
        description = container.find(config.descriptionSelector).first().text().trim();
      } else {
        // Fallback global index matching (risky but works for flat tables)
        if (config.salarySelector) {
            salary = $(config.salarySelector).eq(i).text().trim();
        }
        description = $(config.descriptionSelector).eq(i).text().trim();
      }
      
      let originalUrl = titleEl.attr('href') || titleEl.find('a').attr('href');
      if (!originalUrl && foundContainer) {
        originalUrl = container.find('a').attr('href');
      }
      originalUrl = originalUrl || config.baseUrl;

      if (originalUrl && !originalUrl.startsWith('http')) {
        try {
          const urlObj = new URL(config.baseUrl);
          originalUrl = `${urlObj.origin}${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;
        } catch(e) {}
      }
      
      results.push({
        title,
        salary: salary || 'Thoả thuận',
        description,
        originalUrl
      });
    }
    
    return results;
  }
}
