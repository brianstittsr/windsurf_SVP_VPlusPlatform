# EFVS Academy — UAS Training LMS

A **Next.js 16** learning management platform for **Eagle Flight Vertical
Solutions (EFVS)** — hosted at `academy.efvertical.com` — delivering the
**AC1 FAA Part 107 Remote Pilot Certification Preparation Course** with
SCORM 1.2/2004 playback, quizzes & exams, certificates, payments, and
administration.

## Features

- **Dynamic course catalog & pricing** — courses, the Part 107 guide, course bundles, and Pro plans are read from LMS Firestore-backed catalogs; each course chooses instant Stripe checkout or staff-reviewed registration, and zero-dollar courses enroll free
- **Registration Form Builder** — versioned forms with conditional fields, uploads, policy links, typed/drawn e-signatures, immutable signed PDFs, and private submission review
- **Study Guide** — the complete nine-category Part 107 question bank, explanations, vocabulary deck, saved/resumable quizzes, study streaks, and progress analytics run entirely on the EFVS LMS Firebase project; answer keys are server-side
- **SCORM player** — `scorm-again` runtime, launch/resume, CMI persistence, completion & score tracking (SCORM 1.2 and SCORM 2004)
- **Assessments** — server-graded randomized exams, passing scores, attempt limits, and feedback
- **Certificates & badges** — branded PDFs and unique verification pages, with student-controlled public-name consent and LinkedIn Add to Profile support
- **Roles & records** — student / instructor / admin, private purchase history, signed forms, uploaded documents, and course completion records
- **Payments** — Stripe Checkout (dynamic payment methods, including supported ACH), monthly Pro subscription, 6/12-month prepaid Pro access, one-time courses/bundles, validated discounts, and manual ACH invoices for B2B
- **Instructor tools** — roster, grading review, CSV/PDF reports
- **Admin tools** — course/product management, form builder and review queue, SCORM upload, enrollments, payments, discount codes, user roles, and audit logging

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Firebase Auth + Firestore + Storage · Firebase Admin SDK · Stripe ·
scorm-again · jszip · jspdf · shadcn/ui

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in Firebase + Stripe keys
npm run dev                  # http://localhost:3000
```

See `.env.example` for every environment variable, including the Firebase Admin service account, `REGISTRATION_INVITE_SECRET` (32+ characters), optional registration email settings, `STRIPE_WEBHOOK_SECRET`, and the LinkedIn Add to Profile provider URL. Keep all non-`NEXT_PUBLIC_*` values server-side.

## Security & Access Control

- Firestore rules (`firestore.rules`) scope user profiles, enrollment grants, assessments, certificates, and private records to owners/staff/admin. New profiles are bootstrapped through a Firebase ID-token-verified server route; learners cannot create enrollments or grades directly.
- Question-bank answer keys are not returned to learners; quiz attempts are graded and stored server-side. Study-guide questions, progress, and in-progress sessions use only the EFVS LMS Firebase database.
- Registration submissions, signatures, certificates, and uploaded documents are stored privately and delivered through authenticated server endpoints. Public credential pages show learner identity only after explicit opt-in.
- SCORM content is served through `/api/scorm/content` behind a signed, short-lived `scorm_session` cookie (`SCORM_SESSION_SECRET`).
- Stripe webhooks verify signatures and use idempotent order fulfillment for courses, bundles, Pro purchases, subscription changes, refunds, and discount redemptions.
- Bank details are never stored: ACH debit is collected by Stripe Checkout; offline B2B ACH is recorded as a manual invoice only. Raw card data is never collected.

## Launch Setup

1. Seed the first administrator by creating `roles/{firebaseUid}` with `{ "role": "admin" }` in Firestore.
2. Set `REGISTRATION_INVITE_SECRET` to a unique random secret with at least 32 characters. Configure Microsoft Graph email variables and `EFVS_REGISTRATION_EMAIL` if invitation and status emails should be delivered automatically.
3. In `/portal/admin/courses`, import the registration-form catalog. Review the unpublished course drafts, set prices for `SG107` and `AC1-SG107`, verify bundle membership, and publish only after content/pricing approval. The existing AC1 sample is reused as a draft, retaining its lessons and mock records.
4. In `/portal/admin/products`, import the retained Pro plans ($97 monthly, $497/6 months, $897/12 months). The standard Pro plan records are published; review plan text, discounts, and access terms before launch.
5. In `/portal/admin/seed`, import the complete Part 107 study guide to LMS Firestore. The old `part107-quiz` project is not a runtime dependency and is not contacted. The same page can seed the AC1 demonstration course and mock data.
6. Configure the Stripe webhook for Checkout completion/async payment, subscription create/update/delete, invoice paid/payment failed, and charge refunded events. Configure Stripe Billing Portal cancellation/payment-method settings and enable any desired ACH methods.
7. Set `NEXT_PUBLIC_LINKEDIN_ADD_TO_PROFILE_URL` to the EFVS provider URL generated from LinkedIn's Add to Profile provider site. The learner sharing switch defaults off.
8. Have EFVS counsel review the e-sign consent wording, refund/cancellation policies, certificate wording, and the public student credential disclosure before publication.
9. After the LMS payment flow is validated in Stripe test mode, retire the old standalone app's production checkout/billing entry points as part of cutover. The LMS has no runtime connection to that project.
10. Deploy the Firestore rules, indexes (`firestore.indexes.json`), and Storage rules (`storage.rules`) alongside the app.

## Deployment

Designed for the Firebase Hosting + Next.js (or Vercel) model.

## License

Proprietary — Eagle Flight Vertical Solutions

- Website: [efvertical.com](https://www.efvertical.com)
- Email: info@efvertical.com · Phone: 805-584-1157
