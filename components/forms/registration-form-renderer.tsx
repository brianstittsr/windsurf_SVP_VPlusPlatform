"use client";

import { useMemo, useState } from "react";
import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { CourseDoc, RegistrationFormFieldDoc } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RotateCcw, ShieldCheck } from "lucide-react";

interface PublishedForm {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: number;
  fields: RegistrationFormFieldDoc[];
}

interface AddressValue {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

type FormValue = string | string[] | boolean | AddressValue | Record<string, unknown> | undefined;

interface RegistrationFormRendererProps {
  form: PublishedForm;
  initialCourseId?: string;
  onSubmitted: (submissionId: string) => void;
}

function SignatureCapture({
  fieldId,
  label,
  helpText,
  value,
  onChange,
}: {
  fieldId: string;
  label: string;
  helpText?: string;
  value: { typedName: string; signatureDataUrl: string; consent: boolean };
  onChange: (value: { typedName: string; signatureDataUrl: string; consent: boolean }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = 900;
    canvas.height = 220;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#071628";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const p = point(event);
    if (!canvas || !ctx || !p) return;
    canvas.setPointerCapture(event.pointerId);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawing.current = true;
    hasInk.current = true;
  };

  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(event);
    if (!ctx || !p) return;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const stop = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && hasInk.current) {
      onChange({ ...value, signatureDataUrl: canvas.toDataURL("image/png") });
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    onChange({ ...value, signatureDataUrl: "" });
  };

  return (
    <fieldset className="space-y-3 rounded-lg border border-border p-4">
      <legend className="px-1 font-medium">{label}</legend>
      {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
      <div className="space-y-2">
        <Label htmlFor={`typed-signature-${fieldId}`}>Type your legal name</Label>
        <Input
          id={`typed-signature-${fieldId}`}
          autoComplete="name"
          value={value.typedName}
          onChange={(e) => onChange({ ...value, typedName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`drawn-signature-${fieldId}`}>Draw your signature</Label>
          <Button type="button" variant="outline" size="sm" onClick={clear}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Clear
          </Button>
        </div>
        <canvas
          ref={canvasRef}
          id={`drawn-signature-${fieldId}`}
          aria-label={`Draw your signature for ${label}`}
          className="h-36 w-full touch-none rounded-md border bg-white"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
          onPointerLeave={stop}
        />
        <p className="text-xs text-muted-foreground">A mouse, finger, or stylus can be used to sign.</p>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id={`electronic-signature-consent-${fieldId}`}
          checked={value.consent}
          onCheckedChange={(checked) => onChange({ ...value, consent: checked === true })}
        />
        <Label htmlFor={`electronic-signature-consent-${fieldId}`} className="text-sm font-normal leading-relaxed">
          I agree to use an electronic signature and understand the signed form version and submission time will be retained with my registration.
        </Label>
      </div>
    </fieldset>
  );
}

function isVisible(field: RegistrationFormFieldDoc, answers: Record<string, FormValue>): boolean {
  if (!field.condition) return true;
  const current = answers[field.condition.fieldId];
  const value = field.condition.value;
  if (Array.isArray(current)) {
    const includes = current.includes(value);
    return field.condition.operator === "notEquals" ? !includes : includes;
  }
  const normalized = String(current ?? "");
  if (field.condition.operator === "equals") return normalized === value;
  if (field.condition.operator === "notEquals") return normalized !== value;
  return normalized.includes(value);
}

function isEmpty(value: FormValue): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.values(value).every((part) => !String(part || "").trim());
  return false;
}

function money(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export function RegistrationFormRenderer({ form, initialCourseId, onSubmitted }: RegistrationFormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, FormValue>>({});
  const [signatures, setSignatures] = useState<Record<string, { typedName: string; signatureDataUrl: string; consent: boolean }>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/catalog/courses", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load course catalog");
        if (active) setCourses(result.data || []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load course catalog");
      })
      .finally(() => { if (active) setLoadingCourses(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!initialCourseId || !courses.some((course) => course.id === initialCourseId)) return;
    const selector = form.fields.find((field) => field.purpose === "courseSelection" || field.type === "courseSelector");
    if (!selector) return;
    setAnswers((current) => {
      const selected = Array.isArray(current[selector.id]) ? current[selector.id] as string[] : [];
      return selected.includes(initialCourseId) ? current : { ...current, [selector.id]: [...selected, initialCourseId] };
    });
  }, [courses, form.fields, initialCourseId]);

  const selectedCourseIds = useMemo(() => {
    const selector = form.fields.find((field) => field.type === "courseSelector");
    const value = selector ? answers[selector.id] : undefined;
    return Array.isArray(value) ? value : [];
  }, [answers, form.fields]);
  const selectedCourses = useMemo(() => courses.filter((course) => selectedCourseIds.includes(course.id)), [courses, selectedCourseIds]);
  const totalCents = selectedCourses.reduce((sum, course) => sum + course.priceCents, 0);

  const setAnswer = (fieldId: string, value: FormValue) =>
    setAnswers((current) => ({ ...current, [fieldId]: value }));

  const toggleCourse = (courseId: string, checked: boolean) => {
    const selector = form.fields.find((field) => field.purpose === "courseSelection" || field.type === "courseSelector");
    if (!selector) return;
    const current = Array.isArray(answers[selector.id]) ? answers[selector.id] as string[] : [];
    if (checked) {
      const candidate = courses.find((course) => course.id === courseId);
      const conflict = courses.some((course) => current.includes(course.id) && course.includedCourseIds?.includes(courseId))
        || Boolean(candidate?.includedCourseIds?.some((includedId) => current.includes(includedId)));
      if (conflict) {
        setError("A selected bundle already includes that course. Remove the bundle or included course before continuing.");
        return;
      }
      setError("");
    }
    setAnswer(selector.id, checked ? [...new Set([...current, courseId])] : current.filter((id) => id !== courseId));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    for (const field of form.fields) {
      if (!isVisible(field, answers) || !field.required || ["section", "paragraph"].includes(field.type)) continue;
      if (field.type === "signature") {
        const signature = signatures[field.id];
        if (!signature?.typedName.trim() || !signature.signatureDataUrl || !signature.consent) {
          setError("Type and draw your signature, then accept the electronic-signature disclosure.");
          return;
        }
      } else if (field.type === "file") {
        if (!files[field.id]) {
          setError(`${field.label} is required.`);
          return;
        }
      } else if (isEmpty(answers[field.id])) {
        setError(`${field.label} is required.`);
        return;
      }
      if (field.type === "consent" && answers[field.id] !== true) {
        setError(`Please accept: ${field.label}`);
        return;
      }
      if (field.type === "email" && typeof answers[field.id] === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers[field.id] as string)) {
        setError("Enter a valid email address.");
        return;
      }
    }
    if (selectedCourseIds.length === 0) {
      setError("Select at least one course.");
      return;
    }
    if (loadingCourses) {
      setError("The course catalog is still loading.");
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("payload", JSON.stringify({
        formVersion: form.version,
        answers,
        signatures,
        selectedCourseIds,
      }));
      for (const [fieldId, file] of Object.entries(files)) body.append(`file:${fieldId}`, file);
      const response = await fetch(`/api/registration/${encodeURIComponent(form.slug)}/submit`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit registration");
      onSubmitted(result.data.submissionId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit registration");
      setSubmitting(false);
    }
  };

  const renderField = (field: RegistrationFormFieldDoc) => {
    if (!isVisible(field, answers)) return null;
    const value = answers[field.id];
    const required = field.required;
    const controlId = `registration-${field.id}`;
    const label = <Label htmlFor={controlId}>{field.label}{required ? <span className="text-destructive"> *</span> : null}</Label>;

    if (field.type === "section") return <div key={field.id} className="border-b pb-2 pt-4"><h2 className="font-display text-2xl font-semibold">{field.label}</h2>{field.helpText && <p className="mt-1 text-sm text-muted-foreground">{field.helpText}</p>}</div>;
    if (field.type === "paragraph") return <p key={field.id} className="text-sm leading-relaxed text-muted-foreground">{field.label}{field.helpText ? ` ${field.helpText}` : ""}</p>;
    if (field.type === "signature") return <div key={field.id}><SignatureCapture fieldId={field.id} label={field.label} helpText={field.helpText} value={signatures[field.id] || { typedName: "", signatureDataUrl: "", consent: false }} onChange={(value) => setSignatures((current) => ({ ...current, [field.id]: value }))} /></div>;
    if (field.type === "courseSelector") return (
      <fieldset key={field.id} className="space-y-3">
        <legend className="font-medium">{field.label}{required ? <span className="text-destructive"> *</span> : null}</legend>
        {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
        {loadingCourses ? <Skeleton className="h-24 w-full" /> : courses.length === 0 ? <p className="text-sm text-muted-foreground">No courses are currently open for registration.</p> : (
          <div className="space-y-3">
            {courses.map((course) => {
              const checked = selectedCourseIds.includes(course.id);
              const includedBySelected = selectedCourses.some((selected) => selected.includedCourseIds?.includes(course.id));
              const includesSelected = course.includedCourseIds?.some((includedId) => selectedCourseIds.includes(includedId)) || false;
              const blocked = !checked && (includedBySelected || includesSelected);
              const includedNames = (course.includedCourseIds || []).map((id) => courses.find((item) => item.id === id)).filter((item): item is CourseDoc => Boolean(item)).map((item) => `${item.code} — ${item.title}`);
              return <label key={course.id} htmlFor={`${controlId}-${course.id}`} className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/40"}`}>
                <Checkbox id={`${controlId}-${course.id}`} checked={checked} disabled={blocked} onCheckedChange={(state) => toggleCourse(course.id, state === true)} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-2 font-semibold"><span>{course.code} — {course.title}</span><span className="text-[#1478ac]">{money(course.priceCents, course.currency)}</span></span>
                  <span className="mt-1 block text-sm text-muted-foreground">{course.description}</span>
                  {course.estimatedHours ? <span className="mt-1 block text-xs text-muted-foreground">{course.estimatedHours} instructional hours</span> : null}
                  {(includedNames.length > 0 || course.bundleContents?.length) && <span className="mt-2 block text-xs text-muted-foreground">Includes: {[...includedNames, ...(course.bundleContents || [])].join(" · ")}</span>}
                  {blocked && <span className="mt-1 block text-xs text-muted-foreground">Included in another selected bundle.</span>}
                </span>
              </label>;
            })}
          </div>
        )}
        {selectedCourses.length > 0 && <p className="text-right font-semibold">Selected course total: {money(totalCents)}</p>}
      </fieldset>
    );
    if (field.type === "file") return <div key={field.id} className="space-y-2">{label}{field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}<Input id={controlId} type="file" required={required} accept={(field.validation?.allowedMimeTypes || ["application/pdf", "image/jpeg", "image/png"]).join(",")} onChange={(e) => { const file = e.target.files?.[0]; if (file) setFiles((current) => ({ ...current, [field.id]: file })); }} /><p className="text-xs text-muted-foreground">Max {Math.round((field.validation?.maxFileSizeBytes || 10 * 1024 * 1024) / 1024 / 1024)} MB. Files are stored privately.</p></div>;
    if (field.type === "address") {
      const address = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as AddressValue;
      return <fieldset key={field.id} className="space-y-2"><legend className="font-medium">{field.label}{required ? <span className="text-destructive"> *</span> : null}</legend><div className="space-y-3"><Input aria-label="Street address" placeholder="Street address" value={address.street || ""} onChange={(e) => setAnswer(field.id, { ...address, street: e.target.value })} /><div className="grid gap-3 sm:grid-cols-3"><Input aria-label="City" placeholder="City" value={address.city || ""} onChange={(e) => setAnswer(field.id, { ...address, city: e.target.value })} /><Input aria-label="State" placeholder="State" value={address.state || ""} onChange={(e) => setAnswer(field.id, { ...address, state: e.target.value })} /><Input aria-label="ZIP code" placeholder="ZIP code" value={address.zip || ""} onChange={(e) => setAnswer(field.id, { ...address, zip: e.target.value })} /></div></div>{field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}</fieldset>;
    }
    if (field.type === "consent") return <div key={field.id} className="flex items-start gap-3"><Checkbox id={controlId} checked={value === true} onCheckedChange={(checked) => setAnswer(field.id, checked === true)} /><div className="space-y-1">{label}{field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}{field.helpLink ? <> <a href={field.helpLink.url} target="_blank" rel="noopener noreferrer" className="text-[#1478ac] underline">{field.helpLink.label}</a></> : null}</p>}</div></div>;
    if (["select", "radio", "yesNoPreferNot"].includes(field.type)) {
      const choices = field.type === "yesNoPreferNot" ? [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }, { label: "Prefer not to answer", value: "prefer_not" }] : (field.options || []);
      return <div key={field.id} className="space-y-2">{label}{field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}{field.type === "select" ? <select id={controlId} className="w-full rounded-md border border-input bg-background px-3 py-2" value={typeof value === "string" ? value : ""} onChange={(e) => setAnswer(field.id, e.target.value)}><option value="">Choose…</option>{choices.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <RadioGroup value={typeof value === "string" ? value : ""} onValueChange={(next) => setAnswer(field.id, next)}>{choices.map((option) => <div key={option.value} className="flex items-center gap-2"><RadioGroupItem id={`${controlId}-${option.value}`} value={option.value} /><Label htmlFor={`${controlId}-${option.value}`} className="font-normal">{option.label}</Label></div>)}</RadioGroup>}</div>;
    }
    if (field.type === "checkboxes") {
      const selected = Array.isArray(value) ? value as string[] : [];
      return <fieldset key={field.id} className="space-y-2"><legend className="font-medium">{field.label}{required ? <span className="text-destructive"> *</span> : null}</legend>{field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}{(field.options || []).map((option) => <div key={option.value} className="flex items-center gap-2"><Checkbox id={`${controlId}-${option.value}`} checked={selected.includes(option.value)} onCheckedChange={(checked) => setAnswer(field.id, checked ? [...new Set([...selected, option.value])] : selected.filter((item) => item !== option.value))} /><Label htmlFor={`${controlId}-${option.value}`} className="font-normal">{option.label}</Label></div>)}</fieldset>;
    }
    const inputType = field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "monthYear" ? "month" : "text";
    if (field.type === "textarea") return <div key={field.id} className="space-y-2">{label}{field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}<Textarea id={controlId} required={required} placeholder={field.placeholder} value={typeof value === "string" ? value : ""} onChange={(e) => setAnswer(field.id, e.target.value)} maxLength={field.validation?.maxLength} /></div>;
    return <div key={field.id} className="space-y-2">{label}{field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}<Input id={controlId} type={inputType} required={required} placeholder={field.placeholder} value={typeof value === "string" ? value : ""} onChange={(e) => setAnswer(field.id, e.target.value)} minLength={field.validation?.minLength} maxLength={field.validation?.maxLength} min={field.validation?.min} max={field.validation?.max} /></div>;
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card>
        <CardHeader><CardTitle className="font-display">{form.name}</CardTitle><CardDescription>{form.description}</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          {form.fields.map(renderField)}
          <div className="rounded-md bg-[#e9f3f8] p-4 text-sm text-[#071628]">
            <div className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-[#1478ac]" /><p>Payment details are not collected on this form. EFVS reviews registrations and sends approved students a secure Stripe checkout link. Course access begins after payment or approved sponsorship is confirmed.</p></div>
          </div>
          <Button type="submit" disabled={submitting || loadingCourses} className="w-full bg-[#1478ac] hover:bg-[#318dc1]">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : "Submit signed registration"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
