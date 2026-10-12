import { z } from "zod";

export const deadlineSchema = z
  .object({ at: z.string().min(1), timezone: z.string().min(1) })
  .nullable()
  .optional();

const contactSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export const clientCreateSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  primaryContact: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  isCaptureClient: z.literal(true).default(true),
  contacts: z.array(contactSchema).optional(),
  accountManagerId: z.string().optional(),
  accountManagerName: z.string().optional(),
  govcon: z
    .object({
      uei: z.string().optional(),
      cageCode: z.string().optional(),
      samRegistrationExpiry: z.string().optional(),
      clearanceLevel: z.string().optional(),
      naicsCodes: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
      targetAgencies: z.array(z.string()).optional(),
      certifications: z
        .array(z.object({ name: z.string(), expiresAt: z.string().optional() }))
        .optional(),
      capabilityStatements: z
        .array(
          z.object({
            fileId: z.string(),
            name: z.string(),
            version: z.string(),
            storagePath: z.string(),
            uploadedAt: z.string(),
          })
        )
        .optional(),
      pastContracts: z
        .array(
          z.object({
            agency: z.string(),
            contractNumber: z.string(),
            value: z.number().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const clientPatchSchema = clientCreateSchema.partial();

export const opportunityCreateSchema = z
  .object({
    clientId: z.string().min(1, "A client is required"),
    title: z.string().min(1, "Title is required"),
    solicitationNumber: z.string().min(1, "Solicitation number is required"),
    samNoticeId: z.string().optional(),
    source: z.enum(["manual", "imported"]).default("manual"),
    type: z.enum(["rfi", "sources-sought", "rfp", "rfq", "grant"]),
    boardType: z.enum(["standard", "rfi"]).default("standard"),
    agency: z.string().min(1, "Agency is required"),
    office: z.string().optional(),
    contractingOfficer: z.object({ name: z.string().optional(), email: z.string().optional() }).optional(),
    links: z
      .object({ samUrl: z.string().optional(), qaUrl: z.string().optional(), other: z.array(z.string()).optional() })
      .optional(),
    naicsCode: z.string().optional(),
    setAside: z.string().optional(),
    description: z.string().optional(),
    estimatedValue: z
      .object({ min: z.number().optional(), max: z.number().optional(), text: z.string().optional() })
      .optional(),
    stage: z.string().optional(),
    questionsDue: deadlineSchema,
    responseDue: deadlineSchema,
    ownerId: z.string().optional(),
    ownerName: z.string().optional(),
    incumbent: z.string().optional(),
    competitors: z.array(z.string()).optional(),
    teamingPartners: z.array(z.object({ name: z.string(), role: z.enum(["prime", "sub"]) })).optional(),
    capabilityStatementRef: z.string().optional(),
    notes: z
      .array(z.object({ id: z.string(), text: z.string(), authorId: z.string(), authorName: z.string(), createdAt: z.string() }))
      .optional(),
  })
  .superRefine((val, ctx) => {
    // Rule 4: questions due must come before response due
    if (val.questionsDue?.at && val.responseDue?.at) {
      if (new Date(val.questionsDue.at).getTime() >= new Date(val.responseDue.at).getTime()) {
        ctx.addIssue({
          code: "custom",
          message: "Questions due must be before the response due date",
          path: ["questionsDue"],
        });
      }
    }
  });

export const opportunityPatchSchema = opportunityCreateSchema.partial().superRefine((val, ctx) => {
  if (val.questionsDue?.at && val.responseDue?.at) {
    if (new Date(val.questionsDue.at).getTime() >= new Date(val.responseDue.at).getTime()) {
      ctx.addIssue({
        code: "custom",
        message: "Questions due must be before the response due date",
        path: ["questionsDue"],
      });
    }
  }
});

export const stageTransitionSchema = z.object({
  toStage: z.string().min(1),
  bidNoBid: z
    .object({ decision: z.enum(["bid", "no-bid"]), reason: z.string().optional() })
    .optional(),
  submittedAt: z.string().optional(),
  finalSubmissionFileId: z.string().optional(),
  outcome: z
    .object({ result: z.enum(["won", "lost", "no-award"]).optional(), awardDate: z.string().optional() })
    .optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(1),
  assigneeId: z.string().min(1),
  assigneeName: z.string().min(1),
  dueDate: z.string().optional(),
});

export const taskPatchSchema = z.object({
  title: z.string().optional(),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["open", "done"]).optional(),
});

export const noteCreateSchema = z.object({
  text: z.string().min(1),
});

export const fileCreateSchema = z.object({
  name: z.string().min(1),
  storagePath: z.string().min(1),
  url: z.string().min(1),
  tag: z.string().min(1),
  size: z.number().optional(),
});

export const exportRequestSchema = z.object({
  clientId: z.string().optional(),
  stage: z.string().optional(),
  ownerId: z.string().optional(),
  type: z.string().optional(),
});

export const settingsPatchSchema = z
  .object({
    standardStages: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
    rfiStages: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
    opportunityTypes: z.array(z.string()).optional(),
    setAsides: z.array(z.string()).optional(),
    noBidReasons: z.array(z.string()).optional(),
    fileTags: z.array(z.string()).optional(),
    deadlineYellowDays: z.number().int().positive().optional(),
    deadlineRedDays: z.number().int().positive().optional(),
    expiryWarningDays: z.number().int().positive().optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.deadlineYellowDays !== undefined &&
      val.deadlineRedDays !== undefined &&
      val.deadlineRedDays >= val.deadlineYellowDays
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Red threshold must be less than yellow threshold",
        path: ["deadlineRedDays"],
      });
    }
  });
