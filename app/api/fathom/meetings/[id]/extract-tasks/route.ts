import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { COLLECTIONS, type FathomMeetingDoc, type FathomActionItem } from "@/lib/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST - Extract additional tasks from transcript using AI
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const meetingRef = doc(db, COLLECTIONS.FATHOM_MEETINGS, id);
    const meetingDoc = await getDoc(meetingRef);

    if (!meetingDoc.exists()) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    const meeting = meetingDoc.data() as FathomMeetingDoc;

    if (!meeting.transcriptText) {
      return NextResponse.json(
        { error: "No transcript available for this meeting" },
        { status: 400 }
      );
    }

    // Use AI to extract action items from transcript
    const prompt = `Analyze the following meeting transcript and extract any action items, tasks, or commitments made by participants. 

For each action item, identify:
1. The task description
2. Who is responsible (if mentioned)
3. Any deadline mentioned

Return the results as a JSON array with objects containing:
- "text": the action item description
- "assignee": the person responsible (or null if not specified)
- "deadline": any mentioned deadline (or null if not specified)

Only include clear action items where someone committed to doing something. Do not include general discussion points.

Transcript:
${meeting.transcriptText.slice(0, 15000)}

Return ONLY valid JSON array, no other text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing meeting transcripts and extracting actionable tasks. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || "[]";
    
    // Parse the AI response
    let extractedTasks: Array<{
      text: string;
      assignee: string | null;
      deadline: string | null;
    }> = [];

    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.slice(7);
      }
      if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      extractedTasks = JSON.parse(cleanedResponse.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Filter out tasks that already exist
    const existingTexts = meeting.actionItems.map((item) => item.text.toLowerCase());
    const newTasks = extractedTasks.filter(
      (task) => !existingTexts.some((existing) => 
        existing.includes(task.text.toLowerCase().slice(0, 50)) ||
        task.text.toLowerCase().includes(existing.slice(0, 50))
      )
    );

    // Convert to FathomActionItem format
    const newActionItems: FathomActionItem[] = newTasks.map((task, index) => ({
      id: `ai-extracted-${id}-${Date.now()}-${index}`,
      text: task.text,
      assigneeName: task.assignee || undefined,
      status: "pending" as const,
      dueDate: task.deadline ? Timestamp.fromDate(new Date(task.deadline)) : undefined,
      createdFromTranscript: true,
    }));

    // Update meeting with new action items
    const updatedActionItems = [...meeting.actionItems, ...newActionItems];

    await updateDoc(meetingRef, {
      actionItems: updatedActionItems,
      aiTasksExtracted: true,
      processingStatus: "processed",
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      extractedCount: newActionItems.length,
      newActionItems,
      totalActionItems: updatedActionItems.length,
    });
  } catch (error) {
    console.error("Error extracting tasks:", error);
    return NextResponse.json(
      { error: "Failed to extract tasks from transcript" },
      { status: 500 }
    );
  }
}
