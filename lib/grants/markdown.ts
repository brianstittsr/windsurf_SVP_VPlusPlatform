/**
 * Convert uploaded input documents to markdown for Grant Builder AI prompts.
 * PDF → pdf-parse text, DOCX → mammoth markdown-ish HTML→text, images → OpenAI vision,
 * text/markdown → passthrough.
 */
import { createOpenAIClient } from "@/lib/openai-config";

const MAX_MARKDOWN_CHARS = 60_000;

export type GrantDocKind = "pdf" | "docx" | "image" | "text";

export function detectDocKind(fileName: string, contentType: string): GrantDocKind | null {
  const name = fileName.toLowerCase();
  if (contentType === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return "docx";
  }
  if (contentType.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(name)) return "image";
  if (contentType.startsWith("text/") || /\.(txt|md|markdown|csv)$/.test(name)) return "text";
  return null;
}

function truncate(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > MAX_MARKDOWN_CHARS
    ? `${cleaned.slice(0, MAX_MARKDOWN_CHARS)}\n\n[…truncated at ${MAX_MARKDOWN_CHARS} chars]`
    : cleaned;
}

async function pdfToMarkdown(bytes: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function docxToMarkdown(bytes: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: bytes });
  return result.value || "";
}

async function imageToMarkdown(bytes: Buffer, contentType: string): Promise<string> {
  const client = await createOpenAIClient();
  if (!client) throw new Error("AI not configured — image documents require OpenAI");
  const base64 = bytes.toString("base64");
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Transcribe and describe this document image in markdown. Capture all visible text, headings, tables, and key details faithfully. If it is a form or brochure, preserve its structure.",
          },
          { type: "image_url", image_url: { url: `data:${contentType};base64,${base64}` } },
        ],
      },
    ],
    max_tokens: 3000,
    temperature: 0.2,
  });
  return completion.choices[0]?.message?.content || "";
}

/** Convert a raw file buffer to markdown text. Throws on failure. */
export async function toMarkdown(
  bytes: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const kind = detectDocKind(fileName, contentType);
  if (!kind) throw new Error("Unsupported file type — upload PDF, DOCX, image, or text files");
  let text: string;
  switch (kind) {
    case "pdf":
      text = await pdfToMarkdown(bytes);
      break;
    case "docx":
      text = await docxToMarkdown(bytes);
      break;
    case "image":
      text = await imageToMarkdown(bytes, contentType);
      break;
    case "text":
      text = bytes.toString("utf8");
      break;
  }
  const markdown = truncate(text);
  if (!markdown.trim()) throw new Error("No readable text could be extracted from this file");
  return markdown;
}
