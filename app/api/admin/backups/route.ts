import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, where, doc, deleteDoc, Timestamp } from "firebase/firestore";

// GET - List all backups
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    let q = query(
      collection(db, "backupMetadata"),
      orderBy("createdAt", "desc"),
      limit(limitParam)
    );

    const snapshot = await getDocs(q);
    let backups = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || null,
    }));

    // Apply filters
    if (status) {
      backups = backups.filter((b: any) => b.status === status);
    }
    if (type) {
      backups = backups.filter((b: any) => b.type === type);
    }

    // Calculate stats
    const totalSize = backups.reduce((sum: number, b: any) => sum + (b.compressedSize || 0), 0);
    const successCount = backups.filter((b: any) => b.status === "success").length;
    const failedCount = backups.filter((b: any) => b.status === "failed").length;

    return NextResponse.json({
      backups,
      stats: {
        total: backups.length,
        totalSize,
        successCount,
        failedCount,
      },
    });
  } catch (error) {
    console.error("List backups error:", error);
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}

// POST - Create a new backup
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const body = await request.json();
    const {
      type = "full",
      collections,
      compression = "gzip",
      encryption = false,
      storageProviders = ["firebase"],
    } = body;

    // For now, we'll create a simple backup by exporting collections to JSON
    // In production, this would use the BackupService
    const collectionsToBackup = collections || [
      "teamMembers",
      "platformSettings",
      "bookCallLeads",
      "strategicPartners",
      "events",
    ];

    const backupData: Record<string, any[]> = {};
    const documentCounts: Record<string, number> = {};

    for (const collectionName of collectionsToBackup) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        backupData[collectionName] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        documentCounts[collectionName] = snapshot.docs.length;
      } catch (error) {
        console.warn(`Failed to backup collection ${collectionName}:`, error);
        backupData[collectionName] = [];
        documentCounts[collectionName] = 0;
      }
    }

    // Create backup JSON
    const backupJson = JSON.stringify({
      version: "1.0",
      createdAt: new Date().toISOString(),
      type,
      collections: collectionsToBackup,
      documentCounts,
      data: backupData,
    }, null, 2);

    const size = Buffer.from(backupJson).length;

    // Store backup metadata
    const backupId = `backup_${Date.now()}`;
    const metadataRef = doc(db, "backupMetadata", backupId);
    
    const metadata = {
      id: backupId,
      createdAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      type,
      status: "success",
      size,
      compressedSize: size,
      duration: 0,
      collections: collectionsToBackup,
      documentCounts,
      storageLocations: [{
        provider: "memory",
        path: backupId,
      }],
      checksum: "",
      encryptionEnabled: encryption,
      compression,
      triggeredBy: "manual",
    };

    // For demo purposes, we'll store the backup data in the metadata
    // In production, this would be uploaded to a storage provider
    await import("firebase/firestore").then(({ setDoc }) => 
      setDoc(metadataRef, {
        ...metadata,
        backupData: backupJson, // Store inline for demo
      })
    );

    return NextResponse.json({
      success: true,
      backup: metadata,
      message: `Backup created successfully with ${Object.values(documentCounts).reduce((a, b) => a + b, 0)} documents`,
    });
  } catch (error) {
    console.error("Create backup error:", error);
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}

// DELETE - Delete a backup
export async function DELETE(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get("id");

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "backupMetadata", backupId));

    return NextResponse.json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    console.error("Delete backup error:", error);
    return NextResponse.json({ error: "Failed to delete backup" }, { status: 500 });
  }
}
