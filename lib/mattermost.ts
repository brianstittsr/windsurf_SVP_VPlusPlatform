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
  | "send_to_brian_stitt"
  // Traction/EOS Events
  | "rock_created"
  | "rock_status_changed"
  | "rock_completed"
  | "rock_at_risk"
  | "rock_off_track"
  | "scorecard_updated"
  | "scorecard_below_goal"
  | "scorecard_above_goal"
  | "issue_created"
  | "issue_solved"
  | "todo_created"
  | "todo_completed"
  | "todo_overdue"
  | "level10_meeting_logged"
  | "team_member_added"
  | "team_member_gwc_updated";

export interface WebhookEvent {
  type: WebhookEventType;
  label: string;
  description: string;
  enabled: boolean;
  category?: "general" | "traction";
}

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  // General Events
  { type: "new_lead", label: "New Lead Created", description: "When a new lead is added to the pipeline", enabled: true, category: "general" },
  { type: "deal_status_changed", label: "Deal Status Changed", description: "When a deal moves to a new stage", enabled: true, category: "general" },
  { type: "one_to_one_scheduled", label: "One-to-One Scheduled", description: "When an affiliate schedules a 1:1 meeting", enabled: true, category: "general" },
  { type: "affiliate_joined", label: "Affiliate Joined", description: "When a new affiliate joins the network", enabled: true, category: "general" },
  { type: "meeting_completed", label: "Meeting Completed", description: "When a meeting is marked as completed", enabled: true, category: "general" },
  { type: "document_uploaded", label: "Document Uploaded", description: "When a document is uploaded to a project", enabled: false, category: "general" },
  { type: "referral_submitted", label: "Referral Submitted", description: "When an affiliate submits a referral", enabled: true, category: "general" },
  { type: "send_to_brian_stitt", label: "Send to Brian Stitt", description: "Direct message to Brian Stitt's channel", enabled: true, category: "general" },
  // Traction/EOS Events
  { type: "rock_created", label: "Rock Created", description: "When a new quarterly Rock is added", enabled: true, category: "traction" },
  { type: "rock_status_changed", label: "Rock Status Changed", description: "When a Rock's status changes", enabled: true, category: "traction" },
  { type: "rock_completed", label: "Rock Completed", description: "When a Rock is marked complete", enabled: true, category: "traction" },
  { type: "rock_at_risk", label: "Rock At Risk", description: "When a Rock moves to at-risk status", enabled: true, category: "traction" },
  { type: "rock_off_track", label: "Rock Off Track", description: "When a Rock moves to off-track status", enabled: true, category: "traction" },
  { type: "scorecard_updated", label: "Scorecard Updated", description: "When a scorecard metric is updated", enabled: false, category: "traction" },
  { type: "scorecard_below_goal", label: "Scorecard Below Goal", description: "When a metric falls below its goal", enabled: true, category: "traction" },
  { type: "scorecard_above_goal", label: "Scorecard Above Goal", description: "When a metric exceeds its goal", enabled: false, category: "traction" },
  { type: "issue_created", label: "Issue Created", description: "When a new IDS issue is identified", enabled: true, category: "traction" },
  { type: "issue_solved", label: "Issue Solved", description: "When an issue is marked as solved", enabled: true, category: "traction" },
  { type: "todo_created", label: "To-Do Created", description: "When a new to-do is added", enabled: false, category: "traction" },
  { type: "todo_completed", label: "To-Do Completed", description: "When a to-do is marked complete", enabled: false, category: "traction" },
  { type: "todo_overdue", label: "To-Do Overdue", description: "When a to-do passes its due date", enabled: true, category: "traction" },
  { type: "level10_meeting_logged", label: "Level 10 Meeting Logged", description: "When a Level 10 meeting is recorded", enabled: true, category: "traction" },
  { type: "team_member_added", label: "Team Member Added", description: "When a new team member is added", enabled: true, category: "traction" },
  { type: "team_member_gwc_updated", label: "GWC Assessment Updated", description: "When a team member's GWC is updated", enabled: false, category: "traction" },
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

    // =========================================================================
    // TRACTION/EOS EVENTS
    // =========================================================================

    case "rock_created":
      return {
        ...baseConfig,
        icon_emoji: ":mountain:",
        text: `### 🏔️ New Rock Created`,
        attachments: [{
          color: "#9b59b6",
          fields: [
            { title: "Rock", value: String(data.description || "N/A"), short: false },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Quarter", value: String(data.quarter || "N/A"), short: true },
            { title: "Due Date", value: String(data.dueDate || "N/A"), short: true },
            { title: "Status", value: String(data.status || "on-track"), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard",
        }],
      };

    case "rock_status_changed":
      const statusColor = data.newStatus === "complete" ? "#27ae60" : 
                          data.newStatus === "on-track" ? "#3498db" :
                          data.newStatus === "at-risk" ? "#f39c12" : "#e74c3c";
      const statusEmoji = data.newStatus === "complete" ? "✅" : 
                          data.newStatus === "on-track" ? "🟢" :
                          data.newStatus === "at-risk" ? "🟡" : "🔴";
      return {
        ...baseConfig,
        icon_emoji: ":mountain:",
        text: `### ${statusEmoji} Rock Status Changed`,
        attachments: [{
          color: statusColor,
          fields: [
            { title: "Rock", value: String(data.description || "N/A"), short: false },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "New Status", value: String(data.newStatus || "N/A").replace("-", " ").toUpperCase(), short: true },
            { title: "Previous Status", value: String(data.previousStatus || "N/A").replace("-", " ").toUpperCase(), short: true },
            { title: "Progress", value: `${data.progress || 0}%`, short: true },
          ],
          footer: "SVP Platform • Traction Dashboard",
        }],
      };

    case "rock_completed":
      return {
        ...baseConfig,
        icon_emoji: ":tada:",
        text: `### 🎉 Rock Completed!`,
        attachments: [{
          color: "#27ae60",
          fields: [
            { title: "Rock", value: String(data.description || "N/A"), short: false },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Quarter", value: String(data.quarter || "N/A"), short: true },
            { title: "Completed", value: new Date().toLocaleDateString(), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard • 🏆 Achievement Unlocked!",
        }],
      };

    case "rock_at_risk":
      return {
        ...baseConfig,
        icon_emoji: ":warning:",
        text: `### ⚠️ Rock At Risk`,
        attachments: [{
          color: "#f39c12",
          fields: [
            { title: "Rock", value: String(data.description || "N/A"), short: false },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Progress", value: `${data.progress || 0}%`, short: true },
            { title: "Due Date", value: String(data.dueDate || "N/A"), short: true },
            { title: "Quarter", value: String(data.quarter || "N/A"), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard • Action Required",
        }],
      };

    case "rock_off_track":
      return {
        ...baseConfig,
        icon_emoji: ":rotating_light:",
        text: `### 🚨 Rock Off Track`,
        attachments: [{
          color: "#e74c3c",
          fields: [
            { title: "Rock", value: String(data.description || "N/A"), short: false },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Progress", value: `${data.progress || 0}%`, short: true },
            { title: "Due Date", value: String(data.dueDate || "N/A"), short: true },
            { title: "Quarter", value: String(data.quarter || "N/A"), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard • URGENT: Needs Immediate Attention",
        }],
      };

    case "scorecard_updated":
      return {
        ...baseConfig,
        icon_emoji: ":bar_chart:",
        text: `### 📊 Scorecard Updated`,
        attachments: [{
          color: "#3498db",
          fields: [
            { title: "Metric", value: String(data.name || "N/A"), short: true },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Goal", value: `${data.unit || ""}${data.goal || 0}`, short: true },
            { title: "Actual", value: `${data.unit || ""}${data.actual || 0}`, short: true },
          ],
          footer: "SVP Platform • Traction Dashboard",
        }],
      };

    case "scorecard_below_goal":
      return {
        ...baseConfig,
        icon_emoji: ":chart_with_downwards_trend:",
        text: `### 📉 Scorecard Metric Below Goal`,
        attachments: [{
          color: "#e74c3c",
          fields: [
            { title: "Metric", value: String(data.name || "N/A"), short: true },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Goal", value: `${data.unit || ""}${Number(data.goal || 0).toLocaleString()}`, short: true },
            { title: "Actual", value: `${data.unit || ""}${Number(data.actual || 0).toLocaleString()}`, short: true },
            { title: "Gap", value: `${data.unit || ""}${Number((data.goal as number) - (data.actual as number)).toLocaleString()}`, short: true },
            { title: "Trend", value: String(data.trend || "flat"), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard • Review in Level 10",
        }],
      };

    case "scorecard_above_goal":
      return {
        ...baseConfig,
        icon_emoji: ":chart_with_upwards_trend:",
        text: `### 📈 Scorecard Metric Above Goal!`,
        attachments: [{
          color: "#27ae60",
          fields: [
            { title: "Metric", value: String(data.name || "N/A"), short: true },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Goal", value: `${data.unit || ""}${Number(data.goal || 0).toLocaleString()}`, short: true },
            { title: "Actual", value: `${data.unit || ""}${Number(data.actual || 0).toLocaleString()}`, short: true },
          ],
          footer: "SVP Platform • Traction Dashboard • Great Work! 🌟",
        }],
      };

    case "issue_created":
      const priorityColor = data.priority === "high" ? "#e74c3c" : 
                            data.priority === "medium" ? "#f39c12" : "#3498db";
      return {
        ...baseConfig,
        icon_emoji: ":exclamation:",
        text: `### ❗ New Issue Identified`,
        attachments: [{
          color: priorityColor,
          fields: [
            { title: "Issue", value: String(data.description || "N/A"), short: false },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Priority", value: String(data.priority || "medium").toUpperCase(), short: true },
            { title: "Identified", value: String(data.identifiedDate || new Date().toLocaleDateString()), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard • IDS: Identify, Discuss, Solve",
        }],
      };

    case "issue_solved":
      return {
        ...baseConfig,
        icon_emoji: ":white_check_mark:",
        text: `### ✅ Issue Solved!`,
        attachments: [{
          color: "#27ae60",
          fields: [
            { title: "Issue", value: String(data.description || "N/A"), short: false },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Solved", value: new Date().toLocaleDateString(), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard • IDS Complete",
        }],
      };

    case "todo_created":
      return {
        ...baseConfig,
        icon_emoji: ":clipboard:",
        text: `### 📋 New To-Do Created`,
        attachments: [{
          color: "#3498db",
          fields: [
            { title: "To-Do", value: String(data.description || "N/A"), short: false },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Due Date", value: String(data.dueDate || "N/A"), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard",
        }],
      };

    case "todo_completed":
      return {
        ...baseConfig,
        icon_emoji: ":ballot_box_with_check:",
        text: `### ☑️ To-Do Completed`,
        attachments: [{
          color: "#27ae60",
          fields: [
            { title: "To-Do", value: String(data.description || "N/A"), short: false },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Completed", value: new Date().toLocaleDateString(), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard",
        }],
      };

    case "todo_overdue":
      return {
        ...baseConfig,
        icon_emoji: ":alarm_clock:",
        text: `### ⏰ To-Do Overdue`,
        attachments: [{
          color: "#e74c3c",
          fields: [
            { title: "To-Do", value: String(data.description || "N/A"), short: false },
            { title: "Owner", value: String(data.owner || "N/A"), short: true },
            { title: "Due Date", value: String(data.dueDate || "N/A"), short: true },
            { title: "Days Overdue", value: String(data.daysOverdue || "1"), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard • Action Required",
        }],
      };

    case "level10_meeting_logged":
      return {
        ...baseConfig,
        icon_emoji: ":calendar:",
        text: `### 📅 Level 10 Meeting Logged`,
        attachments: [{
          color: "#9b59b6",
          fields: [
            { title: "Date", value: String(data.date || "N/A"), short: true },
            { title: "Rating", value: `${data.rating || 0}/10`, short: true },
            { title: "Issues Solved", value: String(data.issuesSolved || 0), short: true },
            { title: "To-Do Completion", value: `${data.todoCompletionRate || 0}%`, short: true },
            { title: "Rocks Reviewed", value: data.rocksReviewed ? "✅ Yes" : "❌ No", short: true },
            { title: "Scorecard Reviewed", value: data.scorecardReviewed ? "✅ Yes" : "❌ No", short: true },
          ],
          footer: "SVP Platform • Traction Dashboard • Level 10 Meeting",
        }],
      };

    case "team_member_added":
      return {
        ...baseConfig,
        icon_emoji: ":busts_in_silhouette:",
        text: `### 👥 Team Member Added`,
        attachments: [{
          color: "#9b59b6",
          fields: [
            { title: "Name", value: String(data.name || "N/A"), short: true },
            { title: "Role", value: String(data.role || "N/A"), short: true },
            { title: "Category", value: String(data.category || "team"), short: true },
          ],
          footer: "SVP Platform • Traction Dashboard • People",
        }],
      };

    case "team_member_gwc_updated":
      const gwcStatus = (data.getsIt && data.wantsIt && data.capacityToDoIt) ? "✅ All Yes" : "⚠️ Needs Review";
      return {
        ...baseConfig,
        icon_emoji: ":clipboard:",
        text: `### 📋 GWC Assessment Updated`,
        attachments: [{
          color: (data.getsIt && data.wantsIt && data.capacityToDoIt) ? "#27ae60" : "#f39c12",
          fields: [
            { title: "Team Member", value: String(data.name || "N/A"), short: true },
            { title: "Role", value: String(data.role || "N/A"), short: true },
            { title: "Gets It", value: data.getsIt === true ? "✅" : data.getsIt === false ? "❌" : "—", short: true },
            { title: "Wants It", value: data.wantsIt === true ? "✅" : data.wantsIt === false ? "❌" : "—", short: true },
            { title: "Capacity", value: data.capacityToDoIt === true ? "✅" : data.capacityToDoIt === false ? "❌" : "—", short: true },
            { title: "Right Seat", value: data.rightSeat === true ? "✅" : data.rightSeat === false ? "❌" : "—", short: true },
          ],
          footer: `SVP Platform • Traction Dashboard • ${gwcStatus}`,
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
