import puppeteer, { Browser, Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

interface ScrapedSupplier {
  id: string;
  companyName: string;
  description?: string;
  location?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  categories?: string[];
  certifications?: string[];
  employeeCount?: string;
  revenue?: string;
  thomasnetUrl?: string;
}

interface ScrapeResult {
  suppliers: ScrapedSupplier[];
  totalResults: number;
  isLiveData: boolean;
  error?: string;
}

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance) {
    return browserInstance;
  }

  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    // Use @sparticuz/chromium for serverless environments
    browserInstance = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    // For local development, use local Chrome
    const executablePath = process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "/usr/bin/google-chrome";

    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080",
      ],
    });
  }

  return browserInstance;
}

export async function scrapeThomasNetSearch(query: string): Promise<ScrapeResult> {
  let page: Page | null = null;
  
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to ThomasNet search
    const searchUrl = `https://www.thomasnet.com/suppliers/search?searchterm=${encodeURIComponent(query)}&search_type=search-suppliers&ref=search`;
    console.log("Navigating to ThomasNet:", searchUrl);
    
    await page.goto(searchUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for search results to load
    await page.waitForSelector("body", { timeout: 10000 });
    
    // Extract data from the page
    const result = await page.evaluate(() => {
      const suppliers: ScrapedSupplier[] = [];
      let totalResults = 0;

      // Try to get total results count
      const resultsText = document.body.innerText;
      const totalMatch = resultsText.match(/Displaying\s+[\d,]+\s+-\s+[\d,]+\s+of\s+([\d,]+)\s+results/i) ||
                         resultsText.match(/([\d,]+)\s+results?\s+for/i);
      if (totalMatch) {
        totalResults = parseInt(totalMatch[1].replace(/,/g, ""), 10);
      }

      // Find supplier cards - ThomasNet uses various class patterns
      const supplierCards = document.querySelectorAll('[class*="supplier-card"], [class*="profile-card"], [class*="company-card"], .search-result-item, [data-testid*="supplier"]');
      
      // If no cards found, try to find links to company profiles
      if (supplierCards.length === 0) {
        const profileLinks = document.querySelectorAll('a[href*="/profile/"]');
        let id = 1;
        
        profileLinks.forEach((link) => {
          const anchor = link as HTMLAnchorElement;
          const companyName = anchor.textContent?.trim() || "";
          const href = anchor.getAttribute("href") || "";
          
          // Skip navigation links and duplicates
          if (companyName.length < 3 || 
              companyName.toLowerCase().includes("view") ||
              companyName.toLowerCase().includes("click") ||
              companyName.toLowerCase().includes("profile") ||
              suppliers.some(s => s.companyName === companyName)) {
            return;
          }

          // Try to find parent container for more info
          const container = anchor.closest('[class*="card"], [class*="result"], [class*="item"], article, section');
          let description = "";
          let location = "";

          if (container) {
            // Look for description
            const descEl = container.querySelector('[class*="description"], [class*="summary"], p');
            if (descEl && descEl !== anchor) {
              description = descEl.textContent?.trim().slice(0, 500) || "";
            }

            // Look for location
            const locEl = container.querySelector('[class*="location"], [class*="address"]');
            if (locEl) {
              location = locEl.textContent?.trim() || "";
            }
          }

          suppliers.push({
            id: `tn-live-${id++}`,
            companyName,
            description,
            location,
            thomasnetUrl: href.startsWith("http") ? href : `https://www.thomasnet.com${href}`,
          });
        });
      } else {
        // Parse supplier cards
        let id = 1;
        supplierCards.forEach((card) => {
          const nameEl = card.querySelector('[class*="title"], [class*="name"], h2, h3, a[href*="/profile/"]');
          const companyName = nameEl?.textContent?.trim() || "";
          
          if (!companyName || companyName.length < 3) return;

          const descEl = card.querySelector('[class*="description"], [class*="summary"], p');
          const locEl = card.querySelector('[class*="location"], [class*="address"]');
          const linkEl = card.querySelector('a[href*="/profile/"]') as HTMLAnchorElement;

          suppliers.push({
            id: `tn-live-${id++}`,
            companyName,
            description: descEl?.textContent?.trim().slice(0, 500) || "",
            location: locEl?.textContent?.trim() || "",
            thomasnetUrl: linkEl?.href || "",
          });
        });
      }

      return { suppliers: suppliers.slice(0, 25), totalResults };
    });

    console.log(`Scraped ${result.suppliers.length} suppliers, total: ${result.totalResults}`);
    
    return {
      suppliers: result.suppliers,
      totalResults: result.totalResults || result.suppliers.length,
      isLiveData: result.suppliers.length > 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Puppeteer scraping error:", errorMessage);
    return {
      suppliers: [],
      totalResults: 0,
      isLiveData: false,
      error: `ThomasNet scraping failed: ${errorMessage}`,
    };
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

// Cleanup function to close browser
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
