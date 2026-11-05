"use client";

import { useRef, useState } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureFileRef } from "@/lib/schema";
import { Upload, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Props {
  opportunityId: string;
  files: CaptureFileRef[];
  fileTags: string[];
  onFileAdded: (file: CaptureFileRef) => void;
  readOnly?: boolean;
}

/** Upload to Storage `capture/{oppId}/...`, then register metadata via API (rule: tag enforced server-side). */
export function FilesPanel({ opportunityId, files, fileTags, onFileAdded, readOnly }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tag, setTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const effectiveTag = tag || fileTags[0] || "other";

  const handleUpload = async (file: File) => {
    if (!storage) {
      toast.error("Storage is not configured");
      return;
    }
    setUploading(true);
    try {
      const path = `capture/${opportunityId}/${Date.now()}-${file.name}`;
      const snap = await uploadBytes(storageRef(storage, path), file);
      const url = await getDownloadURL(snap.ref);
      const { file: meta } = await captureJson<{ file: CaptureFileRef }>(
        `/api/capture/opportunities/${opportunityId}/files`,
        {
          method: "POST",
          body: JSON.stringify({ name: file.name, storagePath: path, url, size: file.size, tag: effectiveTag }),
        }
      );
      onFileAdded(meta);
      toast.success("File uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={effectiveTag} onValueChange={setTag}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fileTags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </div>
      )}

      <div className="space-y-2">
        {files.length === 0 && <p className="text-sm text-muted-foreground">No files yet.</p>}
        {files.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {f.tag} · {f.uploadedBy}
                  {f.size ? ` · ${(f.size / 1024).toFixed(0)} KB` : ""}
                </p>
              </div>
            </div>
            {f.url && (
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" aria-label={`Open ${f.name}`}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
