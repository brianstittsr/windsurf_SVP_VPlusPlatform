/**
 * AI extraction of grant opportunity details from a crawled page.
 */
import { createOpenAIClient } from "@/lib/openai-config";
import { crawlPage, type CrawledPage } from "@/lib/grants/crawl";

export interface ExtractedGrant {
  title: string;
  funder?: string;
  description?: string;
  eligibility?: string;
  awardMin?: number;
  awardMax?: number;
  deadline?: string; // ISO date string
  requirements: string[];
  questions: string[];
  summary?: string;
}

const EXTRACTION_SCHEMA = `{
  "title": "string — the grant/program name",
  "funder": "string — funding organization/agency",
  "description": "string — 2-3 sentence program summary",
  "eligibility": "string — who may apply (entity types, locations, requirements)",
  "awardMin": "number|null — minimum award in USD",
  "awardMax": "number|null — maximum award in USD",
  "deadline": "string|null — submission deadline as ISO 8601 date",
  "requirements": "string[] — all submission requirements (documents, forms, attachments, registrations, formatting rules)",
  "questions": "string[] — every application question/prompt the applicant must answer in narrative form",
  "summary": "string — one-paragraph plain-English overview for a grant writer"
}`;

/** Crawl a grant page and extract structured opportunity details via AI. */
export async function analyzeGrantUrl(rawUrl: string): Promise<{ page: CrawledPage; grant: ExtractedGrant }> {
  const page = await crawlPage(rawUrl);
  const client = await createOpenAIClient();
  if (!client) throw new Error("AI analysis is not configured on this deployment");

  const prompt = `You are a grant writer's research assistant. Analyze this grant/funding-opportunity web page and extract the structured details below. Be precise and exhaustive for requirements and questions — include every application question, essay prompt, attachment, and submission step you can identify. If a value is not stated, use null/[].

Page URL: ${page.finalUrl}
Page title: ${page.title}
Meta description: ${page.description}
Headings: ${page.headings.slice(0, 40).join(" | ")}

Page text:
${page.text.slice(0, 40000)}

Return ONLY a JSON object matching this shape:
${EXTRACTION_SCHEMA}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.2,
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI returned no analysis");

  let parsed: ExtractedGrant;
  try {
    parsed = JSON.parse(raw) as ExtractedGrant;
  } catch {
    throw new Error("AI returned malformed analysis");
  }
  if (!parsed.title) parsed.title = page.title || "Untitled grant";
  parsed.requirements = Array.isArray(parsed.requirements) ? parsed.requirements.filter(Boolean) : [];
  parsed.questions = Array.isArray(parsed.questions) ? parsed.questions.filter(Boolean) : [];
  return { page, grant: parsed };
}
