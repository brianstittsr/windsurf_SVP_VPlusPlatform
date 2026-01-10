import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { COLLECTIONS, type FirefliesMeetingDoc, type FirefliesActionItem } from "@/lib/schema";
import crypto from "crypto";

// Verify webhook signature from Fireflies
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return signature === expectedSig;
  } catch {
    return false;
  }
}

// Fetch full transcript from Fireflies GraphQL API
async function fetchTranscriptFromFireflies(
  meetingId: string,
  apiKey: string
): Promise<any> {
  const graphqlQuery = `
    query Transcript($transcriptId: String!) {
      transcript(id: $transcriptId) {
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

  const response = await fetch("https://api.fireflies.ai/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { transcriptId: meetingId },
    }),
  });

  if (!response.ok) {
    throw new Error(`Fireflies API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data?.transcript;
}

// POST - Receive webhook from Fireflies when transcription is complete
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256") || "";

    if (!db) {
      console.error("Database not initialized");
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Get settings for API key and webhook secret
    const settingsRef = collection(db, COLLECTIONS.FIREFLIES_SETTINGS);
    const settingsSnapshot = await getDocs(settingsRef);
    
    let apiKey = "";
    let webhookSecret = "";
    
    if (!settingsSnapshot.empty) {
      const settings = settingsSnapshot.docs[0].data();
      apiKey = settings.apiKey || "";
      webhookSecret = settings.webhookSecret || "";
    }

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const { meetingId, eventType, clientReferenceId } = payload;

    // Only process transcription complete events
    if (eventType !== "Transcription completed") {
      return NextResponse.json({
        success: true,
        message: `Ignored event type: ${eventType}`,
      });
    }

    if (!apiKey) {
      console.error("Fireflies API key not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 400 }
      );
    }

    // Check if meeting already exists
    const meetingsRef = collection(db, COLLECTIONS.FIREFLIES_MEETINGS);
    const existingQuery = query(
      meetingsRef,
      where("firefliesMeetingId", "==", meetingId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "Meeting already processed",
        meetingId: existingSnapshot.docs[0].id,
      });
    }

    // Fetch full transcript from Fireflies
    const transcript = await fetchTranscriptFromFireflies(meetingId, apiKey);

    if (!transcript) {
      return NextResponse.json(
        { error: "Failed to fetch transcript from Fireflies" },
        { status: 500 }
      );
    }

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
        id: `fireflies-${meetingId}-${index}`,
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
      firefliesMeetingId: meetingId,
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
      source: "webhook",
      webhookReceivedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(meetingsRef, meetingData);

    console.log(`Fireflies meeting received: ${docRef.id} - ${transcript.title}`);

    return NextResponse.json({
      success: true,
      meetingId: docRef.id,
      actionItemsCount: actionItems.length,
    });
  } catch (error) {
    console.error("Error processing Fireflies webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
