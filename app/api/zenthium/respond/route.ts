import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { sendInterestResponseEmail } from "@/lib/zenthium/email-notifications";

const responseSchema = z.object({
  submissionId: z.string(),
  response: z.enum(["interested", "not-interested"]),
  token: z.string(),
});

export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json(
      { error: "Database not initialized" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");
    const response = searchParams.get("response");
    const token = searchParams.get("token");

    if (!submissionId || !response || !token) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate token (simple validation - in production use proper crypto)
    const decoded = Buffer.from(token, 'base64').toString();
    const [id] = decoded.split(':');
    if (id !== submissionId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 403 }
      );
    }

    // Fetch submission
    const docRef = adminDb.collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS).doc(submissionId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const submission = doc.data();
    if (!submission) {
      return NextResponse.json(
        { error: "Submission data is empty" },
        { status: 404 }
      );
    }

    // Determine new status
    const isInterested = response === "interested";
    const newStatus = isInterested ? "Partner Interested" : "Partner Declined";
    const previousStatus = submission.status || "Submitted";

    // Update submission status
    const now = Timestamp.now();
    await docRef.update({
      status: newStatus,
      partnerResponse: {
        interested: isInterested,
        respondedAt: now,
        previousStatus,
      },
      updatedAt: now,
    });

    // Add to status history
    const historyRef = docRef.collection("statusHistory").doc();
    await historyRef.set({
      from: previousStatus,
      to: newStatus,
      changedAt: now,
      changedBy: "partner_response",
      notes: `Partner responded: ${isInterested ? "Interested" : "Not Interested"}`,
    });

    // Send email notifications
    await sendInterestResponseEmail({
      submission,
      submissionId,
      isInterested,
      respondedAt: new Date(),
    });

    // Return HTML response for user feedback
    const html = generateResponseHTML(isInterested, submission);

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });

  } catch (error) {
    console.error("[Zenthium] Response handling error:", error);
    return NextResponse.json(
      { error: "Failed to process response" },
      { status: 500 }
    );
  }
}

function generateResponseHTML(isInterested: boolean, submission: any): string {
  const propertyName = submission.propertyName || "the property";
  const title = isInterested ? "Thank You for Your Interest!" : "Response Recorded";
  const message = isInterested 
    ? `We have recorded your interest in <strong>${propertyName}</strong>. A member of our team will contact you within 24 hours to discuss next steps and schedule a site visit if appropriate.`
    : `We have recorded your response regarding <strong>${propertyName}</strong>. Thank you for your consideration. If your requirements change in the future, please don't hesitate to reach out.`;
  
  const color = isInterested ? "#00c853" : "#9e9e9e";
  const icon = isInterested ? "✓" : "✗";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Strategic Value Plus</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      width: 100%;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: ${color};
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px;
      text-align: center;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      margin-bottom: 24px;
    }
    .property-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      text-align: left;
    }
    .property-card h3 {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .property-card p {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0;
    }
    .next-steps {
      background: #e94560;
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin-top: 24px;
    }
    .next-steps h3 {
      font-size: 16px;
      margin-bottom: 12px;
    }
    .next-steps ul {
      list-style: none;
      text-align: left;
    }
    .next-steps li {
      padding: 4px 0;
      padding-left: 20px;
      position: relative;
    }
    .next-steps li:before {
      content: "→";
      position: absolute;
      left: 0;
    }
    .footer {
      background: #1a1a2e;
      color: white;
      padding: 24px 40px;
      text-align: center;
    }
    .footer p {
      font-size: 14px;
      opacity: 0.8;
      margin-bottom: 8px;
    }
    .footer a {
      color: #e94560;
      text-decoration: none;
    }
    .contact-info {
      margin-top: 16px;
      font-size: 12px;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">${icon}</div>
      <h1>${title}</h1>
    </div>
    
    <div class="content">
      <p>${message}</p>
      
      <div class="property-card">
        <h3>Property</h3>
        <p>${propertyName}</p>
      </div>
      
      ${isInterested ? `
      <div class="next-steps">
        <h3>Next Steps</h3>
        <ul>
          <li>Our team will review your response</li>
          <li>Site visit coordination within 48 hours</li>
          <li>Detailed property information package</li>
          <li>Direct contact from Nelinia Varenas, CEO</li>
        </ul>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p><strong>Strategic Value Plus, Inc.</strong></p>
      <p>Zenthium Data Center Division</p>
      <div class="contact-info">
        <p>Email: <a href="mailto:zenthium@strategicvalueplus.com">zenthium@strategicvalueplus.com</a></p>
        <p>Phone: 1-800-555-0199</p>
        <p>Web: <a href="https://strategicvalueplus.com/zenthium">strategicvalueplus.com/zenthium</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
