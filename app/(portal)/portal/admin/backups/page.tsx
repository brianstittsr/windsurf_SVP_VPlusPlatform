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
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

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

  // Restore options
  const [restoreOverwrite, setRestoreOverwrite] = useState(false);
  const [restoreDryRun, setRestoreDryRun] = useState(true);

  useEffect(() => {
    fetchBackups();
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
        setShowCreateDialog(false);
        fetchBackups();
      } else {
        alert(data.error || "Failed to create backup");
      }
    } catch (error) {
      console.error("Failed to create backup:", error);
      alert("Failed to create backup");
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
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowRestoreDialog(false);
        if (!restoreDryRun) {
          fetchBackups();
        }
      } else {
        alert(data.error || "Failed to restore backup");
      }
    } catch (error) {
      console.error("Failed to restore backup:", error);
      alert("Failed to restore backup");
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
        setShowDeleteDialog(false);
        setBackupToDelete(null);
        fetchBackups();
      } else {
        alert(data.error || "Failed to delete backup");
      }
    } catch (error) {
      console.error("Failed to delete backup:", error);
      alert("Failed to delete backup");
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
          <Card>
            <CardHeader>
              <CardTitle>Storage Providers</CardTitle>
              <CardDescription>Configure where backups are stored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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

                <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Cloud className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Google Cloud Storage</p>
                      <p className="text-sm text-muted-foreground">Coming soon</p>
                    </div>
                  </div>
                  <Badge variant="outline">Not Configured</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
}
