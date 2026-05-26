import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/kiosk/upload/validate
 * Validates document image quality using AI vision.
 * Checks: in-focus, no finger blocking, document fully visible.
 * 
 * Expects: { imageBase64: string } (base64-encoded image data)
 * Returns: { passed, inFocus, noFingerBlocking, documentVisible, score, issues }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.imageBase64) {
      return NextResponse.json(
        { error: "Missing required field: imageBase64" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback: skip AI validation if no key configured
      return NextResponse.json({
        data: {
          passed: true,
          inFocus: true,
          noFingerBlocking: true,
          documentVisible: true,
          score: 100,
          issues: [],
          note: "AI validation skipped - no API key configured",
        }
      });
    }

    // Call OpenAI GPT-4o Vision for quality analysis
    const prompt = `You are a document quality inspector. Analyze this image of a document being photographed for upload. 

Check the following criteria and respond in JSON format ONLY (no markdown, no explanation):
{
  "inFocus": true/false,
  "noFingerBlocking": true/false, 
  "documentVisible": true/false,
  "score": 0-100,
  "issues": ["list of specific issues found"]
}

Criteria:
1. "inFocus" - Is the document text sharp and readable? Not blurry or shaky?
2. "noFingerBlocking" - Are there any fingers, thumbs, or hands blocking/covering any part of the document content?
3. "documentVisible" - Is the full document visible in the frame? Not cut off at edges?
4. "score" - Overall quality score 0-100 where 100 is perfect
5. "issues" - List any specific problems found (empty array if none)

Be strict about quality - the document needs to be clearly readable for official processing.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: body.imageBase64.startsWith("data:")
                    ? body.imageBase64
                    : `data:image/jpeg;base64,${body.imageBase64}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      // Graceful fallback - allow upload but warn
      return NextResponse.json({
        data: {
          passed: true,
          inFocus: true,
          noFingerBlocking: true,
          documentVisible: true,
          score: 75,
          issues: ["AI quality check unavailable - manual review recommended"],
        }
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse the JSON response from AI
    let qualityResult;
    try {
      // Strip any markdown code fences if present
      const cleanContent = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      qualityResult = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json({
        data: {
          passed: true,
          inFocus: true,
          noFingerBlocking: true,
          documentVisible: true,
          score: 70,
          issues: ["AI response parsing failed - manual review recommended"],
        }
      });
    }

    // Determine if overall quality passes
    const passed = qualityResult.inFocus && qualityResult.noFingerBlocking && qualityResult.documentVisible && qualityResult.score >= 60;

    return NextResponse.json({
      data: {
        passed,
        inFocus: qualityResult.inFocus ?? true,
        noFingerBlocking: qualityResult.noFingerBlocking ?? true,
        documentVisible: qualityResult.documentVisible ?? true,
        score: qualityResult.score ?? 0,
        issues: qualityResult.issues ?? [],
      }
    });
  } catch (error) {
    console.error("Error validating document:", error);
    return NextResponse.json(
      { error: "Failed to validate document quality" },
      { status: 500 }
    );
  }
}
