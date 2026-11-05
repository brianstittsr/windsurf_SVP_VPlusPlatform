# EFVS Academy — Acceptance Checklist

Derived from the TTS → EFVS LMS proposal and the current registration, catalog, and Part 107 digital study-guide scope. Items marked **[manual]** require credentials, content, legal review, or infrastructure outside the codebase.

## Branding & Content

- [x] EFVS logo, mark, and imagery downloaded to `public/images/` (32 assets)
- [x] EFVS palette applied — navy `#071628`, gold `#d3ac63`, blues `#1478ac`/`#56b8e8`
- [x] EFVS typography — Barlow Condensed (display), Manrope + DM Sans
- [x] All Strategic Value Plus/SVP branding removed from active app code
- [x] Minimal public landing page with Academy positioning, catalog CTA, contact info, and legal links
- [x] Legal pages (Terms, Privacy, EULA) rebranded to EFVS
- [ ] **[manual]** Final legal entity name/address review by EFVS counsel

## Catalog, Registration & Records

- [x] Firestore-backed course catalog, detailed course records, course images, pricing, prerequisite/outcome/bundle fields, archive behavior, and admin editing
- [x] Idempotent import of the registration-PDF course list as unpublished catalog drafts
- [x] Part 107 guide (`SG107`) and AC1+guide bundle records; bundle price/inclusions require admin review before publication
- [x] Public Pricing page reads published courses and digital products from the LMS catalog; per-course purchase mode routes learners to instant checkout or staff-reviewed registration
- [x] Direct course checkout for signed-in students (`/api/stripe/checkout` `courseId` mode) with bundle expansion, discounts, and veteran eligibility
- [x] Free enrollment for zero-dollar published courses via `/api/lms/enroll` — no Stripe step, order + enrollment + audit records still written
- [x] Already-enrolled purchase blocking on both checkout paths (409 with course names)
- [x] In-portal resume-payment card for approved registrations awaiting checkout
- [x] Versioned Registration Form Builder with conditional fields, contact/address/date/select/radio/checkbox/course-selector/file/consent/signature support
- [x] Public registration validates catalog courses, required acknowledgments, uploaded files, and signatures server-side
- [x] E-signatures, signed PDF snapshots, field/image hashes, and reviewer audit data
- [x] Admin review, needs-information/rejection notifications, one-time account invitations, sponsored approvals, and post-approval checkout
- [x] Registration files and signed PDFs are private and linked to the authenticated student profile after claim
- [x] Purchase/invoice history, course completion history, student document upload/download, and course certificate PDFs
- [ ] **[manual]** Counsel approval of e-sign consent, registration language, record retention, and refund/cancellation terms
- [ ] **[manual]** Set final standalone-guide and AC1+guide bundle retail prices; verify bundle includes exactly the intended courses before publishing
- [ ] **[manual]** Configure `REGISTRATION_INVITE_SECRET` (32+ characters) and verify configured registration email delivery

## LMS Core & Part 107 Study Guide

- [x] Course catalog, course details, and enrollment history
- [x] SCORM 1.2 + SCORM 2004 playback via `scorm-again`
- [x] SCORM launch/resume — CMI data persisted per enrollment via `/api/scorm/commit`
- [x] SCORM package upload (admin-only) — zip extraction → Firebase Storage → manifest parsing
- [x] Same-origin SCORM content proxy behind a signed, short-lived `scorm_session` cookie
- [x] Native quiz/exam engine with server-side grading, randomized order/options, passing scores, attempt limits, and answer-key protection
- [x] Per-lesson completion tracking rendered on the learn page with auto-resume to the first incomplete lesson
- [x] Final exams gated server-side until every lesson module is complete; retakes allowed after course completion within `maxAttempts`
- [x] Answer explanations withheld until grading; post-attempt review returned by the attempts API
- [x] Course progress/assessment completion reconciliation and server-issued branded certificates
- [x] Automatic certificate issuance from native lesson completion, exam pass, SCORM completion, and staff completion — idempotent via shared `tryIssueCertificate`
- [x] Full admin authoring: lesson editor (type/description/content/reorder) and question-bank editor (quiz/exam, options, correct answer, explanation, randomization, questions-per-attempt)
- [x] Server-side enrollment status route applies completion timestamps, progress, and certificate side effects; manual enrollment requires a linked account, blocks duplicates, and writes a manual order record
- [x] Complete Part 107 guide content imported into LMS-owned Firestore: nine categories, all source questions/explanations, and vocabulary
- [x] LMS-native Part 107 quiz lab, answer feedback, cloud progress, readiness/weak-area metrics, streaks, vocabulary mastery, resumable sessions, Pro history, and CSV readiness export
- [x] No runtime link, embed, sync, or API connection to the original `part107-quiz` project or its Firebase project
- [ ] **[manual]** Import Part 107 content from `/portal/admin/seed` and verify all categories/questions/vocabulary counts
- [ ] **[manual]** Upload the production AC1 SCORM package and smoke-test a full playthrough
- [ ] **[manual]** Verify course/guide content and completion rules against EFVS's approved curriculum

