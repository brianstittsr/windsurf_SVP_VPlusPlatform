import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import crypto from "crypto";
import {
  BackupConfig,
  BackupResult,
  BackupMetadataDoc,
  BackupFilters,
  RestoreOptions,
  RestoreResult,
  VerificationResult,
  StorageProvider,
  StorageLocation,
} from "./types";

// All collections to backup
const ALL_COLLECTIONS = [
  COLLECTIONS.TEAM_MEMBERS,
  COLLECTIONS.PLATFORM_SETTINGS,
  COLLECTIONS.BOOK_CALL_LEADS,
  COLLECTIONS.STRATEGIC_PARTNERS,
  COLLECTIONS.EVENTS,
  "heroSlides",
  "contactPopup",
  "marketingContent",
  "initiatives",
  "tbmncSuppliers",
  "passwordResetTokens",
  "backupMetadata",
  "backupSchedules",
];

export class BackupService {
  private storageProviders: Map<string, StorageProvider> = new Map();

  constructor() {}

  // Register a storage provider
  registerProvider(provider: StorageProvider): void {
    this.storageProviders.set(provider.name, provider);
  }

  // Get a storage provider by name
  getProvider(name: string): StorageProvider | undefined {
    return this.storageProviders.get(name);
  }

  // Create a backup
  async createBackup(
    config: BackupConfig,
    triggeredBy: "manual" | "scheduled" = "manual",
    scheduleId?: string
  ): Promise<BackupResult> {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const startTime = Date.now();
    const backupId = `backup_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const collectionsToBackup = config.collections || ALL_COLLECTIONS;

    // Create initial metadata
    const metadataRef = doc(db, "backupMetadata", backupId);
    await setDoc(metadataRef, {
      id: backupId,
      createdAt: Timestamp.now(),
      type: config.type,
      status: "in_progress",
      size: 0,
      compressedSize: 0,
      duration: 0,
      collections: collectionsToBackup,
      documentCounts: {},
      storageLocations: [],
      checksum: "",
      encryptionEnabled: config.encryption,
      compression: config.compression,
      triggeredBy,
      scheduleId,
    } as BackupMetadataDoc);

    try {
      // Export all collections
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
        backupId,
        type: config.type,
        collections: collectionsToBackup,
        documentCounts,
        data: backupData,
      }, null, 2);

      let backupBuffer = Buffer.from(backupJson, "utf-8");
      const originalSize = backupBuffer.length;

      // Apply compression if configured
      if (config.compression === "gzip") {
        const zlib = await import("zlib");
        backupBuffer = zlib.gzipSync(backupBuffer);
      }

      // Apply encryption if configured
      if (config.encryption && config.encryptionKey) {
        backupBuffer = this.encrypt(backupBuffer, config.encryptionKey);
      }

      const compressedSize = backupBuffer.length;
      const checksum = crypto.createHash("sha256").update(backupBuffer).digest("hex");

      // Upload to storage providers
      const storageLocations: StorageLocation[] = [];
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${backupId}_${timestamp}.${config.compression === "gzip" ? "json.gz" : "json"}`;

      for (const providerName of config.storageProviders) {
        const provider = this.storageProviders.get(providerName);
        if (provider) {
          try {
            const path = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${fileName}`;
            const url = await provider.upload(backupBuffer, path);
            storageLocations.push({
              provider: providerName,
              path,
              url,
            });
          } catch (error) {
            console.error(`Failed to upload to ${providerName}:`, error);
          }
        }
      }

      const duration = Date.now() - startTime;

      // Update metadata with results
      const result: BackupResult = {
        id: backupId,
        timestamp: new Date(),
        type: config.type,
        size: originalSize,
        compressedSize,
        duration,
        collections: collectionsToBackup,
        documentCounts,
        storageLocations,
        checksum,
        status: storageLocations.length > 0 ? "success" : "failed",
        error: storageLocations.length === 0 ? "No storage providers available" : undefined,
      };

      await setDoc(metadataRef, {
        id: backupId,
        createdAt: Timestamp.now(),
        completedAt: Timestamp.now(),
        type: config.type,
        status: result.status,
        size: originalSize,
        compressedSize,
        duration,
        collections: collectionsToBackup,
        documentCounts,
        storageLocations,
        checksum,
        encryptionEnabled: config.encryption,
        compression: config.compression,
        triggeredBy,
        scheduleId,
      } as BackupMetadataDoc);

      return result;
    } catch (error: any) {
      // Update metadata with error
      await setDoc(metadataRef, {
        id: backupId,
        createdAt: Timestamp.now(),
        completedAt: Timestamp.now(),
        type: config.type,
        status: "failed",
        size: 0,
        compressedSize: 0,
        duration: Date.now() - startTime,
        collections: collectionsToBackup,
        documentCounts: {},
        storageLocations: [],
        checksum: "",
        encryptionEnabled: config.encryption,
        compression: config.compression,
        triggeredBy,
        scheduleId,
        error: error.message,
      } as BackupMetadataDoc);

      throw error;
    }
  }

  // Restore from backup
  async restoreBackup(
    backupId: string,
    options: RestoreOptions,
    providerName: string,
    encryptionKey?: string
  ): Promise<RestoreResult> {
    if (!db) {
      throw new Error("Database not initialized");
    }

    const startTime = Date.now();
    const errors: string[] = [];

    // Get backup metadata
    const metadataRef = doc(db, "backupMetadata", backupId);
    const metadataSnap = await getDocs(
      query(collection(db, "backupMetadata"), where("id", "==", backupId), limit(1))
    );

    if (metadataSnap.empty) {
      throw new Error("Backup not found");
    }

    const metadata = metadataSnap.docs[0].data() as BackupMetadataDoc;
    const storageLocation = metadata.storageLocations.find(
      (loc) => loc.provider === providerName
    );

    if (!storageLocation) {
      throw new Error(`Backup not found in storage provider: ${providerName}`);
    }

    // Download backup
    const provider = this.storageProviders.get(providerName);
    if (!provider) {
      throw new Error(`Storage provider not found: ${providerName}`);
    }

    let backupBuffer = await provider.download(storageLocation.path);

    // Decrypt if needed
    if (metadata.encryptionEnabled && encryptionKey) {
      backupBuffer = this.decrypt(backupBuffer, encryptionKey);
    }

    // Decompress if needed
    if (metadata.compression === "gzip") {
      const zlib = await import("zlib");
      backupBuffer = zlib.gunzipSync(backupBuffer);
    }

    // Parse backup data
    const backupData = JSON.parse(backupBuffer.toString("utf-8"));
    const collectionsToRestore = options.collections || Object.keys(backupData.data);
    const restoredCounts: Record<string, number> = {};

    if (options.dryRun) {
      return {
        success: true,
        restoredCollections: collectionsToRestore,
        documentCounts: backupData.documentCounts,
        duration: Date.now() - startTime,
      };
    }

    // Restore each collection
    for (const collectionName of collectionsToRestore) {
      const documents = backupData.data[collectionName];
      if (!documents || !Array.isArray(documents)) {
        continue;
      }

      try {
        const batch = writeBatch(db);
        let count = 0;

        for (const docData of documents) {
          const { id, ...data } = docData;
          const docRef = doc(db, collectionName, id);
          
          if (options.overwrite) {
            batch.set(docRef, data);
          } else {
            // Only set if doesn't exist (merge)
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

    return {
      success: errors.length === 0,
      restoredCollections: Object.keys(restoredCounts),
      documentCounts: restoredCounts,
      duration: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // List backups
  async listBackups(filters?: BackupFilters): Promise<BackupMetadataDoc[]> {
    if (!db) {
      throw new Error("Database not initialized");
    }

    let q = query(
      collection(db, "backupMetadata"),
      orderBy("createdAt", "desc")
    );

    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    let backups = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BackupMetadataDoc[];

    // Apply filters
    if (filters?.type) {
      backups = backups.filter((b) => b.type === filters.type);
    }
    if (filters?.status) {
      backups = backups.filter((b) => b.status === filters.status);
    }

    return backups;
  }

  // Delete backup
  async deleteBackup(backupId: string): Promise<void> {
    if (!db) {
      throw new Error("Database not initialized");
    }

    // Get backup metadata
    const metadataSnap = await getDocs(
      query(collection(db, "backupMetadata"), where("id", "==", backupId), limit(1))
    );

    if (metadataSnap.empty) {
      throw new Error("Backup not found");
    }

    const metadata = metadataSnap.docs[0].data() as BackupMetadataDoc;

    // Delete from all storage providers
    for (const location of metadata.storageLocations) {
      const provider = this.storageProviders.get(location.provider);
      if (provider) {
        try {
          await provider.delete(location.path);
        } catch (error) {
          console.warn(`Failed to delete from ${location.provider}:`, error);
        }
      }
    }

    // Delete metadata
    await deleteDoc(doc(db, "backupMetadata", metadataSnap.docs[0].id));
  }

  // Verify backup integrity
  async verifyBackup(
    backupId: string,
    providerName: string,
    encryptionKey?: string
  ): Promise<VerificationResult> {
    if (!db) {
      throw new Error("Database not initialized");
    }

    // Get backup metadata
    const metadataSnap = await getDocs(
      query(collection(db, "backupMetadata"), where("id", "==", backupId), limit(1))
    );

    if (metadataSnap.empty) {
      throw new Error("Backup not found");
    }

    const metadata = metadataSnap.docs[0].data() as BackupMetadataDoc;
    const storageLocation = metadata.storageLocations.find(
      (loc) => loc.provider === providerName
    );

    if (!storageLocation) {
      throw new Error(`Backup not found in storage provider: ${providerName}`);
    }

    const provider = this.storageProviders.get(providerName);
    if (!provider) {
      throw new Error(`Storage provider not found: ${providerName}`);
    }

    // Download and verify
    const backupBuffer = await provider.download(storageLocation.path);
    const actualChecksum = crypto.createHash("sha256").update(backupBuffer).digest("hex");
    const actualSize = backupBuffer.length;

    return {
      valid: actualChecksum === metadata.checksum && actualSize === metadata.compressedSize,
      checksum: actualChecksum,
      expectedChecksum: metadata.checksum,
      size: actualSize,
      expectedSize: metadata.compressedSize,
      errors: actualChecksum !== metadata.checksum ? ["Checksum mismatch"] : undefined,
    };
  }

  // Encryption helper
  private encrypt(data: Buffer, key: string): Buffer {
    const iv = crypto.randomBytes(16);
    const keyHash = crypto.createHash("sha256").update(key).digest();
    const cipher = crypto.createCipheriv("aes-256-cbc", keyHash, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return Buffer.concat([iv, encrypted]);
  }

  // Decryption helper
  private decrypt(data: Buffer, key: string): Buffer {
    const iv = data.subarray(0, 16);
    const encrypted = data.subarray(16);
    const keyHash = crypto.createHash("sha256").update(key).digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", keyHash, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}

// Singleton instance
export const backupService = new BackupService();
