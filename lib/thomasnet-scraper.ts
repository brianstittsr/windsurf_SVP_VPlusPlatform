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
  isAuthenticated?: boolean;
}

interface ThomasNetCredentials {
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
    // Use @sparticuz/chromium for serverless environments
    browserInstance = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    // For local development, use local Chrome
    // Try multiple possible Chrome paths
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
    
    // Try to find an existing Chrome installation
    const fs = await import("fs");
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        break;
      }
    }

    console.log("Using Chrome at:", executablePath);

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

// Login to ThomasNet
async function loginToThomasNet(page: Page, credentials: ThomasNetCredentials): Promise<boolean> {
  try {
    console.log("Attempting to login to ThomasNet...");
    
    // Navigate to login page
    await page.goto("https://www.thomasnet.com/login", {
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
                        await page.$('[class*="login-button"]') ||
                        await page.$('[class*="submit"]');
    if (loginButton) {
      await loginButton.click();
    }

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});

    // Check if login was successful by looking for account indicators
    const isLoggedInNow = await page.evaluate(() => {
      // Check for common logged-in indicators
      const accountLink = document.querySelector('a[href*="/account"]');
      const logoutLink = document.querySelector('a[href*="logout"]');
      const userMenu = document.querySelector('[class*="user-menu"], [class*="account-menu"]');
      const dashboardText = document.body.innerText.toLowerCase();
      
      return !!(accountLink || logoutLink || userMenu || 
                dashboardText.includes("my account") || 
                dashboardText.includes("dashboard") ||
                dashboardText.includes("welcome"));
    });

    if (isLoggedInNow) {
      console.log("Successfully logged in to ThomasNet");
      isLoggedIn = true;
      return true;
    } else {
      console.log("Login may have failed - checking for error messages");
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('[class*="error"], [class*="alert"], .error-message');
        return errorEl?.textContent?.trim() || null;
      });
      if (errorMessage) {
        console.log("Login error:", errorMessage);
      }
      return false;
    }
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
}

// Check if already logged in
async function checkLoginStatus(page: Page): Promise<boolean> {
  try {
    await page.goto("https://www.thomasnet.com/account", {
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    const isLoggedInNow = await page.evaluate(() => {
      const url = window.location.href;
      // If redirected to login page, not logged in
      if (url.includes("/login")) return false;
      
      // Check for account page content
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes("my account") || 
             bodyText.includes("dashboard") ||
             bodyText.includes("saved suppliers") ||
             bodyText.includes("account settings");
    });

    return isLoggedInNow;
  } catch {
    return false;
  }
}

// Main search function with optional authentication
export async function scrapeThomasNetSearch(
  query: string, 
  credentials?: ThomasNetCredentials
): Promise<ScrapeResult> {
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

    // If credentials provided, attempt login first
    let authenticated = false;
    if (credentials?.email && credentials?.password) {
      // Check if already logged in
      const alreadyLoggedIn = await checkLoginStatus(page);
      if (alreadyLoggedIn) {
        console.log("Already logged in to ThomasNet");
        authenticated = true;
      } else {
        // Attempt login
        authenticated = await loginToThomasNet(page, credentials);
      }
    }

    // Navigate to ThomasNet search
    const searchUrl = `https://www.thomasnet.com/suppliers/search?searchterm=${encodeURIComponent(query)}&search_type=search-suppliers&ref=search`;
    console.log("Navigating to ThomasNet:", searchUrl, authenticated ? "(authenticated)" : "(anonymous)");
    
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
      isAuthenticated: authenticated,
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
