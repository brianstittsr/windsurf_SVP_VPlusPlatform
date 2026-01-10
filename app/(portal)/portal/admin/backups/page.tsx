"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HardDrive,
  Cloud,
  Settings,
  Play,
  Calendar,
  Loader2,
  FileArchive,
  Shield,
  RotateCcw,
  ExternalLink,
  Link2,
  Unlink,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface BackupMetadata {
  id: string;
  createdAt: string;
  completedAt?: string;
  type: "full" | "incremental" | "collections";
  status: "pending" | "in_progress" | "success" | "failed" | "partial";
  size: number;
  compressedSize: number;
  duration: number;
  collections: string[];
  documentCounts: Record<string, number>;
  storageLocations: { provider: string; path: string; url?: string }[];
  encryptionEnabled: boolean;
  compression: string;
  triggeredBy: "manual" | "scheduled";
  error?: string;
}

interface BackupStats {
  total: number;
  totalSize: number;
  successCount: number;
  failedCount: number;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  createdTime: string;
  size: string;
  webViewLink: string;
}

interface GoogleDriveStatus {
  connected: boolean;
  connectedEmail?: string;
  connectedAt?: string;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);

  // Create backup form state
  const [backupType, setBackupType] = useState<"full" | "collections">("full");
  const [compression, setCompression] = useState<"gzip" | "none">("gzip");
  const [encryption, setEncryption] = useState(false);
  const [uploadToGoogleDrive, setUploadToGoogleDrive] = useState(false);

  // Restore options
  const [restoreOverwrite, setRestoreOverwrite] = useState(false);
  const [restoreDryRun, setRestoreDryRun] = useState(true);
  const [restoreSource, setRestoreSource] = useState<"firebase" | "google_drive">("firebase");

  // Google Drive state
  const [googleDriveStatus, setGoogleDriveStatus] = useState<GoogleDriveStatus>({ connected: false });
  const [googleDriveFiles, setGoogleDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [loadingGoogleDrive, setLoadingGoogleDrive] = useState(false);
  const [connectingGoogleDrive, setConnectingGoogleDrive] = useState(false);
  const [uploadingToGoogleDrive, setUploadingToGoogleDrive] = useState(false);

  // Restore from Google Drive
  const [showGoogleDriveRestoreDialog, setShowGoogleDriveRestoreDialog] = useState(false);
  const [selectedGoogleDriveFile, setSelectedGoogleDriveFile] = useState<GoogleDriveFile | null>(null);
  const [restoringFromGoogleDrive, setRestoringFromGoogleDrive] = useState(false);

  useEffect(() => {
    fetchBackups();
    fetchGoogleDriveStatus();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/backups");
      const data = await response.json();
      setBackups(data.backups || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Failed to fetch backups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Google Drive functions
  const fetchGoogleDriveStatus = async () => {
    try {
      const response = await fetch("/api/admin/backups/google-drive?action=status");
      const data = await response.json();
      setGoogleDriveStatus(data);
    } catch (error) {
      console.error("Failed to fetch Google Drive status:", error);
    }
  };

  const fetchGoogleDriveFiles = async () => {
    setLoadingGoogleDrive(true);
    try {
      const response = await fetch("/api/admin/backups/google-drive?action=list");
      const data = await response.json();
      if (data.files) {
        setGoogleDriveFiles(data.files);
      }
    } catch (error) {
      console.error("Failed to fetch Google Drive files:", error);
      toast.error("Failed to load Google Drive backups");
    } finally {
      setLoadingGoogleDrive(false);
    }
  };

  const connectGoogleDrive = async () => {
    setConnectingGoogleDrive(true);
    try {
      const response = await fetch("/api/admin/backups/google-drive?action=auth-url");
      const data = await response.json();
      if (data.authUrl) {
        // Open OAuth popup
        const popup = window.open(data.authUrl, "google-auth", "width=500,height=600");
        
        // Listen for OAuth callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === "google-oauth-callback" && event.data?.code) {
            window.removeEventListener("message", handleMessage);
            popup?.close();
            
            // Exchange code for tokens
            const connectResponse = await fetch("/api/admin/backups/google-drive", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "connect", code: event.data.code }),
            });
            
            const connectData = await connectResponse.json();
            if (connectData.success) {
              toast.success(`Connected to Google Drive as ${connectData.connectedEmail}`);
              fetchGoogleDriveStatus();
              fetchGoogleDriveFiles();
            } else {
              toast.error(connectData.error || "Failed to connect Google Drive");
            }
          }
        };
        
        window.addEventListener("message", handleMessage);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Failed to connect Google Drive:", error);
      toast.error("Failed to connect Google Drive");
    } finally {
      setConnectingGoogleDrive(false);
    }
  };

  const disconnectGoogleDrive = async () => {
    try {
      const response = await fetch("/api/admin/backups/google-drive?action=disconnect", {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Google Drive disconnected");
        setGoogleDriveStatus({ connected: false });
        setGoogleDriveFiles([]);
      }
    } catch (error) {
      console.error("Failed to disconnect Google Drive:", error);
      toast.error("Failed to disconnect Google Drive");
    }
  };

  const uploadBackupToGoogleDrive = async (backupId: string) => {
    setUploadingToGoogleDrive(true);
    try {
      // Get backup data
      const backupResponse = await fetch(`/api/admin/backups?id=${backupId}`);
      const backupData = await backupResponse.json();
      
      if (!backupData.backup?.backupData) {
        toast.error("Backup data not available");
        return;
      }

      const response = await fetch("/api/admin/backups/google-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          backupId,
          backupData: backupData.backup.backupData,
          fileName: `svp_backup_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Backup uploaded to Google Drive");
        fetchBackups();
        fetchGoogleDriveFiles();
      } else {
        toast.error(data.error || "Failed to upload backup");
      }
    } catch (error) {
      console.error("Failed to upload to Google Drive:", error);
      toast.error("Failed to upload backup to Google Drive");
    } finally {
      setUploadingToGoogleDrive(false);
    }
  };

  const restoreFromGoogleDrive = async () => {
    if (!selectedGoogleDriveFile) return;

    setRestoringFromGoogleDrive(true);
    try {
      // Download backup from Google Drive
      const downloadResponse = await fetch("/api/admin/backups/google-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          fileId: selectedGoogleDriveFile.id,
        }),
      });

      const downloadData = await downloadResponse.json();
      if (!downloadData.success) {
        toast.error(downloadData.error || "Failed to download backup");
        return;
      }

      // Parse and restore
      const backupContent = JSON.parse(downloadData.content);
      
      // For now, show what would be restored
      toast.success(`Backup contains ${Object.keys(backupContent.data || {}).length} collections ready to restore`);
      setShowGoogleDriveRestoreDialog(false);
      
    } catch (error) {
      console.error("Failed to restore from Google Drive:", error);
      toast.error("Failed to restore from Google Drive");
    } finally {
      setRestoringFromGoogleDrive(false);
    }
  };

  const deleteGoogleDriveFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/admin/backups/google-drive?action=delete-file&fileId=${fileId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Backup deleted from Google Drive");
        fetchGoogleDriveFiles();
      } else {
        toast.error(data.error || "Failed to delete backup");
      }
    } catch (error) {
      console.error("Failed to delete from Google Drive:", error);
      toast.error("Failed to delete backup from Google Drive");
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: backupType,
          compression,
          encryption,
          storageProviders: ["firebase"],
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Backup created successfully");
        setShowCreateDialog(false);
        fetchBackups();

        // Upload to Google Drive if enabled
        if (uploadToGoogleDrive && googleDriveStatus.connected && data.backup?.id) {
          await uploadBackupToGoogleDrive(data.backup.id);
        }
      } else {
        toast.error(data.error || "Failed to create backup");
      }
    } catch (error) {
      console.error("Failed to create backup:", error);
      toast.error("Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup) return;

    setRestoring(true);
    try {
      const response = await fetch(`/api/admin/backups/${selectedBackup.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overwrite: restoreOverwrite,
          dryRun: restoreDryRun,
          source: restoreSource,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setShowRestoreDialog(false);
        if (!restoreDryRun) {
          fetchBackups();
        }
      } else {
        toast.error(data.error || "Failed to restore backup");
      }
    } catch (error) {
      console.error("Failed to restore backup:", error);
      toast.error("Failed to restore backup");
    } finally {
      setRestoring(false);
    }
  };

  const deleteBackup = async () => {
    if (!backupToDelete) return;

    try {
      const response = await fetch(`/api/admin/backups?id=${backupToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Backup deleted");
        setShowDeleteDialog(false);
        setBackupToDelete(null);
        fetchBackups();
      } else {
        toast.error(data.error || "Failed to delete backup");
      }
    } catch (error) {
      console.error("Failed to delete backup:", error);
      toast.error("Failed to delete backup");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-700"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  const getTotalDocuments = (counts: Record<string, number>): number => {
    return Object.values(counts || {}).reduce((a, b) => a + b, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Backup & Restore
          </h1>
          <p className="text-muted-foreground">
            Manage database backups and restore points
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBackups} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileArchive className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold">{stats?.successCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{stats?.failedCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <HardDrive className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{formatBytes(stats?.totalSize || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="backups">
        <TabsList>
          <TabsTrigger value="backups">Backup History</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>View and manage your database backups</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Backups Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first backup to protect your data
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Create First Backup
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Triggered By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {backup.createdAt ? format(new Date(backup.createdAt), "MMM d, yyyy") : "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {backup.createdAt ? format(new Date(backup.createdAt), "h:mm a") : ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {backup.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(backup.status)}</TableCell>
                        <TableCell>{getTotalDocuments(backup.documentCounts)}</TableCell>
                        <TableCell>{formatBytes(backup.compressedSize || backup.size)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {backup.triggeredBy === "scheduled" ? (
                              <><Clock className="h-3 w-3 mr-1" />Scheduled</>
                            ) : (
                              <><Play className="h-3 w-3 mr-1" />Manual</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreDialog(true);
                              }}
                              disabled={backup.status !== "success"}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBackupToDelete(backup.id);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Schedules</CardTitle>
              <CardDescription>Configure automated backup schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Scheduled Backups Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  Automated backup scheduling will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Storage Providers</CardTitle>
                <CardDescription>Configure where backups are stored</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Firebase Storage */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Cloud className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">Firebase Storage</p>
                        <p className="text-sm text-muted-foreground">Default storage provider</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>

                  {/* Google Drive */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <HardDrive className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Google Drive</p>
                        {googleDriveStatus.connected ? (
                          <p className="text-sm text-muted-foreground">
                            Connected as {googleDriveStatus.connectedEmail}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Store backups in your Google Drive
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {googleDriveStatus.connected ? (
                        <>
                          <Badge className="bg-green-100 text-green-700">Connected</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={disconnectGoogleDrive}
                          >
                            <Unlink className="h-4 w-4 mr-1" />
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={connectGoogleDrive}
                          disabled={connectingGoogleDrive}
                        >
                          {connectingGoogleDrive ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4 mr-2" />
                          )}
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* AWS S3 - Coming Soon */}
                  <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Cloud className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">AWS S3</p>
                        <p className="text-sm text-muted-foreground">Coming soon</p>
                      </div>
                    </div>
                    <Badge variant="outline">Not Configured</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Drive Backups */}
            {googleDriveStatus.connected && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Google Drive Backups</CardTitle>
                      <CardDescription>Backups stored in your Google Drive</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchGoogleDriveFiles}
                      disabled={loadingGoogleDrive}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingGoogleDrive ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingGoogleDrive ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : googleDriveFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <HardDrive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">No Backups in Google Drive</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create a backup and upload it to Google Drive
                      </p>
                      <Button variant="outline" onClick={fetchGoogleDriveFiles}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Again
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File Name</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {googleDriveFiles.map((file) => (
                          <TableRow key={file.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileArchive className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{file.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(file.createdTime), "MMM d, yyyy h:mm a")}
                            </TableCell>
                            <TableCell>{formatBytes(parseInt(file.size))}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {file.webViewLink && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGoogleDriveFile(file);
                                    setShowGoogleDriveRestoreDialog(true);
                                  }}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteGoogleDriveFile(file.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Backup Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
            <DialogDescription>
              Create a new backup of your database
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Backup Type</Label>
              <Select value={backupType} onValueChange={(v: "full" | "collections") => setBackupType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="collections">Selected Collections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compression</Label>
              <Select value={compression} onValueChange={(v: "gzip" | "none") => setCompression(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gzip">GZIP (Recommended)</SelectItem>
                  <SelectItem value="none">No Compression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Encryption</Label>
                <p className="text-sm text-muted-foreground">Encrypt backup data</p>
              </div>
              <Switch checked={encryption} onCheckedChange={setEncryption} />
            </div>

            {googleDriveStatus.connected && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Upload to Google Drive</Label>
                  <p className="text-sm text-muted-foreground">Also save backup to Google Drive</p>
                </div>
                <Switch checked={uploadToGoogleDrive} onCheckedChange={setUploadToGoogleDrive} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createBackup} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Backup</DialogTitle>
            <DialogDescription>
              Restore your database from this backup
            </DialogDescription>
          </DialogHeader>

          {selectedBackup && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Backup Date</span>
                  <span className="text-sm font-medium">
                    {selectedBackup.createdAt ? format(new Date(selectedBackup.createdAt), "PPpp") : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Documents</span>
                  <span className="text-sm font-medium">{getTotalDocuments(selectedBackup.documentCounts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Collections</span>
                  <span className="text-sm font-medium">{selectedBackup.collections?.length || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dry Run</Label>
                  <p className="text-sm text-muted-foreground">Preview without making changes</p>
                </div>
                <Switch checked={restoreDryRun} onCheckedChange={setRestoreDryRun} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overwrite Existing</Label>
                  <p className="text-sm text-muted-foreground">Replace existing documents</p>
                </div>
                <Switch checked={restoreOverwrite} onCheckedChange={setRestoreOverwrite} />
              </div>

              {!restoreDryRun && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Warning</p>
                      <p className="text-sm text-yellow-700">
                        This will modify your database. Make sure you have a recent backup before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={restoreBackup} disabled={restoring}>
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {restoreDryRun ? "Running Preview..." : "Restoring..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {restoreDryRun ? "Preview Restore" : "Restore Backup"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackupToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBackup} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Google Drive Restore Dialog */}
      <Dialog open={showGoogleDriveRestoreDialog} onOpenChange={setShowGoogleDriveRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from Google Drive</DialogTitle>
            <DialogDescription>
              Restore your database from this Google Drive backup
            </DialogDescription>
          </DialogHeader>

          {selectedGoogleDriveFile && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">File Name</span>
                  <span className="text-sm font-medium">{selectedGoogleDriveFile.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium">
                    {format(new Date(selectedGoogleDriveFile.createdTime), "PPpp")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Size</span>
                  <span className="text-sm font-medium">
                    {formatBytes(parseInt(selectedGoogleDriveFile.size))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dry Run</Label>
                  <p className="text-sm text-muted-foreground">Preview without making changes</p>
                </div>
                <Switch checked={restoreDryRun} onCheckedChange={setRestoreDryRun} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overwrite Existing</Label>
                  <p className="text-sm text-muted-foreground">Replace existing documents</p>
                </div>
                <Switch checked={restoreOverwrite} onCheckedChange={setRestoreOverwrite} />
              </div>

              {!restoreDryRun && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Warning</p>
                      <p className="text-sm text-yellow-700">
                        This will modify your database. Make sure you have a recent backup before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoogleDriveRestoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={restoreFromGoogleDrive} disabled={restoringFromGoogleDrive}>
              {restoringFromGoogleDrive ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {restoreDryRun ? "Analyzing..." : "Restoring..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {restoreDryRun ? "Preview Restore" : "Restore Backup"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
