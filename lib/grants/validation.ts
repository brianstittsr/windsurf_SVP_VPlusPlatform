import { z } from "zod";
import { isGrantStage } from "@/lib/grants/stages";

export const grantCreateSchema = z.object({
  title: z.string().min(1).max(300),
  funder: z.string().max(300).optional(),
  sourceUrl: z.string().url().max(2000).optional().or(z.literal("")),
  description: z.string().max(20_000).optional(),
  eligibility: z.string().max(20_000).optional(),
  awardMin: z.number().nonnegative().optional(),
  awardMax: z.number().nonnegative().optional(),
  deadlineAt: z.string().max(40).optional(),
  orgProfileId: z.string().max(160).optional(),
});

export const grantPatchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  funder: z.string().max(300).optional(),
  sourceUrl: z.string().url().max(2000).optional().or(z.literal("")),
  description: z.string().max(20_000).optional(),
  eligibility: z.string().max(20_000).optional(),
  awardMin: z.number().nonnegative().nullable().optional(),
  awardMax: z.number().nonnegative().nullable().optional(),
  deadlineAt: z.string().max(40).nullable().optional(),
  stage: z.string().refine(isGrantStage, { message: "Invalid stage" }).optional(),
  orgProfileId: z.string().max(160).nullable().optional(),
  customerId: z.string().max(160).nullable().optional(),
  requirements: z
    .array(z.object({ id: z.string(), text: z.string().max(4000), met: z.boolean(), notes: z.string().max(2000).optional() }))
    .max(200)
    .optional(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().max(8000),
        required: z.boolean(),
        aiDraft: z.string().max(60_000).optional(),
        response: z.string().max(60_000).optional(),
        status: z.enum(["pending", "drafted", "accepted", "edited"]),
        answeredAt: z.string().optional(),
        answeredBy: z.string().optional(),
      })
    )
    .max(200)
    .optional(),
  submittedAt: z.string().datetime({ offset: true }).nullable().optional(),
  outcomeNotes: z.string().max(20_000).optional(),
  syncCalendar: z.boolean().optional(),
});

export const analyzeUrlSchema = z.object({
  url: z.string().url().max(2000),
});

export const orgProfileCreateSchema = z.object({
  websiteUrl: z.string().url().max(2000).optional().or(z.literal("")),
  name: z.string().max(300).optional(),
  mission: z.string().max(4000).optional(),
  productsServices: z.array(z.string().max(500)).max(100).optional(),
  populationServed: z.string().max(4000).optional(),
  keyPrograms: z.array(z.string().max(500)).max(100).optional(),
  customerId: z.string().max(160).optional(),
});

export const respondSchema = z.object({
  response: z.string().max(60_000),
  accept: z.boolean().default(true),
});
