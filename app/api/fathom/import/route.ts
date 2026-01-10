import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { COLLECTIONS, type FathomMeetingDoc, type FathomActionItem } from "@/lib/schema";

interface FathomApiMeeting {
  recording_id: number;
  title: string;
  meeting_title?: string;
  url: string;
  share_url?: string;
  created_at: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  recording_start_time?: string;
  recording_end_time?: string;
  calendar_invitees?: Array<{
    name: string;
    email: string;
    email_domain: string;
    is_external: boolean;
  }>;
  recorded_by?: {
    name: string;
    email: string;
    team?: string;
  };
  transcript?: Array<{
    speaker: {
      display_name: string;
      matched_calendar_invitee_email?: string;
    };
    text: string;
    timestamp: string;
  }>;
  default_summary?: {
    template_name: string;
    markdown_formatted: string;
  };
  action_items?: Array<{
    description: string;
    user_generated: boolean;
    completed: boolean;
    recording_timestamp?: string;
    assignee?: {
      name: string;
      email: string;
    };
  }>;
  crm_matches?: {
    contacts?: Array<{ name: string; email: string }>;
    companies?: Array<{ name: string }>;
  };
}

// Parse timestamp string like "00:05:32" to seconds
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

// Calculate duration from start and end times
function calculateDuration(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.floor((end - start) / 1000); // Duration in seconds
}

