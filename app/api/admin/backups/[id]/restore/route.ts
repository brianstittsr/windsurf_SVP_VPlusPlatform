import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, writeBatch, Timestamp } from "firebase/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { id: backupId } = await params;
    const body = await request.json();
    const { collections, overwrite = false, dryRun = false } = body;

    // Get backup metadata
    const metadataRef = doc(db, "backupMetadata", backupId);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const metadata = metadataSnap.data();
    
    // Check if backup has inline data (demo mode)
    if (!metadata.backupData) {
      return NextResponse.json({ 
        error: "Backup data not available. Storage provider restore not yet implemented." 
      }, { status: 400 });
    }

    const backupData = JSON.parse(metadata.backupData);
    const collectionsToRestore = collections || Object.keys(backupData.data);
    const restoredCounts: Record<string, number> = {};
    const errors: string[] = [];

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        collectionsToRestore,
        documentCounts: backupData.documentCounts,
        message: "Dry run completed. No changes made.",
      });
    }

    // Restore each collection
    for (const collectionName of collectionsToRestore) {
      const documents = backupData.data[collectionName];
      if (!documents || !Array.isArray(documents)) {
        continue;
      }

      try {
        let count = 0;
        const batch = writeBatch(db);

        for (const docData of documents) {
          const { id, ...data } = docData;
          const docRef = doc(db, collectionName, id);
          
          if (overwrite) {
            batch.set(docRef, data);
          } else {
            batch.set(docRef, data, { merge: true });
          }
          count++;

          // Firestore batch limit is 500
          if (count % 450 === 0) {
            await batch.commit();
          }
        }

        await batch.commit();
        restoredCounts[collectionName] = documents.length;
      } catch (error: any) {
        errors.push(`Failed to restore ${collectionName}: ${error.message}`);
      }
    }

    const totalRestored = Object.values(restoredCounts).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: errors.length === 0,
      restoredCollections: Object.keys(restoredCounts),
      documentCounts: restoredCounts,
      totalRestored,
      errors: errors.length > 0 ? errors : undefined,
      message: `Restored ${totalRestored} documents from ${Object.keys(restoredCounts).length} collections`,
    });
  } catch (error) {
    console.error("Restore backup error:", error);
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 });
  }
}
