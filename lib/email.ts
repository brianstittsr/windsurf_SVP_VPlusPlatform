/**
 * Email Utility using Microsoft Graph API
 * Based on existing platform infrastructure
 */

interface EmailAttachment {
  name: string;
  contentType: string;
  contentBytes: string; // Base64 encoded
}

interface SendEmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

/**
 * Send email using Microsoft Graph API
 * This integrates with the existing Azure AD email infrastructure
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, cc, bcc, subject, html, text, attachments } = params;

  // Check if email is configured
  if (!isEmailConfigured()) {
    console.warn("[Email] Email not configured - skipping send");
    // In development, log the email instead
    if (process.env.NODE_ENV === "development") {
      console.log("[Email] Would send to:", to);
      console.log("[Email] Subject:", subject);
      console.log("[Email] HTML length:", html.length);
    }
    return;
  }

  try {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@strategicvalueplus.com";
    const fromName = process.env.SMTP_FROM_NAME || "Strategic Value Plus";

    // Get access token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId || "",
          client_secret: clientSecret || "",
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Build email payload
    const emailPayload: any = {
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: html,
        },
        from: {
          emailAddress: {
            address: fromEmail,
            name: fromName,
          },
        },
        toRecipients: to.map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
      },
      saveToSentItems: true,
    };

    // Add CC if provided
    if (cc && cc.length > 0) {
      emailPayload.message.ccRecipients = cc.map((email) => ({
        emailAddress: {
          address: email,
        },
      }));
    }

    // Add BCC if provided
    if (bcc && bcc.length > 0) {
      emailPayload.message.bccRecipients = bcc.map((email) => ({
        emailAddress: {
          address: email,
        },
      }));
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailPayload.message.attachments = attachments.map((att) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: att.name,
        contentType: att.contentType,
        contentBytes: att.contentBytes,
      }));
    }

    // Send email via Microsoft Graph
    const sendResponse = await fetch(
      "https://graph.microsoft.com/v1.0/users/" + encodeURIComponent(fromEmail) + "/sendMail",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      }
    );

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      throw new Error(`Send email failed: ${sendResponse.status} - ${errorText}`);
    }

    console.log("[Email] Sent successfully to:", to.join(", "));
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    throw error;
  }
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.SMTP_FROM_EMAIL
  );
}

/**
 * Get email configuration status for debugging
 */
export function getEmailConfigStatus(): {
  configured: boolean;
  missing: string[];
} {
  const required = [
    "AZURE_TENANT_ID",
    "AZURE_CLIENT_ID",
    "AZURE_CLIENT_SECRET",
    "SMTP_FROM_EMAIL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  return {
    configured: missing.length === 0,
    missing,
  };
}
