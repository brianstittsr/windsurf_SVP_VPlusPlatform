/**
 * Mattermost Integration
 * 
 * Provides webhook functionality to send notifications to Mattermost channels
 */

export interface MattermostMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_url?: string;
  icon_emoji?: string;
  attachments?: MattermostAttachment[];
}

export interface MattermostAttachment {
  fallback?: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: { title: string; value: string; short?: boolean }[];
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
}

export type WebhookEventType =
  | "new_lead"
  | "deal_status_changed"
  | "one_to_one_scheduled"
  | "affiliate_joined"
  | "meeting_completed"
  | "document_uploaded"
  | "referral_submitted"
  | "send_to_brian_stitt";

export interface WebhookEvent {
  type: WebhookEventType;
  label: string;
  description: string;
  enabled: boolean;
}

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  { type: "new_lead", label: "New Lead Created", description: "When a new lead is added to the pipeline", enabled: true },
  { type: "deal_status_changed", label: "Deal Status Changed", description: "When a deal moves to a new stage", enabled: true },
  { type: "one_to_one_scheduled", label: "One-to-One Scheduled", description: "When an affiliate schedules a 1:1 meeting", enabled: true },
  { type: "affiliate_joined", label: "Affiliate Joined", description: "When a new affiliate joins the network", enabled: true },
  { type: "meeting_completed", label: "Meeting Completed", description: "When a meeting is marked as completed", enabled: true },
  { type: "document_uploaded", label: "Document Uploaded", description: "When a document is uploaded to a project", enabled: false },
  { type: "referral_submitted", label: "Referral Submitted", description: "When an affiliate submits a referral", enabled: true },
  { type: "send_to_brian_stitt", label: "Send to Brian Stitt", description: "Direct message to Brian Stitt's channel", enabled: true },
];

/**
 * Send a message to Mattermost via incoming webhook
 * Uses API route to avoid CORS issues when called from browser
 */
