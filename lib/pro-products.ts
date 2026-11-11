import type { LmsProductDoc } from "@/lib/schema";

export type ProProductDraft = Omit<LmsProductDoc, "id" | "createdAt" | "updatedAt">;

export const VPLUS_PRO_PRODUCTS: ProProductDraft[] = [
  {
    code: "pro-monthly",
    title: "Part 107 Pro — Month-to-Month",
    description: "Pro access to the V+ Part 107 digital study guide and learner analytics. Cancel anytime.",
    kind: "pro_access",
    billingMode: "subscription",
    priceCents: 9700,
    currency: "usd",
    durationMonths: 1,
    interval: "month",
    benefits: ["Synced study progress", "Full quiz history and analytics", "Weak-area insights", "Priority access to study updates"],
    published: true,
    displayOrder: 100,
  },
  {
    code: "pro-six-month",
    title: "Part 107 Pro — 6-Month Mission",
    description: "Six months of Pro study-guide access, prepaid once.",
    kind: "pro_access",
    billingMode: "payment",
    priceCents: 49700,
    currency: "usd",
    durationMonths: 6,
    benefits: ["Synced study progress", "Full quiz history and analytics", "Weak-area insights", "Priority access to study updates"],
    published: true,
    displayOrder: 101,
  },
  {
    code: "pro-annual",
    title: "Part 107 Pro — 12-Month Deployment",
    description: "Twelve months of Pro study-guide access, prepaid once.",
    kind: "pro_access",
    billingMode: "payment",
    priceCents: 89700,
    currency: "usd",
    durationMonths: 12,
    benefits: ["Synced study progress", "Full quiz history and analytics", "Weak-area insights", "Priority access to study updates"],
    published: true,
    displayOrder: 102,
  },
];
