"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import type { RegistrationFieldPurpose, RegistrationFieldType, RegistrationFormDoc, RegistrationFormFieldDoc } from "@/lib/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, FilePlus2, Save, Trash2 } from "lucide-react";

const fieldPurposes: { value: RegistrationFieldPurpose; label: string }[] = [
  { value: "fullName", label: "Student full name" },
  { value: "company", label: "Company name" },
  { value: "birthMonthYear", label: "Birth month/year" },
  { value: "email", label: "Contact email" },
  { value: "phone", label: "Contact phone" },
  { value: "address", label: "Mailing address" },
  { value: "veteranStatus", label: "Veteran status" },
  { value: "courseSelection", label: "Course selection" },
  { value: "newsletterConsent", label: "Newsletter permission" },
  { value: "studentAcknowledgment", label: "Accuracy/enrollment acknowledgment" },
  { value: "programPolicies", label: "Program policies agreement" },
  { value: "signature", label: "Electronic signature" },
];

const fieldTypes: { value: RegistrationFieldType; label: string }[] = [
  { value: "section", label: "Section heading" },
  { value: "paragraph", label: "Description text" },
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "name", label: "Full name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "monthYear", label: "Month and year" },
  { value: "address", label: "Address" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Single choice" },
  { value: "checkboxes", label: "Multiple choice" },
  { value: "yesNoPreferNot", label: "Yes / No / Prefer not" },
  { value: "courseSelector", label: "Published course selector" },
  { value: "file", label: "Private file upload" },
  { value: "consent", label: "Consent checkbox" },
  { value: "signature", label: "Digital signature" },
];

interface FormListResponse { data?: RegistrationFormDoc[]; error?: string }
interface SaveResponse { data?: { id: string; version: number }; error?: string }

function newField(type: RegistrationFieldType = "text"): RegistrationFormFieldDoc {
  const id = `${type}-${Math.random().toString(36).slice(2, 8)}`;
  return { id, type, label: fieldTypes.find((field) => field.value === type)?.label || "New field", required: false };
}

export default function AdminFormsPage() {
  const { isLoading, isAuthenticated } = useRequireAuth(["admin"]);
  const [forms, setForms] = useState<RegistrationFormDoc[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<RegistrationFormFieldDoc[]>([]);
  const [version, setVersion] = useState(1);
  const [status, setStatus] = useState<RegistrationFormDoc["status"]>("draft");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!auth?.currentUser) throw new Error("Sign in again to manage forms");
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Form request failed");
    return result;
  }, []);

  const loadForms = useCallback(async () => {
    const result = (await request("/api/admin/forms")) as FormListResponse;
    const nextForms = result.data || [];
    setForms(nextForms);
    return nextForms;
  }, [request]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void request("/api/admin/forms")
      .then((result: FormListResponse) => { if (active) setForms(result.data || []); })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to load forms"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, request]);

  const selectForm = (form: RegistrationFormDoc) => {
    setSelectedId(form.id);
    setName(form.name);
    setSlug(form.slug);
    setDescription(form.description || "");
    setFields(form.fields);
    setVersion(form.version);
    setStatus(form.status);
  };

  const reset = () => {
    setSelectedId("");
    setName("");
    setSlug("");
    setDescription("");
    setFields([]);
    setVersion(1);
    setStatus("draft");
  };

  const seedStudentRegistration = async () => {
    setBusy(true);
    try {
      const result = await request("/api/admin/forms/seed", { method: "POST" });
      const refreshed = await loadForms();
      const loaded = refreshed.find((form) => form.id === result.data.id);
      if (loaded) selectForm(loaded);
      toast.success(result.data.created ? "Student registration form template added as a draft" : "Student registration form already exists");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create template");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const result = (await request("/api/admin/forms", {
        method: "POST",
        body: JSON.stringify({ id: selectedId || undefined, name, slug, description, fields }),
      })) as SaveResponse;
      setSelectedId(result.data?.id || selectedId);
      setVersion(result.data?.version || version);
      await loadForms();
      toast.success("Form draft saved. Published submissions continue using their original version until you publish this one.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save form");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await request(`/api/admin/forms/${selectedId}/publish`, { method: "POST" });
      setStatus("published");
      await loadForms();
      toast.success("Form published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to publish form");
    } finally {
      setBusy(false);
    }
  };

  const updateField = (index: number, patch: Partial<RegistrationFormFieldDoc>) =>
    setFields((current) => current.map((field, i) => i === index ? { ...field, ...patch } : field));

  const moveField = (index: number, direction: -1 | 1) => {
    setFields((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  if (isLoading || !isAuthenticated || loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Form Builder</h1>
          <p className="text-muted-foreground">Create versioned forms and publish them in the V+ Academy theme.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={seedStudentRegistration}>Student registration template</Button>
          <Button className="bg-[#8A6212] hover:bg-[#8A6212]" onClick={reset}><FilePlus2 className="mr-2 h-4 w-4" />New Form</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader><CardTitle className="font-display">Forms</CardTitle><CardDescription>Drafts and published versions</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {forms.map((form) => (
              <button key={form.id} type="button" onClick={() => selectForm(form)} className={`w-full rounded-md border p-3 text-left ${selectedId === form.id ? "border-[#8A6212] bg-[#F4EAD3]" : "hover:bg-muted/50"}`}>
                <span className="block font-medium">{form.name}</span>
                <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={form.status === "published" ? "default" : "outline"}>{form.status}</Badge>
                  {form.status === "published" && form.publishedVersion && form.version > form.publishedVersion ? `published v${form.publishedVersion} · draft v${form.version}` : `v${form.publishedVersion || form.version}`} · /register/{form.slug}
                </span>
              </button>
            ))}
            {forms.length === 0 && <p className="text-sm text-muted-foreground">No forms yet. Add the registration template or create a new form.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><CardTitle className="font-display">{selectedId ? "Edit Form" : "New Form"}</CardTitle><CardDescription>Draft changes do not alter previously submitted or signed form versions.</CardDescription></div>
              {selectedId && status === "published" && <Button variant="outline" size="sm" asChild><Link href={`/register/${slug}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open public form</Link></Button>}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="form-name">Form name</Label><Input id="form-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="form-slug">Public URL slug</Label><Input id="form-slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="student-registration" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="form-description">Description</Label><Textarea id="form-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-y py-3">
              <div><p className="font-semibold">Fields <span className="text-muted-foreground font-normal">({fields.length})</span></p><p className="text-xs text-muted-foreground">Types include text, date, address, choices, course catalog, uploads, consent, and signature.</p></div>
              <Select onValueChange={(value) => setFields((current) => [...current, newField(value as RegistrationFieldType)])}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Add field type" /></SelectTrigger>
                <SelectContent>{fieldTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Badge variant="secondary">{field.type}</Badge><span className="text-xs text-muted-foreground">{field.id}</span></div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" aria-label="Move field up" disabled={index === 0} onClick={() => moveField(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label="Move field down" disabled={index === fields.length - 1} onClick={() => moveField(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label="Remove field" onClick={() => setFields((current) => current.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2"><Label>Label / heading</Label><Input value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Help text</Label><Input value={field.helpText || ""} onChange={(e) => updateField(index, { helpText: e.target.value })} /></div>
                  </div>
                  {field.type === "consent" && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2"><Label>Linked policy label (optional)</Label><Input value={field.helpLink?.label || ""} onChange={(e) => updateField(index, { helpLink: e.target.value ? { label: e.target.value, url: field.helpLink?.url || "https://strategicvalueplus.com" } : undefined })} /></div>
                      <div className="space-y-2"><Label>Policy URL (HTTPS)</Label><Input type="url" value={field.helpLink?.url || ""} onChange={(e) => updateField(index, { helpLink: field.helpLink ? { ...field.helpLink, url: e.target.value } : { label: "View policy", url: e.target.value } })} /></div>
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2"><Label>Registration purpose mapping</Label><Select value={field.purpose || "none"} onValueChange={(purpose) => updateField(index, { purpose: purpose === "none" ? undefined : purpose as RegistrationFieldPurpose })}><SelectTrigger><SelectValue placeholder="No special mapping" /></SelectTrigger><SelectContent><SelectItem value="none">No special mapping</SelectItem>{fieldPurposes.map((purpose) => <SelectItem key={purpose.value} value={purpose.value}>{purpose.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Placeholder</Label><Input value={field.placeholder || ""} onChange={(e) => updateField(index, { placeholder: e.target.value })} /></div>
                    <div className="flex items-center justify-between rounded-md border px-3"><Label className="font-normal">Required field</Label><Switch checked={field.required} onCheckedChange={(required) => updateField(index, { required })} /></div>
                  </div>
                  {["select", "radio", "checkboxes"].includes(field.type) && (
                    <div className="space-y-2"><Label>Options (one label per line)</Label><Textarea rows={3} value={(field.options || []).map((option) => option.label).join("\n")} onChange={(e) => updateField(index, { options: e.target.value.split(/\r?\n/).map((label) => label.trim()).filter(Boolean).map((label) => ({ label, value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-") })) })} /></div>
                  )}
                  {field.type === "courseSelector" && <p className="text-xs text-muted-foreground">The live published LMS course catalog supplies course title, description, price, and selection values.</p>}
                  {field.type === "file" && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2"><Label>Allowed MIME types (comma-separated)</Label><Input value={(field.validation?.allowedMimeTypes || ["application/pdf", "image/jpeg", "image/png"]).join(", ")} onChange={(e) => updateField(index, { validation: { ...field.validation, allowedMimeTypes: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) } })} /></div>
                      <div className="space-y-2"><Label>Maximum file size (MB)</Label><Input type="number" min="1" max="25" value={Math.round((field.validation?.maxFileSizeBytes || 10 * 1024 * 1024) / (1024 * 1024))} onChange={(e) => updateField(index, { validation: { ...field.validation, maxFileSizeBytes: Number(e.target.value || 10) * 1024 * 1024 } })} /></div>
                    </div>
                  )}
                  {field.type === "signature" && <p className="text-xs text-muted-foreground">Includes typed legal name, drawn signature pad, electronic-signature consent, timestamp, and signed form version.</p>}
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Conditional display (optional)</p>
                    <div className="grid gap-2 md:grid-cols-3">
                      <Select value={field.condition?.fieldId || "none"} onValueChange={(value) => updateField(index, { condition: value === "none" ? undefined : { fieldId: value, operator: field.condition?.operator || "equals", value: field.condition?.value || "" } })}>
                        <SelectTrigger><SelectValue placeholder="Always show" /></SelectTrigger><SelectContent><SelectItem value="none">Always show</SelectItem>{fields.filter((other) => other.id !== field.id && !["section", "paragraph"].includes(other.type)).map((other) => <SelectItem key={other.id} value={other.id}>{other.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={field.condition?.operator || "equals"} disabled={!field.condition} onValueChange={(operator) => updateField(index, { condition: field.condition ? { ...field.condition, operator: operator as "equals" | "notEquals" | "contains" } : undefined })}>
                        <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="equals">is</SelectItem><SelectItem value="notEquals">is not</SelectItem><SelectItem value="contains">contains</SelectItem></SelectContent>
                      </Select>
                      <Input value={field.condition?.value || ""} disabled={!field.condition} placeholder="Value" onChange={(e) => updateField(index, { condition: field.condition ? { ...field.condition, value: e.target.value } : undefined })} />
                    </div>
                  </div>
                </div>
              ))}
              {fields.length === 0 && <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Add fields to begin building the form.</div>}
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t pt-4">
              <p className="self-center text-xs text-muted-foreground">Current draft version: v{version} · {status}</p>
              <div className="flex gap-2">
                <Button variant="outline" disabled={busy || fields.length === 0} onClick={save}><Save className="mr-2 h-4 w-4" />Save draft</Button>
                <Button disabled={busy || !selectedId} onClick={publish} className="bg-[#8A6212] hover:bg-[#8A6212]">Publish version</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
