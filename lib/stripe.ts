import Stripe from "stripe";

/**
 * Server-side Stripe client. Null when STRIPE_SECRET_KEY is not configured —
 * callers must check before use.
 */
export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-09-30.endive",
    })
  : null;
