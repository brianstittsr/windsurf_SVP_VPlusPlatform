"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { listCourses, listScormPackages } from "@/lib/lms";
import type { CourseDoc, ScormPackageDoc } from "@/lib/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Package, Upload, Loader2 } from "lucide-react";

export default function AdminScormPage() {
  const { isLoading, isAuthenticated } = useRequireAuth(["admin"]);
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [packages, setPackages] = useState<ScormPackageDoc[]>([]);
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const [c, p] = await Promise.all([listCourses(false), listScormPackages()]);
    setCourses(c);
    setPackages(p);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  const upload = async () => {
    if (!file || !courseId || !auth?.currentUser) return;
    setUploading(true);
    setError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courseId", courseId);
      const res = await fetch("/api/scorm/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      toast.success(
        `SCORM ${data.version} package uploaded (${data.files} files)`
      );
      setFile(null);
      setCourseId("");
      load();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || !isAuthenticated || loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const courseName = (id: string) =>
    courses.find((c) => c.id === id)?.code || id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">SCORM Packages</h1>
        <p className="text-muted-foreground">
          Upload and manage SCORM 1.2 / 2004 course packages
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Upload Package</CardTitle>
          <CardDescription>
            Zip file containing imsmanifest.xml and course content. The package
            is extracted to secure storage and linked to the selected course.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses
                    .filter((c) => c.format === "scorm")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SCORM Zip</Label>
              <Input
                type="file"
                accept=".zip"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <Button
            onClick={upload}
            disabled={!file || !courseId || uploading}
            className="bg-[#8A6212] hover:bg-[#8A6212]"
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? "Uploading…" : "Upload & Link"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Uploaded Packages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-10"
                  >
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No SCORM packages uploaded yet.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.fileName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">SCORM {p.version}</Badge>
                    </TableCell>
                    <TableCell>{courseName(p.courseId)}</TableCell>
                    <TableCell>{p.itemCount}</TableCell>
                    <TableCell className="text-sm">
                      {p.createdAt?.toDate?.().toLocaleDateString?.() || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
