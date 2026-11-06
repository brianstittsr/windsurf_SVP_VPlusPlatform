/**
 * Minimal website fetch + text extraction for Grant Builder AI inputs.
 * Server-side only. No JS rendering — heavy-JS portals fall back to manual paste.
 */

export interface CrawledPage {
  url: string;
  finalUrl: string;
  title: string;
  description: string;
  headings: string[];
  links: string[];
  text: string;
}

const MAX_HTML_BYTES = 2_000_000;
const MAX_TEXT_CHARS = 60_000;
const FETCH_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; GrantBuilder/1.0; +https://strategicvalueplus.com)";

const BLOCKED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) {
      return true;
    }
  }
  return host.endsWith(".internal") || host.endsWith(".local");
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAttr(tag: string, attr: string): string {
  const match = tag.match(new RegExp(`${attr}=["']([^"']*)["']`, "i"));
  return match?.[1] || "";
}

/**
 * Fetch a page and extract clean text content for AI analysis.
 * Throws on non-http(s) URLs, private hosts, network errors, or non-HTML content.
 */
export async function crawlPage(rawUrl: string): Promise<CrawledPage> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported");
  }
  if (isBlockedHost(url.hostname)) {
    throw new Error("This URL cannot be analyzed");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    });
  } catch (error) {
    const msg = error instanceof Error && error.name === "AbortError" ? "Timed out fetching the page" : "Could not fetch the page";
    throw new Error(msg);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`The site returned ${res.status}`);

  const contentType = res.headers.get("content-type") || "";
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Empty response body");
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value?.length || 0;
    if (received > MAX_HTML_BYTES) break;
    chunks.push(value);
  }
  const html = Buffer.concat(chunks).toString("utf8");

  const isPdf = contentType.includes("pdf") || html.startsWith("%PDF");
  if (isPdf) throw new Error("This URL points to a PDF — upload it as a document instead");
  if (contentType && !contentType.includes("html") && !contentType.includes("text")) {
    throw new Error("This URL does not return a web page");
  }

  const title = stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0];
  const description = extractAttr(metaDesc || "", "content");

  const headings: string[] = [];
  for (const m of html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)) {
    const text = stripTags(m[1]);
    if (text && headings.length < 60) headings.push(text);
  }

  const links: string[] = [];
  for (const m of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)) {
    try {
      const link = new URL(m[1], res.url);
      if ((link.protocol === "http:" || link.protocol === "https:") && links.length < 200) {
        links.push(link.toString());
      }
    } catch {
      // skip malformed links
    }
  }

  // Prefer <main>/<article> content when present, else whole body
  const bodyHtml =
    html.match(/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i)?.[0] ||
    html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[0] ||
    html;
  const text = stripTags(bodyHtml).slice(0, MAX_TEXT_CHARS);

  return { url: rawUrl, finalUrl: res.url, title, description, headings, links, text };
}
