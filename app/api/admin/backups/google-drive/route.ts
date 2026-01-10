import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";
import {
  getAuthUrl,
  getTokensFromCode,
  createDriveClient,
  getOrCreateBackupFolder,
  uploadBackupToGoogleDrive,
  listBackupsInGoogleDrive,
  downloadBackupFromGoogleDrive,
  deleteBackupFromGoogleDrive,
  refreshAccessToken,
} from "@/lib/google-drive";

// GET - Get Google Drive connection status or list backups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Get stored tokens
    const tokensRef = doc(db, COLLECTIONS.GOOGLE_DRIVE_TOKENS, "default");
    const tokensDoc = await getDoc(tokensRef);

    if (action === "auth-url") {
      // Generate OAuth URL for connecting Google Drive
      try {
        const authUrl = getAuthUrl("backup");
        return NextResponse.json({ authUrl });
      } catch (error) {
        return NextResponse.json({ 
          error: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." 
        }, { status: 400 });
      }
    }

    if (action === "status") {
      // Return connection status
      if (!tokensDoc.exists()) {
        return NextResponse.json({
          connected: false,
          message: "Google Drive not connected",
        });
      }

      const tokens = tokensDoc.data();
      return NextResponse.json({
        connected: true,
        connectedEmail: tokens.connectedEmail,
        connectedAt: tokens.connectedAt?.toDate?.()?.toISOString(),
      });
    }

    if (action === "list") {
      // List backups from Google Drive
      if (!tokensDoc.exists()) {
        return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 });
      }

      const tokens = tokensDoc.data();
      
      // Check if token needs refresh
      let accessToken = tokens.accessToken;
      if (tokens.expiresAt < Date.now()) {
        try {
          const refreshed = await refreshAccessToken(tokens.refreshToken);
          accessToken = refreshed.accessToken;
          
          // Update stored tokens
          await setDoc(tokensRef, {
            ...tokens,
            accessToken: refreshed.accessToken,
            expiresAt: refreshed.expiresAt,
            updatedAt: Timestamp.now(),
          });
        } catch (error) {
          return NextResponse.json({ error: "Failed to refresh token. Please reconnect Google Drive." }, { status: 401 });
        }
      }

      const drive = createDriveClient(accessToken, tokens.refreshToken);
      
      // Get or create backup folder
      const folderId = await getOrCreateBackupFolder(drive);
      
      // List files
      const files = await listBackupsInGoogleDrive(drive, folderId);

      return NextResponse.json({ files, folderId });
    }

    // Default: return status
    return NextResponse.json({
      connected: tokensDoc.exists(),
      connectedEmail: tokensDoc.exists() ? tokensDoc.data()?.connectedEmail : null,
    });
  } catch (error) {
    console.error("Google Drive GET error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// POST - Connect Google Drive or upload backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, code, backupId, backupData, fileName } = body;

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const tokensRef = doc(db, COLLECTIONS.GOOGLE_DRIVE_TOKENS, "default");

    if (action === "connect") {
      // Exchange authorization code for tokens
      if (!code) {
        return NextResponse.json({ error: "Authorization code required" }, { status: 400 });
      }

      try {
        const tokens = await getTokensFromCode(code);
        
        // Get user info
        const drive = createDriveClient(tokens.access_token!, tokens.refresh_token || undefined);
        const about = await drive.about.get({ fields: "user" });
        const email = about.data.user?.emailAddress;

        // Store tokens
        await setDoc(tokensRef, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date || Date.now() + 3600000,
          scope: tokens.scope,
          tokenType: tokens.token_type,
          connectedEmail: email,
          connectedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        return NextResponse.json({
          success: true,
          connectedEmail: email,
          message: "Google Drive connected successfully",
        });
      } catch (error) {
        console.error("OAuth error:", error);
        return NextResponse.json({ error: "Failed to connect Google Drive" }, { status: 400 });
      }
    }

    if (action === "upload") {
      // Upload backup to Google Drive
      const tokensDoc = await getDoc(tokensRef);
      if (!tokensDoc.exists()) {
        return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 });
      }

      const tokens = tokensDoc.data();
      
      // Refresh token if needed
      let accessToken = tokens.accessToken;
      if (tokens.expiresAt < Date.now()) {
        const refreshed = await refreshAccessToken(tokens.refreshToken);
        accessToken = refreshed.accessToken;
        await setDoc(tokensRef, {
          ...tokens,
          accessToken: refreshed.accessToken,
          expiresAt: refreshed.expiresAt,
          updatedAt: Timestamp.now(),
        });
      }

      const drive = createDriveClient(accessToken, tokens.refreshToken);
      const folderId = await getOrCreateBackupFolder(drive);

      const result = await uploadBackupToGoogleDrive(
        drive,
        folderId,
        fileName || `backup_${Date.now()}.json`,
        typeof backupData === "string" ? backupData : JSON.stringify(backupData)
      );

      // Update backup metadata with Google Drive info
      if (backupId) {
        const backupRef = doc(db, COLLECTIONS.BACKUP_METADATA, backupId);
        const backupDoc = await getDoc(backupRef);
        if (backupDoc.exists()) {
          const existingData = backupDoc.data();
          const storageLocations = existingData.storageLocations || [];
          storageLocations.push({
            provider: "google_drive",
            path: folderId,
            fileId: result.fileId,
            url: result.webViewLink,
            uploadedAt: Timestamp.now(),
          });
          await setDoc(backupRef, { ...existingData, storageLocations }, { merge: true });
        }
      }

      return NextResponse.json({
        success: true,
        fileId: result.fileId,
        webViewLink: result.webViewLink,
        message: "Backup uploaded to Google Drive",
      });
    }

    if (action === "download") {
      // Download backup from Google Drive
      const { fileId } = body;
      if (!fileId) {
        return NextResponse.json({ error: "File ID required" }, { status: 400 });
      }

      const tokensDoc = await getDoc(tokensRef);
      if (!tokensDoc.exists()) {
        return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 });
      }

      const tokens = tokensDoc.data();
      let accessToken = tokens.accessToken;
      if (tokens.expiresAt < Date.now()) {
        const refreshed = await refreshAccessToken(tokens.refreshToken);
        accessToken = refreshed.accessToken;
      }

      const drive = createDriveClient(accessToken, tokens.refreshToken);
      const content = await downloadBackupFromGoogleDrive(drive, fileId);

      return NextResponse.json({
        success: true,
        content,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Google Drive POST error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// DELETE - Disconnect Google Drive or delete backup
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const fileId = searchParams.get("fileId");

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const tokensRef = doc(db, COLLECTIONS.GOOGLE_DRIVE_TOKENS, "default");

    if (action === "disconnect") {
      // Remove stored tokens
      await deleteDoc(tokensRef);
      return NextResponse.json({
        success: true,
        message: "Google Drive disconnected",
      });
    }

    if (action === "delete-file" && fileId) {
      // Delete file from Google Drive
      const tokensDoc = await getDoc(tokensRef);
      if (!tokensDoc.exists()) {
        return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 });
      }

      const tokens = tokensDoc.data();
      let accessToken = tokens.accessToken;
      if (tokens.expiresAt < Date.now()) {
        const refreshed = await refreshAccessToken(tokens.refreshToken);
        accessToken = refreshed.accessToken;
      }

      const drive = createDriveClient(accessToken, tokens.refreshToken);
      await deleteBackupFromGoogleDrive(drive, fileId);

      return NextResponse.json({
        success: true,
        message: "File deleted from Google Drive",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Google Drive DELETE error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
