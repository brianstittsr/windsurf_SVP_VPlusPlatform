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
  sourceUrl?: string;
  source: "connex";
}

interface ScrapeResult {
  suppliers: ScrapedSupplier[];
  totalResults: number;
  isLiveData: boolean;
  error?: string;
  isAuthenticated?: boolean;
}

interface ConnexCredentials {
  email: string;
  password: string;
}

let browserInstance: Browser | null = null;
let isLoggedIn = false;

async function getBrowser(): Promise<Browser> {
  if (browserInstance) {
    return browserInstance;
  }

  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    browserInstance = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    const possiblePaths = process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
        ]
      : process.platform === "darwin"
      ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
      : ["/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"];

    let executablePath = possiblePaths[0];
    
    const fs = await import("fs");
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        break;
      }
    }

    console.log("CONNEX scraper using Chrome at:", executablePath);

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

// Login to CONNEX Marketplace
async function loginToConnex(page: Page, credentials: ConnexCredentials): Promise<boolean> {
  try {
    console.log("Attempting to login to CONNEX Marketplace...");
    
    // Navigate to login page
    await page.goto("https://app.connexmarketplace.com/login", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });
    
    // Fill in email
    const emailSelector = await page.$('input[type="email"]') || 
                          await page.$('input[name="email"]') || 
                          await page.$('#email');
    if (emailSelector) {
      await emailSelector.type(credentials.email, { delay: 50 });
    }

    // Fill in password
    const passwordSelector = await page.$('input[type="password"]') || 
                             await page.$('input[name="password"]') || 
                             await page.$('#password');
    if (passwordSelector) {
      await passwordSelector.type(credentials.password, { delay: 50 });
    }

    // Click login button
    const loginButton = await page.$('button[type="submit"]') || 
                        await page.$('input[type="submit"]') ||
                        await page.$('[class*="login"]');
    if (loginButton) {
      await loginButton.click();
    }

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});

    // Check if login was successful
    const isLoggedInNow = await page.evaluate(() => {
      const url = window.location.href;
      const bodyText = document.body.innerText.toLowerCase();
      
      return !url.includes("/login") && (
        bodyText.includes("dashboard") || 
        bodyText.includes("search") ||
        bodyText.includes("suppliers") ||
        bodyText.includes("my account")
      );
    });

    if (isLoggedInNow) {
      console.log("Successfully logged in to CONNEX Marketplace");
      isLoggedIn = true;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("CONNEX login error:", error);
    return false;
  }
}

// Search CONNEX Marketplace
export async function scrapeConnexSearch(
  query: string,
  credentials?: ConnexCredentials
): Promise<ScrapeResult> {
  let page: Page | null = null;
  
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1920, height: 1080 });

    // Attempt login if credentials provided
    let authenticated = false;
    if (credentials?.email && credentials?.password) {
      authenticated = await loginToConnex(page, credentials);
    }

    // Navigate to search page
    const searchUrl = `https://app.connexmarketplace.com/search?q=${encodeURIComponent(query)}`;
    console.log("Navigating to CONNEX search:", searchUrl, authenticated ? "(authenticated)" : "(anonymous)");
    
    await page.goto(searchUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for results to load
    await page.waitForSelector("body", { timeout: 10000 });
    
    // Give time for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract supplier data
    const result = await page.evaluate(() => {
      const suppliers: ScrapedSupplier[] = [];
      let totalResults = 0;

      // Try to get total results count
      const resultsText = document.body.innerText;
      const totalMatch = resultsText.match(/(\d+)\s+results?/i) ||
                         resultsText.match(/showing\s+\d+\s+of\s+(\d+)/i) ||
                         resultsText.match(/found\s+(\d+)/i);
      if (totalMatch) {
        totalResults = parseInt(totalMatch[1], 10);
      }

      // Find supplier cards/rows
      const supplierElements = document.querySelectorAll(
        '[class*="supplier"], [class*="company"], [class*="result"], [class*="card"], [class*="listing"], tr[class*="row"]'
      );
      
      let id = 1;
      supplierElements.forEach((el) => {
        // Look for company name
        const nameEl = el.querySelector('h2, h3, h4, [class*="name"], [class*="title"], a[href*="company"], a[href*="supplier"]');
        const companyName = nameEl?.textContent?.trim() || "";
        
        if (!companyName || companyName.length < 3 || suppliers.some(s => s.companyName === companyName)) {
          return;
        }

        // Look for location
        const locEl = el.querySelector('[class*="location"], [class*="address"], [class*="city"]');
        const location = locEl?.textContent?.trim() || "";

        // Look for description
        const descEl = el.querySelector('[class*="description"], [class*="summary"], [class*="capabilities"], p');
        const description = descEl?.textContent?.trim().slice(0, 500) || "";

        // Look for certifications
        const certEl = el.querySelector('[class*="certification"], [class*="cert"]');
        const certifications = certEl?.textContent?.trim().split(/[,;]/).map(c => c.trim()).filter(c => c) || [];

        // Look for link
        const linkEl = el.querySelector('a[href*="company"], a[href*="supplier"], a[href*="profile"]') as HTMLAnchorElement;
        const sourceUrl = linkEl?.href || "";

        suppliers.push({
          id: `connex-${id++}`,
          companyName,
          description,
          location,
          certifications: certifications.length > 0 ? certifications : undefined,
          sourceUrl,
          source: "connex" as const,
        });
      });

      // If no structured results, try to find any company links
      if (suppliers.length === 0) {
        const links = document.querySelectorAll('a');
        links.forEach((link) => {
          const href = link.getAttribute("href") || "";
          const text = link.textContent?.trim() || "";
          
          if ((href.includes("company") || href.includes("supplier") || href.includes("profile")) &&
              text.length > 3 && text.length < 100 &&
              !text.toLowerCase().includes("search") &&
              !text.toLowerCase().includes("login") &&
              !suppliers.some(s => s.companyName === text)) {
            suppliers.push({
              id: `connex-${id++}`,
              companyName: text,
              sourceUrl: href.startsWith("http") ? href : `https://app.connexmarketplace.com${href}`,
              source: "connex" as const,
            });
          }
        });
      }

      return { suppliers: suppliers.slice(0, 25), totalResults: totalResults || suppliers.length };
    });

    console.log(`CONNEX: Scraped ${result.suppliers.length} suppliers, total: ${result.totalResults}`);
    
    return {
      suppliers: result.suppliers,
      totalResults: result.totalResults,
      isLiveData: result.suppliers.length > 0,
      isAuthenticated: authenticated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("CONNEX scraping error:", errorMessage);
    return {
      suppliers: [],
      totalResults: 0,
      isLiveData: false,
      error: `CONNEX Marketplace scraping failed: ${errorMessage}`,
    };
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

// Cleanup
export async function closeConnexBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    isLoggedIn = false;
  }
}
