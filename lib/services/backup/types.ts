import { Timestamp } from "firebase/firestore";

// Backup Types
export type BackupType = "full" | "incremental" | "collections";
export type BackupStatus = "pending" | "in_progress" | "success" | "failed" | "partial";
export type CompressionType = "gzip" | "zip" | "none";
export type StorageProviderType = "local" | "s3" | "gcs" | "azure" | "firebase";

// Backup Configuration
export interface BackupConfig {
  type: BackupType;
  collections?: string[];
  compression: CompressionType;
  encryption: boolean;
  encryptionKey?: string;
  storageProviders: string[];
}

// Backup Result
export interface BackupResult {
  id: string;
  timestamp: Date;
  type: BackupType;
  size: number;
  compressedSize: number;
  duration: number;
  collections: string[];
  documentCounts: Record<string, number>;
  storageLocations: StorageLocation[];
  checksum: string;
  status: BackupStatus;
  error?: string;
}

// Storage Location
export interface StorageLocation {
  provider: string;
  path: string;
  url?: string;
}

// Restore Options
export interface RestoreOptions {
  collections?: string[];
  overwrite: boolean;
  dryRun?: boolean;
}

// Restore Result
export interface RestoreResult {
  success: boolean;
  restoredCollections: string[];
  documentCounts: Record<string, number>;
  duration: number;
  errors?: string[];
}

// Retention Policy
export interface RetentionPolicy {
  keepLast: number;
  keepDailyFor: number;
  keepWeeklyFor: number;
  keepMonthlyFor: number;
}

// Notification Config
export interface NotificationConfig {
  onSuccess: boolean;
  onFailure: boolean;
  emails: string[];
}

// Backup Schedule
export interface BackupSchedule {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  backupConfig: BackupConfig;
  retentionPolicy: RetentionPolicy;
  notifications: NotificationConfig;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Backup Metadata (Firestore Document)
export interface BackupMetadataDoc {
  id: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  type: BackupType;
  status: BackupStatus;
  size: number;
  compressedSize: number;
  duration: number;
  collections: string[];
  documentCounts: Record<string, number>;
  storageLocations: StorageLocation[];
  checksum: string;
  encryptionEnabled: boolean;
  compression: CompressionType;
  triggeredBy: "manual" | "scheduled";
  scheduleId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Backup Schedule Document (Firestore)
export interface BackupScheduleDoc {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  backupType: BackupType;
  collections?: string[];
  storageProviders: string[];
  compression: CompressionType;
  encryption: boolean;
  retentionPolicy: RetentionPolicy;
  notifications: NotificationConfig;
  lastRunAt?: Timestamp;
  nextRunAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// Storage Provider Configuration
export interface StorageProviderConfig {
  id: string;
  name: string;
  type: StorageProviderType;
  enabled: boolean;
  isDefault: boolean;
  config: {
    // S3 / S3-compatible
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    endpoint?: string;
    
    // GCS
    projectId?: string;
    keyFile?: string;
    
    // Azure
    connectionString?: string;
    containerName?: string;
    
    // Local
    basePath?: string;
    
    // Firebase
    storageBucket?: string;
  };
  pathPrefix: string;
  createdAt: Date;
  updatedAt: Date;
}

// Storage Provider Interface
export interface StorageProvider {
  name: string;
  type: StorageProviderType;
  upload(data: Buffer, path: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  list(prefix?: string): Promise<StorageObject[]>;
  exists(path: string): Promise<boolean>;
  getSignedUrl?(path: string, expiresIn: number): Promise<string>;
}

// Storage Object
export interface StorageObject {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
}

// Backup Filters
export interface BackupFilters {
  type?: BackupType;
  status?: BackupStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Verification Result
export interface VerificationResult {
  valid: boolean;
  checksum: string;
  expectedChecksum: string;
  size: number;
  expectedSize: number;
  errors?: string[];
}
