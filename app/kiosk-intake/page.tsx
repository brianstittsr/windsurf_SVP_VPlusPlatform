import { redirect } from "next/navigation";

/**
 * Legacy multi-field intake route.
 * Redirects to the new one-question-at-a-time interview at /kiosk-interview.
 */
export default function KioskIntakeRedirect() {
  redirect("/kiosk-interview");
}
