"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import {
  listCourses,
  saveCourse,
  deleteCourse,
} from "@/lib/lms";
import { logAudit } from "@/lib/activity-logger";
import { CourseContentDialog } from "@/components/lms/course-content-dialog";
import type { CourseDoc } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ListOrdered } from "lucide-react";

export default function AdminCoursesPage() {
  const { isLoading, isAuthenticated, profile } = useRequireAuth(["admin"]);
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<CourseDoc> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moduleCourse, setModuleCourse] = useState<CourseDoc | null>(null);
  const [importing, setImporting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const load = async () => {
    setCourses(await listCourses(false));
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      const data = await listCourses(false);
      if (!cancelled) {
        setCourses(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const openEdit = (course?: CourseDoc) => {
    setEditing(
      course || {
        code: "",
        title: "",
        shortDescription: "",
        description: "",
        category: "",
        estimatedHours: undefined,
        learningOutcomes: [],
        prerequisiteCourseIds: [],
        prerequisiteDescription: "",
        includedCourseIds: [],
        bundleContents: [],
        format: "native",
        purchaseMode: "checkout",
        priceCents: 0,
        currency: "usd",
        imageUrl: "",
        published: false,
        archived: false,
        displayOrder: courses.length + 1,
        passingScore: 80,
        maxAttempts: 3,
        badge: { title: "", description: "", skills: [], issueOnCompletion: true },
      }
    );
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing?.title?.trim() || !editing?.code?.trim()) {
      toast.error("Title and course code are required");
      return;
    }
    if (!Number.isInteger(editing.priceCents) || (editing.priceCents ?? -1) < 0) {
      toast.error("Enter a valid non-negative retail price");
      return;
    }
    if (editing.published && (editing.priceCents ?? 0) <= 0 && editing.purchaseMode === "registration") {
      toast.error("Registration-mode programs still need an approved retail price — set a price or switch to checkout/free enrollment");
      return;
    }
    if (courses.some((c) => c.code.toLowerCase() === editing.code?.trim().toLowerCase() && c.id !== editing.id && c.archived !== true)) {
      toast.error("An active course already uses that code");
      return;
    }
    const id = await saveCourse(
      editing as Parameters<typeof saveCourse>[0],
      editing.id
    );
    await logAudit({
      actorId: profile.id,
      actorEmail: profile.email,
      action: editing.id ? "course.updated" : "course.created",
      entityType: "course",
      entityId: id || "",
      metadata: { code: editing.code },
    });
    toast.success("Course saved");
    setDialogOpen(false);
    setEditing(null);
    load();
  };

  const importRegistrationDrafts = async () => {
    if (!auth?.currentUser) {
      toast.error("Sign in again to import catalog drafts");
      return;
    }
    setImporting(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/admin/courses/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Catalog import failed");
      const { createdCount, convertedDemo, conflictCount, conflicts } = result.data;
      toast.success(`Imported ${createdCount} draft course${createdCount === 1 ? "" : "s"}`);
      if (convertedDemo?.length) toast.info("The existing AC1 sample course was reused as an unpublished catalog draft; its lessons and demo records remain intact.");
      if (conflictCount > 0) {
        toast.warning(
          `Skipped existing course codes: ${conflicts.map((item: { code: string }) => item.code).join(", ")}. Review them before publishing.`
        );
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Catalog import failed");
    } finally {
      setImporting(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (!auth?.currentUser) throw new Error("Sign in again to upload course images");
    setImageUploading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/course-images", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Image upload failed");
      setEditing((current) => ({
        ...current,
        imageUrl: result.data.imageUrl,
        imageStoragePath: result.data.storagePath,
      }));
      toast.success("Course image uploaded");
    } finally {
      setImageUploading(false);
    }
  };

  const remove = async (course: CourseDoc) => {
    await deleteCourse(course.id);
    await logAudit({
      actorId: profile.id,
      actorEmail: profile.email,
      action: "course.deleted",
      entityType: "course",
      entityId: course.id,
      metadata: { code: course.code },
    });
    toast.success("Course archived; purchase and completion history is preserved");
    load();
  };

  const openModules = (course: CourseDoc) => {
    setModuleCourse(course);
  };

  if (isLoading || !isAuthenticated || loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Courses</h1>
          <p className="text-muted-foreground">
            Manage the Academy course catalog
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={importing}
            onClick={importRegistrationDrafts}
          >
            {importing ? "Importing…" : "Import registration-form drafts"}
          </Button>
          <Button
            onClick={() => openEdit()}
            className="bg-[#8A6212] hover:bg-[#8A6212]"
          >
            <Plus className="mr-2 h-4 w-4" /> New Course
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Retail Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-10"
                  >
                    No courses yet. Create the AC1 course to get started.
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">
                      {c.code}
                    </TableCell>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>{c.category || "—"}</TableCell>
                    <TableCell>${(c.priceCents / 100).toFixed(2)}</TableCell>
                    <TableCell>{c.estimatedHours ? `${c.estimatedHours} hrs` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.archived ? "destructive" : c.published ? "default" : "outline"}>
                        {c.archived ? "Archived" : c.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModules(c)}
                        title="Lessons & assessments"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(c)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!c.archived && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(c)}
                          title="Archive"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Course editor dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edit Course" : "New Course"}
            </DialogTitle>
            <DialogDescription>
              Course details shown in the catalog
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={editing.code || ""}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s, code: e.target.value }))
                    }
                    placeholder="AC1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Retail price (USD)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={((editing.priceCents ?? 0) / 100).toFixed(2)}
                    onChange={(e) =>
                      setEditing((s) => ({
                        ...s,
                        priceCents: Math.round(parseFloat(e.target.value || "0") * 100),
                        currency: "usd",
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editing.title || ""}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={editing.description || ""}
                  onChange={(e) =>
                    setEditing((s) => ({
                      ...s,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Short description</Label>
                  <Input
                    value={editing.shortDescription || ""}
                    onChange={(e) => setEditing((s) => ({ ...s, shortDescription: e.target.value }))}
                    maxLength={180}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={editing.category || ""}
                    onChange={(e) => setEditing((s) => ({ ...s, category: e.target.value }))}
                    placeholder="Part 107, Geospatial, Public Safety"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Estimated hours</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editing.estimatedHours ?? ""}
                    onChange={(e) => setEditing((s) => ({ ...s, estimatedHours: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display order</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editing.displayOrder ?? 1}
                    onChange={(e) => setEditing((s) => ({ ...s, displayOrder: Number(e.target.value || 1) }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Learning outcomes (one per line)</Label>
                <Textarea
                  rows={3}
                  value={(editing.learningOutcomes || []).join("\n")}
                  onChange={(e) => setEditing((s) => ({ ...s, learningOutcomes: e.target.value.split(/\r?\n/).filter(Boolean) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Prerequisites</Label>
                <Textarea
                  rows={2}
                  value={editing.prerequisiteDescription || ""}
                  onChange={(e) => setEditing((s) => ({ ...s, prerequisiteDescription: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Included bundle contents (one per line)</Label>
                <Textarea
                  rows={3}
                  value={(editing.bundleContents || []).join("\n")}
                  onChange={(e) => setEditing((s) => ({ ...s, bundleContents: e.target.value.split(/\r?\n/).filter(Boolean) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Included LMS courses (bundle enrollment)</Label>
                <select
                  multiple
                  value={editing.includedCourseIds || []}
                  onChange={(e) => setEditing((s) => ({ ...s, includedCourseIds: Array.from(e.target.selectedOptions, (option) => option.value) }))}
                  className="min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm"
                >
                  {courses.filter((course) => course.id !== editing.id && !course.archived).map((course) => (
                    <option key={course.id} value={course.id}>{course.code} — {course.title}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">A purchased bundle can grant enrollment in these linked courses.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={editing.format || "native"}
                    onValueChange={(v) =>
                      setEditing((s) => ({
                        ...s,
                        format: v as "scorm" | "native",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scorm">SCORM</SelectItem>
                      <SelectItem value="native">Native</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Purchase mode</Label>
                  <Select
                    value={editing.purchaseMode || "checkout"}
                    onValueChange={(v) =>
                      setEditing((s) => ({
                        ...s,
                        purchaseMode: v as "checkout" | "registration",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkout">Instant checkout</SelectItem>
                      <SelectItem value="registration">Registration review</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {editing.purchaseMode === "registration"
                      ? "Students submit the signed registration form; staff approve before payment."
                      : (editing.priceCents ?? 0) > 0
                        ? "Students buy instantly through Stripe checkout."
                        : "Students enroll free — no payment step."}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pass %</Label>
                  <Input
                    type="number"
                    value={editing.passingScore ?? 80}
                    onChange={(e) =>
                      setEditing((s) => ({
                        ...s,
                        passingScore: parseInt(e.target.value || "80", 10),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Attempts</Label>
                  <Input
                    type="number"
                    value={editing.maxAttempts ?? 3}
                    onChange={(e) =>
                      setEditing((s) => ({
                        ...s,
                        maxAttempts: parseInt(e.target.value || "3", 10),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Course image</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={imageUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void uploadImage(file).catch((error) =>
                        toast.error(error instanceof Error ? error.message : "Image upload failed")
                      );
                    }
                  }}
                />
                {imageUploading && <p className="text-xs text-muted-foreground">Uploading image…</p>}
                <Input
                  aria-label="Course image URL"
                  value={editing.imageUrl || ""}
                  onChange={(e) => setEditing((s) => ({ ...s, imageUrl: e.target.value }))}
                  placeholder="Or use a public image URL"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded border p-3">
                  <Label className="font-normal">Published</Label>
                  <Switch
                    checked={editing.published === true && editing.archived !== true}
                    disabled={editing.archived === true}
                    onCheckedChange={(v) => setEditing((s) => ({ ...s, published: v }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded border p-3">
                  <Label className="font-normal">Archived</Label>
                  <Switch
                    checked={editing.archived === true}
                    onCheckedChange={(v) => setEditing((s) => s ? ({ ...s, archived: v, published: v ? false : s.published }) : s)}
                  />
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <p className="font-semibold text-sm">Completion badge</p>
                <div className="space-y-2">
                  <Label>Badge title</Label>
                  <Input
                    value={editing.badge?.title || ""}
                    onChange={(e) => setEditing((s) => s ? ({ ...s, badge: { title: e.target.value, description: s.badge?.description || "", skills: s.badge?.skills || [], issueOnCompletion: s.badge?.issueOnCompletion ?? true } }) : s)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Badge description</Label>
                  <Textarea
                    rows={2}
                    value={editing.badge?.description || ""}
                    onChange={(e) => setEditing((s) => s ? ({ ...s, badge: { title: s.badge?.title || "", description: e.target.value, skills: s.badge?.skills || [], issueOnCompletion: s.badge?.issueOnCompletion ?? true } }) : s)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Skills (comma-separated)</Label>
                  <Input
                    value={(editing.badge?.skills || []).join(", ")}
                    onChange={(e) => setEditing((s) => s ? ({ ...s, badge: { title: s.badge?.title || "", description: s.badge?.description || "", skills: e.target.value.split(",").map((v) => v.trim()).filter(Boolean), issueOnCompletion: s.badge?.issueOnCompletion ?? true } }) : s)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Issue after course completion</Label>
                  <Switch
                    checked={editing.badge?.issueOnCompletion === true}
                    onCheckedChange={(v) => setEditing((s) => s ? ({ ...s, badge: { title: s.badge?.title || "", description: s.badge?.description || "", skills: s.badge?.skills || [], issueOnCompletion: v } }) : s)}
                  />
                </div>
              </div>
              <Button
                onClick={save}
                className="w-full bg-[#8A6212] hover:bg-[#8A6212]"
              >
                Save Course
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lessons & assessments editor */}
      <CourseContentDialog course={moduleCourse} onClose={() => setModuleCourse(null)} />
    </div>
  );
}