## Digital Products & Payments

- [x] Stripe-hosted Checkout for admin-approved course registrations and Pro plans; raw card/bank data is never collected
- [x] Course purchases and bundles create idempotent orders, invoice/payment history, and course entitlements
- [x] Retained Pro products: $97 monthly subscription, $497 six-month prepaid, and $897 annual prepaid
- [x] Subscription status/renewals/past-due/cancellation synchronized from Stripe webhooks; Stripe Customer Portal for billing management
- [x] Stripe dynamic payment methods (including supported ACH debit); manual ACH invoice settlement creates purchase history and enrollment
- [x] Percent-off and veteran-only discount codes validated server-side; discount redemptions are counted idempotently
- [x] Sponsored approvals grant access without representing a charge
- [ ] **[manual]** Configure Stripe webhook secret and register Checkout, subscription, invoice, and refund events
- [ ] **[manual]** Configure Stripe Billing Portal cancellation/payment-method settings and enable any desired ACH methods
- [ ] **[manual]** Test Stripe test-mode registration, direct course purchase, free enrollment, duplicate-purchase blocking, Pro monthly, prepaid, discounts, refunds, failed payments, and cancellation/expiration

## Certificates, LinkedIn & Privacy

- [x] Unique EFVS certificate identifiers, stored private certificate PDFs, and opt-in public verification pages
- [x] Public credential pages reveal only learner-approved name and credential data; private profile/documents remain hidden
- [x] Student can revoke public sharing and copy credential details for LinkedIn
- [x] LinkedIn Add to Profile integration uses a static provider URL and does not claim LinkedIn autofills fields
- [ ] **[manual]** Generate and set EFVS's LinkedIn Add to Profile provider URL in `NEXT_PUBLIC_LINKEDIN_ADD_TO_PROFILE_URL`
- [ ] **[manual]** Review public-name consent text and LinkedIn credential wording with EFVS counsel
- [ ] **[manual]** Verify student opt-in, revocation, public credential lookup, and search/social previews

## Roles, Security & Admin

- [x] Roles: student / instructor / admin; first admin seeded manually through `roles/{uid}`
- [x] Team-member profiles are owner/staff-scoped; profile bootstrap is ID-token-verified and roles are server-controlled
- [x] Learners cannot create enrollments, directly write grades, read question answer keys, or issue certificates from the client
- [x] Native lesson content is served through an authenticated API only after enrollment/staff authorization; direct learner Firestore reads are blocked
- [x] Registration submissions, private student documents, and signatures use authorized server routes and private Storage paths
- [x] SCORM upload restricted to admins; content/commit routes require signed session and enrollment/course validation
- [x] Stripe webhooks verify signatures and fulfill orders idempotently; full refunds revoke associated entitlements/access, while partial refunds retain access and are recorded
- [x] Audit logging for registration reviews, certificates, course/discount administration, payments, and document activity
- [x] Admin tools: courses, digital products, forms, registration review, seed/import, enrollments, payments, discounts, users, and SCORM packages
- [ ] **[manual]** Deploy Firestore indexes/rules and Storage rules to the LMS Firebase project, then test with student/instructor/admin accounts
- [ ] **[manual]** Penetration test and SOC 2 Type II hosting evidence review before launch

## Verification & Infrastructure

- [x] `npx tsc --noEmit` — clean
- [x] `npm run lint` — no errors
- [x] `npm run build` — production build succeeded
- [ ] **[manual]** Learner journey smoke test: sign-in → free enroll → lesson progress → gated exam → retake → auto-issued certificate; cancelled/expired enrollment messaging; resume-payment card
- [ ] **[manual]** Stripe test-mode end-to-end suite, including webhook retries/idempotency and cross-application isolation checks
- [ ] **[manual]** 500+ concurrent users load test; API response target <1s on production
- [ ] **[manual]** 99.9% uptime target, daily Firestore/Storage backups, failover plan
- [ ] **[manual]** SSL/TLS and DNS for `academy.efvertical.com`
