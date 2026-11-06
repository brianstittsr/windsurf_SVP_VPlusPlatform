/**
 * AI drafting of a grant question response from org profile + document inputs + grant context.
 */
import { createOpenAIClient } from "@/lib/openai-config";
import type { GrantDocumentDoc, GrantOpportunityDoc, GrantOrgProfileDoc } from "@/lib/schema";

const CONTEXT_BUDGET = 30_000;

function orgBlock(profile?: GrantOrgProfileDoc | null): string {
  if (!profile) return "(no organization profile attached)";
  const parts = [
    `Organization: ${profile.name}`,
    profile.mission ? `Mission: ${profile.mission}` : "",
    profile.productsServices?.length ? `Products & Services: ${profile.productsServices.join("; ")}` : "",
    profile.populationServed ? `Population served: ${profile.populationServed}` : "",
    profile.keyPrograms?.length ? `Key programs: ${profile.keyPrograms.join("; ")}` : "",
    profile.extractedMarkdown ? `\nOrganization brief:\n${profile.extractedMarkdown}` : "",
  ].filter(Boolean);
  return parts.join("\n");
}

function docsBlock(docs: GrantDocumentDoc[]): string {
  if (!docs.length) return "(no input documents uploaded)";
  const blocks: string[] = [];
  let used = 0;
  for (const doc of docs) {
    const md = doc.markdown || "";
    const remaining = CONTEXT_BUDGET - used;
    if (remaining <= 0) break;
    const slice = md.slice(0, remaining);
    blocks.push(`### ${doc.fileName}\n${slice}${md.length > remaining ? "\n[…truncated]" : ""}`);
    used += slice.length;
  }
  return blocks.join("\n\n");
}

/** Draft a response for one grant question. Returns markdown text. */
export async function draftAnswer(params: {
  grant: GrantOpportunityDoc;
  questionText: string;
  orgProfile?: GrantOrgProfileDoc | null;
  documents: GrantDocumentDoc[];
}): Promise<string> {
  const client = await createOpenAIClient();
  if (!client) throw new Error("AI drafting is not configured on this deployment");

  const { grant, questionText, orgProfile, documents } = params;
  const prompt = `You are an expert grant writer drafting an application response. Write a direct, specific, professional answer to the question below using ONLY the organization information provided. Do not invent statistics, awards, or program names that are not supported by the inputs — write around gaps credibly or omit them. Match the tone of a formal grant application. Aim for 200-400 words unless the question demands otherwise.

## Grant
Title: ${grant.title}
Funder: ${grant.funder || "unknown"}
Description: ${grant.description || ""}
Eligibility: ${grant.eligibility || ""}

## Organization information
${orgBlock(orgProfile)}

## Supporting documents
${docsBlock(documents)}

## Question to answer
${questionText}

Write only the response text — no preamble, no question restatement, no placeholders like "[insert]".`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1500,
    temperature: 0.5,
  });
  const draft = completion.choices[0]?.message?.content?.trim();
  if (!draft) throw new Error("AI returned no draft");
  return draft;
}