export async function sendToMattermost(
  webhookUrl: string,
  message: MattermostMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use API route to proxy the request (avoids CORS issues)
    const response = await fetch("/api/mattermost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl, message }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Send a formatted notification for a specific event type
 */
export async function sendWebhookNotification(
  webhookUrl: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const message = formatEventMessage(eventType, data);
  return sendToMattermost(webhookUrl, message);
}

/**
 * Format event data into a Mattermost message
 */
function formatEventMessage(
  eventType: WebhookEventType,
  data: Record<string, unknown>
): MattermostMessage {
  const baseConfig = {
    username: "SVP Platform",
    icon_emoji: ":rocket:",
  };

  switch (eventType) {
    case "send_to_brian_stitt":
      return {
        ...baseConfig,
        text: `### 📬 Message from SVP Platform\n\n${data.message || "No message provided"}`,
        attachments: data.attachments ? [{
          color: "#0066cc",
          fields: Object.entries(data.details || {}).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
          footer: `Sent from SVP Platform • ${new Date().toLocaleString()}`,
        }] : undefined,
      };

    case "new_lead":
      return {
        ...baseConfig,
        text: `### 🎯 New Lead Created`,
        attachments: [{
          color: "#36a64f",
          fields: [
            { title: "Company", value: String(data.company || "N/A"), short: true },
            { title: "Contact", value: String(data.contact || "N/A"), short: true },
            { title: "Source", value: String(data.source || "N/A"), short: true },
            { title: "Value", value: data.value ? `$${Number(data.value).toLocaleString()}` : "TBD", short: true },
          ],
          footer: "SVP Platform • Lead Management",
        }],
      };

    case "deal_status_changed":
      return {
        ...baseConfig,
        text: `### 📊 Deal Status Updated`,
        attachments: [{
          color: "#f2c744",
          fields: [
            { title: "Deal", value: String(data.dealName || "N/A"), short: true },
            { title: "New Status", value: String(data.newStatus || "N/A"), short: true },
            { title: "Previous Status", value: String(data.previousStatus || "N/A"), short: true },
            { title: "Value", value: data.value ? `$${Number(data.value).toLocaleString()}` : "N/A", short: true },
          ],
          footer: "SVP Platform • Pipeline",
        }],
      };

    case "one_to_one_scheduled":
      return {
        ...baseConfig,
        text: `### 🤝 One-to-One Meeting Scheduled`,
        attachments: [{
          color: "#0066cc",
          fields: [
            { title: "Initiator", value: String(data.initiator || "N/A"), short: true },
            { title: "Partner", value: String(data.partner || "N/A"), short: true },
            { title: "Date", value: String(data.date || "N/A"), short: true },
            { title: "Location", value: String(data.location || "Virtual"), short: true },
          ],
          footer: "SVP Platform • Affiliate Networking",
        }],
      };

    case "affiliate_joined":
      return {
        ...baseConfig,
        text: `### 🎉 New Affiliate Joined`,
        attachments: [{
          color: "#9b59b6",
          fields: [
            { title: "Name", value: String(data.name || "N/A"), short: true },
            { title: "Business", value: String(data.business || "N/A"), short: true },
            { title: "Specialty", value: String(data.specialty || "N/A"), short: true },
            { title: "Location", value: String(data.location || "N/A"), short: true },
          ],
          footer: "SVP Platform • Affiliate Network",
        }],
      };

    case "meeting_completed":
      return {
        ...baseConfig,
        text: `### ✅ Meeting Completed`,
        attachments: [{
          color: "#2ecc71",
          fields: [
            { title: "Meeting", value: String(data.title || "N/A"), short: true },
            { title: "Participants", value: String(data.participants || "N/A"), short: true },
            { title: "Duration", value: data.duration ? `${data.duration} min` : "N/A", short: true },
            { title: "Referrals Discussed", value: String(data.referralsDiscussed || "0"), short: true },
          ],
          footer: "SVP Platform • Meetings",
        }],
      };

    case "referral_submitted":
      return {
        ...baseConfig,
        text: `### 🔗 New Referral Submitted`,
        attachments: [{
          color: "#e74c3c",
          fields: [
            { title: "From", value: String(data.referrer || "N/A"), short: true },
            { title: "To", value: String(data.recipient || "N/A"), short: true },
            { title: "Prospect", value: String(data.prospect || "N/A"), short: true },
            { title: "Company", value: String(data.company || "N/A"), short: true },
            { title: "SVP Referral", value: data.isSvpReferral ? "Yes ⭐" : "No", short: true },
            { title: "Est. Value", value: data.value ? `$${Number(data.value).toLocaleString()}` : "TBD", short: true },
          ],
          footer: "SVP Platform • Referral Network",
        }],
      };

    case "document_uploaded":
      return {
        ...baseConfig,
        text: `### 📄 Document Uploaded`,
        attachments: [{
          color: "#3498db",
          fields: [
            { title: "Document", value: String(data.name || "N/A"), short: true },
            { title: "Project", value: String(data.project || "N/A"), short: true },
            { title: "Uploaded By", value: String(data.uploadedBy || "N/A"), short: true },
            { title: "Size", value: String(data.size || "N/A"), short: true },
          ],
          footer: "SVP Platform • Documents",
        }],
      };

    default:
      return {
        ...baseConfig,
        text: `### 📢 SVP Platform Notification\n\n${JSON.stringify(data, null, 2)}`,
      };
  }
}

/**
 * Test webhook connection by sending a test message
 */
export async function testWebhookConnection(
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  return sendToMattermost(webhookUrl, {
    text: "### ✅ SVP Platform Webhook Test\n\nThis is a test message from SVP Platform. Your webhook is configured correctly!",
    username: "SVP Platform",
    icon_emoji: ":white_check_mark:",
    attachments: [{
      color: "#36a64f",
      fields: [
        { title: "Status", value: "Connected", short: true },
        { title: "Timestamp", value: new Date().toISOString(), short: true },
      ],
      footer: "SVP Platform • Webhook Test",
    }],
  });
}

/**
 * Send a direct message to Brian Stitt's channel
 */
export async function sendToBrianStitt(
  webhookUrl: string,
  message: string,
  details?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  return sendWebhookNotification(webhookUrl, "send_to_brian_stitt", {
    message,
    details,
    attachments: !!details,
  });
}
