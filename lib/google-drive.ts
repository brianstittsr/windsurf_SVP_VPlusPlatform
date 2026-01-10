import { google } from "googleapis";

// Google Drive API configuration
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.appdata",
];

// Create OAuth2 client
export function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Generate auth URL for user consent
export function getAuthUrl(state?: string): string {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: state || "backup",
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Create authenticated Drive client
export function createDriveClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

// Get or create backup folder in Google Drive
export async function getOrCreateBackupFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string = "SVP Platform Backups"
): Promise<string> {
  // Search for existing folder
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  // Create new folder
  const folderMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
  });

  return folder.data.id!;
}

// Upload backup file to Google Drive
export async function uploadBackupToGoogleDrive(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
  fileName: string,
  content: string,
  mimeType: string = "application/json"
): Promise<{ fileId: string; webViewLink: string }> {
  const { Readable } = await import("stream");
  
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: Readable.from([content]),
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, webViewLink",
  });

  return {
    fileId: file.data.id!,
    webViewLink: file.data.webViewLink || "",
  };
}

// Download backup file from Google Drive
export async function downloadBackupFromGoogleDrive(
  drive: ReturnType<typeof google.drive>,
  fileId: string
): Promise<string> {
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" }
  );

  return response.data as string;
}

// List backup files in Google Drive folder
export async function listBackupsInGoogleDrive(
  drive: ReturnType<typeof google.drive>,
  folderId: string
): Promise<Array<{
  id: string;
  name: string;
  createdTime: string;
  size: string;
  webViewLink: string;
}>> {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, createdTime, size, webViewLink)",
    orderBy: "createdTime desc",
  });

  return (response.data.files || []).map((file: { id?: string | null; name?: string | null; createdTime?: string | null; size?: string | null; webViewLink?: string | null }) => ({
    id: file.id!,
    name: file.name!,
    createdTime: file.createdTime!,
    size: file.size || "0",
    webViewLink: file.webViewLink || "",
  }));
}

// Delete backup file from Google Drive
export async function deleteBackupFromGoogleDrive(
  drive: ReturnType<typeof google.drive>,
  fileId: string
): Promise<void> {
  await drive.files.delete({ fileId });
}

// Refresh access token if needed
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: number;
}> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token!,
    expiresAt: credentials.expiry_date || Date.now() + 3600000,
  };
}
