import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { COLLECTIONS, type FathomMeetingDoc, type FathomActionItem } from "@/lib/schema";
import crypto from "crypto";

// Verify webhook signature from Fathom
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Fathom uses format: v1,base64signature
    const [version, sig] = signature.split(",");
    if (version !== "v1") return false;

    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64");

    return sig === expectedSig;
  } catch {
    return false;
  }
}

// POST - Receive webhook from Fathom when meeting recording is ready
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("webhook-signature") || "";

    if (!db) {
      console.error("Database not initialized");
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Get webhook secret from settings (for verification)
    const settingsRef = collection(db, COLLECTIONS.FATHOM_SETTINGS);
    const settingsSnapshot = await getDocs(settingsRef);
    
    let webhookSecret = "";
    if (!settingsSnapshot.empty) {
      const settings = settingsSnapshot.docs[0].data();
      // In production, get the secret from the webhook config
      // For now, we'll skip verification if no secret is configured
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

    // Extract meeting data from Fathom webhook payload
    const {
      meeting_id,
      title,
      meeting_date,
      duration,
      recording_url,
      participants,
      host_email,
      summary,
      transcript,
      action_items,
      crm_matches,
    } = payload;

    // Convert transcript to our format
    const formattedTranscript = transcript?.map((entry: {
      speaker: string;
      text: string;
      start_time: number;
      end_time: number;
    }) => ({
      speaker: entry.speaker,
      text: entry.text,
      startTime: entry.start_time,
      endTime: entry.end_time,
    })) || [];

    // Build full transcript text for search
    const transcriptText = formattedTranscript
      .map((entry: { speaker: string; text: string }) => `${entry.speaker}: ${entry.text}`)
      .join("\n");

    // Convert action items to our format
    const formattedActionItems: FathomActionItem[] = (action_items || []).map(
      (item: { id?: string; text: string; assignee?: string }, index: number) => ({
        id: item.id || `fathom-${meeting_id}-${index}`,
        text: item.text,
        assigneeName: item.assignee || undefined,
        status: "pending" as const,
        createdFromTranscript: false,
      })
    );

    // Check if meeting already exists
    const meetingsRef = collection(db, COLLECTIONS.FATHOM_MEETINGS);
    const existingQuery = query(
      meetingsRef,
      where("fathomMeetingId", "==", meeting_id)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      // Meeting already processed
      return NextResponse.json({
        success: true,
        message: "Meeting already processed",
        meetingId: existingSnapshot.docs[0].id,
      });
    }

    // Create meeting document
    const meetingData: Omit<FathomMeetingDoc, "id"> = {
      fathomMeetingId: meeting_id,
      title: title || "Untitled Meeting",
      meetingDate: Timestamp.fromDate(new Date(meeting_date)),
      duration: duration || 0,
      recordingUrl: recording_url,
      participants: participants || [],
      hostEmail: host_email,
      summary: summary,
      transcript: formattedTranscript,
      transcriptText: transcriptText,
      actionItems: formattedActionItems,
      crmMatches: crm_matches?.map((match: {
        type: string;
        name: string;
        email?: string;
        company?: string;
      }) => ({
        type: match.type,
        name: match.name,
        email: match.email,
        company: match.company,
      })),
      processingStatus: "pending",
      aiTasksExtracted: false,
      source: "webhook",
      webhookReceivedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(meetingsRef, meetingData);

    console.log(`Fathom meeting received: ${docRef.id} - ${title}`);

    return NextResponse.json({
      success: true,
      meetingId: docRef.id,
      actionItemsCount: formattedActionItems.length,
    });
  } catch (error) {
    console.error("Error processing Fathom webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
