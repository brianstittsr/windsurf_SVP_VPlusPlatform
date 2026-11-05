import { z } from "zod";

export const registrationFieldTypes = [
  "section",
  "paragraph",
  "text",
  "textarea",
  "name",
  "email",
  "phone",
  "number",
  "date",
  "monthYear",
  "address",
  "select",
  "radio",
  "checkboxes",
  "yesNoPreferNot",
  "courseSelector",
  "file",
  "consent",
  "signature",
] as const;

const fieldSchema = z.object({
  id: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  type: z.enum(registrationFieldTypes),
  purpose: z.enum(["fullName", "company", "birthMonthYear", "email", "phone", "address", "veteranStatus", "courseSelection", "newsletterConsent", "studentAcknowledgment", "programPolicies", "signature"]).optional(),
  label: z.string().min(1).max(240),
  helpText: z.string().max(1000).optional(),
  helpLink: z.object({ label: z.string().min(1).max(100), url: z.string().url().max(1000).refine((url) => url.startsWith("https://"), "Help links must use HTTPS") }).optional(),
  placeholder: z.string().max(200).optional(),
  required: z.boolean(),
  options: z.array(z.object({ label: z.string().min(1).max(120), value: z.string().min(1).max(120) })).max(100).optional(),
  condition: z.object({
    fieldId: z.string().min(1).max(80),
    operator: z.enum(["equals", "notEquals", "contains"]),
    value: z.string().max(500),
  }).optional(),
  validation: z.object({
    minLength: z.number().int().min(0).max(10000).optional(),
    maxLength: z.number().int().min(1).max(10000).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().max(160).optional(),
    allowedMimeTypes: z.array(z.string().max(100)).max(20).optional(),
    maxFileSizeBytes: z.number().int().min(1).max(25 * 1024 * 1024).optional(),
  }).optional(),
});

export const saveRegistrationFormSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(3).max(120),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000).optional(),
  fields: z.array(fieldSchema).min(1).max(150),
});

export type SaveRegistrationFormInput = z.infer<typeof saveRegistrationFormSchema>;
