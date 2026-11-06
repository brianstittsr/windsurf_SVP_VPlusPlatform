/**
 * AI extraction of an organization profile (company or nonprofit) from its website.
 */
import { createOpenAIClient } from "@/lib/openai-config";
import { crawlPage, type CrawledPage } from "@/lib/grants/crawl";

export interface ExtractedOrgProfile {
  name: string;
  mission?: string;
  productsServices: string[];
  populationServed?: string;
  keyPrograms: string[];
  extractedMarkdown: string;
}

/** Crawl an org website and extract a reusable grant-input profile via AI. */
export async function analyzeOrgUrl(rawUrl: string): Promise<{ page: CrawledPage; profile: ExtractedOrgProfile }> {
  const page = await crawlPage(rawUrl);
  const client = await createOpenAIClient();
  if (!client) throw new Error("AI analysis is not configured on this deployment");

  const prompt = `You are preparing an organizational profile to be used as source material for grant applications. Analyze this organization website (a company or nonprofit) and extract:

- name: legal or brand name
- mission: mission statement or one-sentence purpose
- productsServices: list of distinct products and services offered
- populationServed: who they serve (customers, beneficiaries, communities)
- keyPrograms: named programs, initiatives, or focus areas
- extractedMarkdown: a well-organized markdown brief (headings + bullets) capturing everything a grant writer would reuse — history, impact, metrics, locations, leadership, differentiators. ~400 words max.

Website: ${page.finalUrl}
Title: ${page.title}
Meta description: ${page.description}
Headings: ${page.headings.slice(0, 40).join(" | ")}

Page text:
${page.text.slice(0, 40000)}

Return ONLY a JSON object with keys: name, mission, productsServices (string[]), populationServed, keyPrograms (string[]), extractedMarkdown.`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 3000,
    temperature: 0.2,
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI returned no profile");

  let parsed: ExtractedOrgProfile;
  try {
    parsed = JSON.parse(raw) as ExtractedOrgProfile;
  } catch {
    throw new Error("AI returned malformed profile");
  }
  if (!parsed.name) parsed.name = page.title || "Organization";
  parsed.productsServices = Array.isArray(parsed.productsServices) ? parsed.productsServices.filter(Boolean) : [];
  parsed.keyPrograms = Array.isArray(parsed.keyPrograms) ? parsed.keyPrograms.filter(Boolean) : [];
  parsed.extractedMarkdown = parsed.extractedMarkdown || "";
  return { page, profile: parsed };
}
