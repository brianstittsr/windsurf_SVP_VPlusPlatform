import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { COLLECTIONS, type FirefliesMeetingDoc, type FirefliesActionItem } from "@/lib/schema";

// GraphQL query to fetch transcripts with full details
const TRANSCRIPTS_QUERY = `
  query Transcripts($limit: Int, $skip: Int, $fromDate: Float, $toDate: Float) {
    transcripts(limit: $limit, skip: $skip, date: $fromDate, toDate: $toDate) {
      id
      title
      date
      duration
      transcript_url
      audio_url
      video_url
      meeting_link
      host_email
      organizer_email
      participants
      speakers {
        id
        name
      }
      sentences {
        index
        speaker_name
        speaker_id
        text
        raw_text
        start_time
        end_time
        ai_filters {
          task
          question
          sentiment
        }
      }
      summary {
        keywords
        action_items
        outline
        overview
        short_summary
        meeting_type
        topics_discussed
      }
      analytics {
        sentiments {
          positive_pct
          neutral_pct
          negative_pct
        }
        speakers {
          speaker_id
          name
          duration
          word_count
          words_per_minute
          questions
          filler_words
          duration_pct
        }
      }
      meeting_attendees {
        displayName
        email
        name
      }
    }
  }
`;

// POST - Import meetings from Fireflies API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fromDate, 
      toDate, 
      limit = 100,
      skip = 0,
    } = body;

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Get Fireflies API key from settings
    const settingsRef = collection(db, COLLECTIONS.FIREFLIES_SETTINGS);
    const settingsSnapshot = await getDocs(settingsRef);
    
    if (settingsSnapshot.empty) {
      return NextResponse.json(
        { error: "Fireflies not configured. Please add your API key in settings." },
        { status: 400 }
      );
    }

    const settings = settingsSnapshot.docs[0].data();
    const apiKey = settings.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Fireflies API key not configured" },
        { status: 400 }
      );
    }

    // Build variables for GraphQL query
    const variables: Record<string, unknown> = {
      limit,
      skip,
    };

    if (fromDate) {
      variables.fromDate = new Date(fromDate).getTime();
    }
    if (toDate) {
      variables.toDate = new Date(toDate).getTime();
    }

    // Fetch transcripts from Fireflies GraphQL API
    const response = await fetch("https://api.fireflies.ai/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: TRANSCRIPTS_QUERY,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fireflies API error:", errorText);
      return NextResponse.json(
        { error: `Fireflies API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error("Fireflies GraphQL errors:", data.errors);
      return NextResponse.json(
        { error: data.errors[0]?.message || "GraphQL error" },
        { status: 400 }
      );
    }

    const transcripts = data.data?.transcripts || [];

    // Get existing meeting IDs to avoid duplicates
    const meetingsRef = collection(db, COLLECTIONS.FIREFLIES_MEETINGS);
    const existingSnapshot = await getDocs(meetingsRef);
    const existingFirefliesIds = new Set(
      existingSnapshot.docs.map((doc) => doc.data().firefliesMeetingId)
    );

    // Import meetings to Firebase
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const transcript of transcripts) {
      const firefliesId = transcript.id;

      // Skip if already exists
      if (existingFirefliesIds.has(firefliesId)) {
        skipped++;
        continue;
      }

      try {
        // Convert sentences to our format
        const sentences = (transcript.sentences || []).map((s: any) => ({
          index: s.index,
          speakerName: s.speaker_name,
          speakerId: s.speaker_id,
          text: s.text,
          rawText: s.raw_text,
          startTime: s.start_time,
          endTime: s.end_time,
          sentiment: s.ai_filters?.sentiment,
          isTask: s.ai_filters?.task,
          isQuestion: s.ai_filters?.question,
        }));

        // Build full transcript text
        const transcriptText = sentences
          .map((s: any) => `${s.speakerName}: ${s.text}`)
          .join("\n");

        // Convert action items from summary
        const actionItems: FirefliesActionItem[] = (transcript.summary?.action_items || []).map(
          (item: string, index: number) => ({
            id: `fireflies-${firefliesId}-${index}`,
            text: item,
            status: "pending" as const,
            createdFromTranscript: false,
          })
        );

        // Get participants
        const participants = transcript.participants || [];
        if (transcript.meeting_attendees) {
          transcript.meeting_attendees.forEach((a: any) => {
            if (a.email && !participants.includes(a.email)) {
              participants.push(a.email);
            }
          });
        }

        // Create meeting document
        const meetingData: Omit<FirefliesMeetingDoc, "id"> = {
          firefliesMeetingId: firefliesId,
          title: transcript.title || "Untitled Meeting",
          meetingDate: Timestamp.fromDate(new Date(transcript.date)),
          duration: transcript.duration || 0,
          transcriptUrl: transcript.transcript_url,
          audioUrl: transcript.audio_url,
          videoUrl: transcript.video_url,
          meetingLink: transcript.meeting_link,
          participants,
          hostEmail: transcript.host_email,
          organizerEmail: transcript.organizer_email,
          meetingAttendees: transcript.meeting_attendees?.map((a: any) => ({
            name: a.name || a.displayName,
            email: a.email,
            displayName: a.displayName,
          })),
          speakers: transcript.speakers,
          summary: transcript.summary ? {
            keywords: transcript.summary.keywords,
            actionItems: transcript.summary.action_items,
            outline: transcript.summary.outline,
            overview: transcript.summary.overview,
            shortSummary: transcript.summary.short_summary,
            meetingType: transcript.summary.meeting_type,
            topicsDiscussed: transcript.summary.topics_discussed,
          } : undefined,
          sentences,
          transcriptText,
          analytics: transcript.analytics ? {
            sentiments: transcript.analytics.sentiments ? {
              positivePct: transcript.analytics.sentiments.positive_pct,
              neutralPct: transcript.analytics.sentiments.neutral_pct,
              negativePct: transcript.analytics.sentiments.negative_pct,
            } : undefined,
            speakers: transcript.analytics.speakers?.map((s: any) => ({
              speakerId: s.speaker_id,
              name: s.name,
              duration: s.duration,
              wordCount: s.word_count,
              wordsPerMinute: s.words_per_minute,
              questionsAsked: s.questions,
              fillerWords: s.filler_words,
              durationPercent: s.duration_pct,
            })),
            taskCount: sentences.filter((s: any) => s.isTask).length,
            questionCount: sentences.filter((s: any) => s.isQuestion).length,
          } : undefined,
          actionItems,
          processingStatus: "processed",
          aiTasksExtracted: false,
          source: "api",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await addDoc(meetingsRef, meetingData);
        imported++;
      } catch (error) {
        console.error(`Failed to import meeting ${firefliesId}:`, error);
        errors.push(`Failed to import meeting ${transcript.title}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalFetched: transcripts.length,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Imported ${imported} meetings, skipped ${skipped} duplicates`,
    });
  } catch (error) {
    console.error("Error importing from Fireflies:", error);
    return NextResponse.json(
      { error: "Failed to import meetings from Fireflies" },
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

    // Get Fireflies API key from settings
    const settingsRef = collection(db, COLLECTIONS.FIREFLIES_SETTINGS);
    const settingsSnapshot = await getDocs(settingsRef);
    
    if (settingsSnapshot.empty || !settingsSnapshot.docs[0].data().apiKey) {
      return NextResponse.json({
        configured: false,
        message: "Fireflies API key not configured",
      });
    }

    const settings = settingsSnapshot.docs[0].data();
    const apiKey = settings.apiKey;

    if (action === "preview") {
      // Fetch a preview of available meetings (just count)
      const previewQuery = `
        query Transcripts {
          transcripts(limit: 50) {
            id
            title
          }
        }
      `;

      const response = await fetch("https://api.fireflies.ai/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query: previewQuery }),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Fireflies API error: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      const meetingCount = data.data?.transcripts?.length || 0;

      // Get count of already imported meetings
      const meetingsRef = collection(db, COLLECTIONS.FIREFLIES_MEETINGS);
      const existingSnapshot = await getDocs(meetingsRef);
      const existingCount = existingSnapshot.size;

      return NextResponse.json({
        configured: true,
        availableMeetings: meetingCount,
        hasMorePages: meetingCount >= 50,
        alreadyImported: existingCount,
        message: meetingCount >= 50 
          ? `Found ${meetingCount}+ meetings available (more may exist)`
          : `Found ${meetingCount} meetings available`,
      });
    }

    // Default: return configuration status
    return NextResponse.json({
      configured: true,
      apiKeySet: true,
    });
  } catch (error) {
    console.error("Error checking Fireflies import status:", error);
    return NextResponse.json(
      { error: "Failed to check import status" },
      { status: 500 }
    );
  }
}