// POST - Import meetings from Fathom API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      createdAfter, 
      createdBefore, 
      limit = 100,
      includeTranscript = true,
      includeSummary = true,
      includeActionItems = true,
    } = body;

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Get Fathom API key from settings
    const settingsRef = collection(db, COLLECTIONS.FATHOM_SETTINGS);
    const settingsSnapshot = await getDocs(settingsRef);
    
    if (settingsSnapshot.empty) {
      return NextResponse.json(
        { error: "Fathom not configured. Please add your API key in settings." },
        { status: 400 }
      );
    }

    const settings = settingsSnapshot.docs[0].data();
    const apiKey = settings.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Fathom API key not configured" },
        { status: 400 }
      );
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (includeTranscript) params.append("include_transcript", "true");
    if (includeSummary) params.append("include_summary", "true");
    if (includeActionItems) params.append("include_action_items", "true");
    params.append("include_crm_matches", "true");
    
    if (createdAfter) {
      params.append("created_after", createdAfter);
    }
    if (createdBefore) {
      params.append("created_before", createdBefore);
    }

    // Fetch meetings from Fathom API with pagination
    let allMeetings: FathomApiMeeting[] = [];
    let cursor: string | null = null;
    let pageCount = 0;
    const maxPages = Math.ceil(limit / 50); // Fathom returns up to 50 per page

    do {
      const url = new URL("https://api.fathom.ai/external/v1/meetings");
      url.search = params.toString();
      if (cursor) {
        url.searchParams.append("cursor", cursor);
      }

      const response = await fetch(url.toString(), {
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fathom API error:", errorText);
        return NextResponse.json(
          { error: `Fathom API error: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      allMeetings = allMeetings.concat(data.items || []);
      cursor = data.next_cursor || null;
      pageCount++;

    } while (cursor && pageCount < maxPages && allMeetings.length < limit);

    // Trim to limit
    allMeetings = allMeetings.slice(0, limit);

    // Get existing meeting IDs to avoid duplicates
    const meetingsRef = collection(db, COLLECTIONS.FATHOM_MEETINGS);
    const existingSnapshot = await getDocs(meetingsRef);
    const existingFathomIds = new Set(
      existingSnapshot.docs.map((doc) => doc.data().fathomMeetingId)
    );

    // Import meetings to Firebase
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const meeting of allMeetings) {
      const fathomId = String(meeting.recording_id);

      // Skip if already exists
      if (existingFathomIds.has(fathomId)) {
        skipped++;
        continue;
      }

      try {
        // Convert transcript to our format
        const formattedTranscript = (meeting.transcript || []).map((entry) => ({
          speaker: entry.speaker.display_name,
          text: entry.text,
          startTime: parseTimestamp(entry.timestamp),
          endTime: parseTimestamp(entry.timestamp) + 5, // Approximate
        }));

        // Build full transcript text
        const transcriptText = formattedTranscript
          .map((entry) => `${entry.speaker}: ${entry.text}`)
          .join("\n");

        // Convert action items
        const actionItems: FathomActionItem[] = (meeting.action_items || []).map(
          (item, index) => ({
            id: `fathom-${fathomId}-${index}`,
            text: item.description,
            assigneeName: item.assignee?.name,
            status: item.completed ? "completed" as const : "pending" as const,
            createdFromTranscript: false,
          })
        );

        // Get participants from calendar invitees
        const participants = (meeting.calendar_invitees || []).map(
          (invitee) => invitee.email || invitee.name
        );
        if (meeting.recorded_by?.email && !participants.includes(meeting.recorded_by.email)) {
          participants.push(meeting.recorded_by.email);
        }

        // Calculate duration
        const duration = calculateDuration(
          meeting.recording_start_time,
          meeting.recording_end_time
        );

        // Create meeting document
        const meetingData: Omit<FathomMeetingDoc, "id"> = {
          fathomMeetingId: fathomId,
          title: meeting.title || meeting.meeting_title || "Untitled Meeting",
          meetingDate: Timestamp.fromDate(new Date(meeting.created_at)),
          duration,
          recordingUrl: meeting.url,
          participants,
          hostEmail: meeting.recorded_by?.email,
          summary: meeting.default_summary?.markdown_formatted,
          transcript: formattedTranscript,
          transcriptText,
          actionItems,
          crmMatches: meeting.crm_matches ? [
            ...(meeting.crm_matches.contacts || []).map(c => ({
              type: "contact",
              name: c.name,
              email: c.email,
            })),
            ...(meeting.crm_matches.companies || []).map(c => ({
              type: "company",
              name: c.name,
            })),
          ] : undefined,
          processingStatus: "processed",
          aiTasksExtracted: false,
          source: "api",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await addDoc(meetingsRef, meetingData);
        imported++;
      } catch (error) {
        console.error(`Failed to import meeting ${fathomId}:`, error);
        errors.push(`Failed to import meeting ${meeting.title}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalFetched: allMeetings.length,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Imported ${imported} meetings, skipped ${skipped} duplicates`,
    });
  } catch (error) {
    console.error("Error importing from Fathom:", error);
    return NextResponse.json(
      { error: "Failed to import meetings from Fathom" },
      { status: 500 }
    );
  }
}

// GET - Get import status/preview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Get Fathom API key from settings
    const settingsRef = collection(db, COLLECTIONS.FATHOM_SETTINGS);
    const settingsSnapshot = await getDocs(settingsRef);
    
    if (settingsSnapshot.empty || !settingsSnapshot.docs[0].data().apiKey) {
      return NextResponse.json({
        configured: false,
        message: "Fathom API key not configured",
      });
    }

    const settings = settingsSnapshot.docs[0].data();
    const apiKey = settings.apiKey;

    if (action === "preview") {
      // Fetch a preview of available meetings (just count, no transcript)
      const response = await fetch(
        "https://api.fathom.ai/external/v1/meetings",
        {
          headers: {
            "X-Api-Key": apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: `Fathom API error: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      const meetingCount = data.items?.length || 0;
      const hasMore = !!data.next_cursor;

      // Get count of already imported meetings
      const meetingsRef = collection(db, COLLECTIONS.FATHOM_MEETINGS);
      const existingSnapshot = await getDocs(meetingsRef);
      const existingCount = existingSnapshot.size;

      return NextResponse.json({
        configured: true,
        availableMeetings: meetingCount,
        hasMorePages: hasMore,
        alreadyImported: existingCount,
        message: hasMore 
          ? `Found ${meetingCount}+ meetings available (more pages exist)`
          : `Found ${meetingCount} meetings available`,
      });
    }

    // Default: return configuration status
    return NextResponse.json({
      configured: true,
      apiKeySet: true,
    });
  } catch (error) {
    console.error("Error checking Fathom import status:", error);
    return NextResponse.json(
      { error: "Failed to check import status" },
      { status: 500 }
    );
  }
}
