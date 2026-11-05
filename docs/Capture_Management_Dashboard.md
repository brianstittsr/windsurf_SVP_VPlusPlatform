---
agent: devin-local
session: silky-tugboat
created: 2026-10-04T16:14:29Z
---
# Capture Management Dashboard — Integration into SVP Platform Portal

Build the full 3-phase Capture Management Dashboard (govcon BD CRM) inside the existing portal at /portal/capture/*: clients via an extended customers collection, a new captureOpportunities collection with a gated Kanban board, API-route-enforced business rules, alerts, reports, and SAM.gov auto-matching reusing the platform's existing SAM/USASpending/OpenAI/email infrastructure.

## Summary

Implement the Capture Management Dashboard requirements doc inside the existing Next.js 16 + Firebase portal as a new top-level module under `/portal/capture/*` with its own sidebar section. All three phases are in scope. Decisions confirmed with user:

- **Clients** = extend the existing `customers` collection with a govcon profile block (keeps one client list; `isCaptureClient` flag distinguishes them).
- **Opportunities** = new `captureOpportunities` collection (govcon pipeline, separate from the commercial `opportunities` and affiliate `deals`).
- **My Solicitations** (`samSavedOpportunities`) stays the intake inbox — add a "Promote to board" action that creates a `captureOpportunity` with `source: "imported"` + `samNoticeId`.
- **Rules enforced in API routes only** — new `lib/capture/server-auth.ts` verifies the caller's Firebase ID token via `adminAuth` and resolves their role from `teamMembers`. Firestore rules unchanged for now.
- **New "Capture Management" sidebar section** (admin + team roles only).
- **AI summaries/matching** reuse `lib/openai-config.ts` (`createOpenAIClient`).
- **2-step verification deferred** (existing Firebase email/password auth stands; listed as follow-up).

## Existing platform assets reused

| Requirement | Existing asset |
|---|---|
| Auth / roles | Firebase Auth, `AuthGuard`, `useUserProfile`, `teamMembers.role` (admin/superadmin vs team) |
| SAM.gov search + save + schedules + Excel export | `lib/sam/samApiClient.ts`, `lib/sam/samAgent.ts`, `app/api/sam/*`, `admin/sam-gov` page, `samSavedOpportunities`, `samSearchSchedules` |
| Incumbent lookup (Phase 3) | `admin/usaspending` + `api/usaspending/search` |
| Kanban drag/drop | `@hello-pangea/dnd` (installed, unused) |
| Dashboard charts | `recharts` |
| Excel export | `exceljs` + `api/sam/export` pattern |
| PDF reports | `puppeteer-core` + `@sparticuz/chromium` (already deps) or print view |
| Email alerts + daily digest | `lib/email.ts` (Microsoft Graph) |
| In-app notifications | `lib/notifications.ts` / sonner toasts |
| Audit log (rule 11) | `lib/activity-logger.ts` → `activities` collection (extend `EntityType` with `"capture-client"`, `"capture-opportunity"`) |
| File storage | Firebase `storage` from `lib/firebase.ts` (`uploadBytes`/`getDownloadURL`; replaces base64-in-Firestore approach used by Documents page) |
| Background jobs | Vercel crons in `vercel.json` + `CRON_SECRET` Bearer check (eos2 pattern) |
| Server-side Firestore | `adminDb`/`adminAuth` from `lib/firebase-admin.ts` |

## Data model

### 1. Extend `CustomerDoc` (`customers` collection) — `lib/schema.ts`

Add optional `govcon` block + `isCaptureClient?: boolean`:
- `uei`, `cageCode`, `samRegistrationExpiry`, `clearanceLevel`
- `naicsCodes: string[]`, `keywords: string[]`, `targetAgencies: string[]` (structured for matching)
- `certifications: { name: string; expiresAt?: Timestamp }[]`
- `capabilityStatements: { fileId, name, version, storagePath, uploadedAt }[]`
- `pastContracts: { agency, contractNumber, value, startDate, endDate }[]`
- `accountManagerId`/`accountManagerName` (team member)

### 2. New collections (`COLLECTIONS` additions in `lib/schema.ts`)

- **`captureOpportunities`**: `clientId` (required→customers), `clientName` (denorm), `title`, `solicitationNumber`, `samNoticeId?`, `source: "manual"|"imported"`, `type` (rfi/sources-sought/rfp/rfq/grant), `boardType: "standard"|"rfi"`, `agency`, `office`, `contractingOfficer {name,email}`, `links {samUrl?,qaUrl?,other[]}`, `naicsCode`, `setAside`, `estimatedValue {min?,max?,text?}`, `stage`, `questionsDue {at,timezone}`, `responseDue {at,timezone}` (rule 5: store agency TZ, render both TZs), `ownerId`/`ownerName`, `bidNoBid {decision,reason,score,suggestedDecision,decidedById/Name,decidedAt,settingsSnapshot}`, `incumbent`, `competitors[]`, `teamingPartners {name,role:prime|sub}[]`, `capabilityStatementRef`, `outcome {result,awardDate}`, `files {id,name,storagePath,url,tag:rfp|amendment|draft|final-submission,uploadedBy,uploadedAt}[]`, `notes {id,text,authorId,authorName,createdAt}[]`, `submittedAt`, `finalSubmissionFileId`, `matchScore?`, `deletedAt`/`deletedBy` (rule 10 trash), `createdAt/updatedAt/createdById`.
- **`captureTasks`** (top-level — enables "My tasks" queries by `assigneeId`): `opportunityId`, `title`, `assigneeId/Name`, `dueDate`, `status`.
- **`captureSavedSearches`** (Phase 3, created now): name, query, filters, ownerId, isActive.
- **`captureMatches`** (Phase 3): `samNoticeId`, snapshot of notice fields, `clientId`, `score`, `scoreBreakdown`, `status: pending|accepted|dismissed`, `aiSummary?`.
- **`captureSettings`** (single doc `global`): kanban stage names/order, dropdown lists (types, set-asides, no-bid reasons, file tags), deadline colors (yellow 7d / red 3d), expiry warning days (90), alert timing (7/3/1), match score points + cutoff (60), scorecard questions (must-have + weighted), weights, cutoffs (70/50) — all admin-editable; scorecards snapshot the settings they were scored with.
- **`captureTrash`** view implemented via `deletedAt` flag on opportunities/clients + daily purge job (30 days).

## API routes (`app/api/capture/*`) — enforcement layer

`lib/capture/server-auth.ts`: `requireUser(req)` verifies `Authorization: Bearer <idToken>` via `adminAuth.verifyIdToken`, resolves team member via `teamMembers.firebaseUid`/email → `{ uid, teamMemberId, role, displayName }`; `requireAdmin` variant. Client pages send `auth.currentUser.getIdToken()` (new helper `lib/capture/api-client.ts`).

- `clients` GET/POST; `clients/[id]` GET/PATCH/DELETE — POST/PATCH/DELETE admin-only (doc §6); PATCH enforces rules 7–8 warning fields (computed server-side and returned, not blocking).
- `opportunities` GET (filters: client, stage, owner, type; team sees all but write-restricted)/POST — validates clientId exists (rule 1), dedupe `solicitationNumber+clientId` (rule 9), questionsDue < responseDue (rule 4).
- `opportunities/[id]` GET/PATCH/DELETE — PATCH: admin or `ownerId==caller`; writes audit entry (rule 11); DELETE = soft-delete `deletedAt` (rule 10).
- `opportunities/[id]/stage` POST `{ toStage, bidNoBid? }` — validates transition per boardType; blocks move past `bid-no-bid` without decision+reason (rule 2, admin only decides); blocks `submitted` without `submittedAt` + final-tagged file (rule 3); logs stage-change.
- `opportunities/[id]/tasks` GET/POST; `tasks/[id]` PATCH/DELETE — assignee notifications.
- `opportunities/[id]/notes`, `opportunities/[id]/files` — files: `POST` accepts multipart or signed upload to `capture/{oppId}/...` in Firebase Storage, tags enforced from settings list.
- `promote` POST `{ samSavedOpportunityId, clientId, ownerId }` — copies notice fields into new `captureOpportunity` (`source:"imported"`, `samNoticeId`), links back on the saved record.
- `import/sam-link` POST `{ url }` — parses noticeId from SAM.gov URL, fetches detail via existing `api/sam/opportunity/[id]` / `samApiClient`, returns prefilled opportunity draft.
- `export` POST — exceljs workbook of filtered opportunities (table view export; Phase 2 adds PDF via puppeteer-core print render).
- `scorecard` handled inside opportunity PATCH (saves score, suggestion, final decision, who/when, settings snapshot).
- `settings` GET/PATCH (admin; validates weights sum to 100%).
- `alerts/run` POST (cron, `CRON_SECRET`) — deadline 7/3/1-day alerts, task-assigned, due-date-changed, cert/SAM expiry 90/60/30, daily per-user digest → `sendEmail` + in-app notification docs.
- `match/run` POST (cron) — for each active `captureSavedSearch` (or default search): `searchOpportunities()` → score vs each capture client (NAICS 25 + set-aside eligibility 20 + keywords 25 + PSC 10 + target agency 10 + value/clearance 10, editable) → write `captureMatches` for score ≥ cutoff.
- `match` GET (pending queue); `match/[id]` POST `{action: accept|dismiss}` — accept creates `captureOpportunity` at stage `found`.
- `summarize` POST `{opportunityId|matchId}` — OpenAI (`createOpenAIClient`) summarizes description/attachments text → saved with "AI-generated – please check" label.
- `trash/purge` POST (cron) — hard-deletes docs with `deletedAt` > 30 days.
- `vercel.json`: add crons `GET /api/capture/alerts/run` daily, `/api/capture/match/run` `0 */6 * * *`, `/api/capture/trash/purge` daily.

## UI — `app/(portal)/portal/capture/*`

Shared components in `components/capture/` (new folder; pattern per `components/sam/`):
- `capture/` `dashboard` — recharts: pipeline-by-stage bar, won/lost donut, upcoming deadlines list; client filter.
- `clients` — list (search, sort); `clients/new` dialog; `clients/[id]` profile — company info, govcon fields, certifications w/ expiry warnings (rule 8), capability statements (Storage upload + version), past contracts, contacts, account manager.
- `board` — Kanban via `@hello-pangea/dnd`; columns from settings; card = title, client, sol#, due date chip (rule 6 colors: yellow ≤7d, red ≤3d, Overdue), owner avatar, warnings (rule 7 set-aside/cert mismatch badge, rule 8 expiry). Client + owner + type filters. Drag intercept: moving past Bid/No-Bid opens decision dialog (admin); moving to Submitted opens submit dialog requiring date + final file (rule 3). RFI/Sources-Sought cards render the short board (Found→Responding→Submitted→Closed) via `boardType`; "Convert to RFP" action creates standard-board opp.
- `opportunities/new` — full form OR "Import from SAM.gov link" (calls `import/sam-link`, prefills).
- `opportunities/[id]` — detail: all fields, dual-timezone deadline display (rule 5), bid/no-bid scorecard (Phase 2: must-have Yes/No gate → weighted 1–5 questions → total + suggestion vs final decision + reason, who/when saved), notes thread, files (upload/tag), tasks, links, activity timeline from `activities`.
- `table` — spreadsheet-style: sortable columns, filters, Excel export button (`api/capture/export`), row → detail.
- `calendar` — month view (react-day-picker style consistent w/ existing calendar page) showing questions-due + response-due events color-coded by client/stage; agency + local TZ on hover/detail.
- `tasks` — "My tasks" assigned to caller sorted by due date.
- `match-queue` — Phase 3: pending matches w/ score breakdown + AI summary → Accept (adds card) / Dismiss.
- `settings` — admin: all editable defaults (stages, dropdowns, colors, timings, match scoring, scorecard questions/weights/cutoffs).
- `solicitations` page: add "Promote to board" button → dialog to pick client + owner → `api/capture/promote`.

`components/portal/portal-sidebar.tsx`: new `captureManagement` section `{ label: "Capture Management", roles: ["admin","superadmin","team","team_member"] }` + items; added to `SECTIONS`, `openSections`, `ALL_NAV_ITEMS`, section renderer.

## Rule → implementation map (doc §5)

| # | Implementation |
|---|---|
| 1 client required | Zod schema + API validation |
| 2 gated Bid/No-Bid | `stage` route + board dialog; admin-only decision |
| 3 Submitted gate | `stage` route requires `submittedAt` + `final-submission`-tagged file |
| 4 date order | API validation on create/patch |
| 5 dual TZ | store `timezone`; `lib/capture/dates.ts` renders agency + local |
| 6 deadline colors | `lib/capture/deadline-status.ts` shared by board/table/calendar/dashboard |
| 7 cert mismatch warn | API computes `warnings[]` on opp load (client certs vs setAside map) |
| 8 SAM/cert 90-day warn | computed warnings + Phase 2 alerts |
| 9 dedupe | API POST checks `solicitationNumber+clientId` |
| 10 trash 30d | `deletedAt` soft-delete + `trash` UI + `trash/purge` cron |
| 11 audit | `lib/activity-logger.ts` extended EntityTypes; writes on every API mutation |

## Build order (phased, matching doc)

1. **Foundation**: schema types + `COLLECTIONS`, `server-auth`/`api-client` helpers, `dates`/`deadline-status`/`warnings` utils, CRUD APIs + audit, sidebar section.
2. **Phase 1 screens**: clients list/profile, board, opportunity detail, table+export, calendar, tasks, basic dashboard, promote-from-solicitations, trash.
3. **Phase 2**: scorecard UI + settings editor, alerts cron + daily digest, PDF/Excel reports.
4. **Phase 3**: SAM-link import, match/run cron, match queue UI, AI summaries, incumbent lookup (reuse usaspending), saved searches.

## Files to create/modify (high level)

- Modify: `lib/schema.ts` (CustomerDoc govcon + new Doc types + COLLECTIONS), `lib/activity-logger.ts` (entity types), `components/portal/portal-sidebar.tsx`, `app/(portal)/portal/solicitations/page.tsx` (promote button), `vercel.json` (crons), `firestore.indexes.json` (composite indexes for new queries).
- New: `lib/capture/*` (auth, api-client, types→ actually types in schema.ts, validation zod schemas, dates, deadline-status, warnings, match-score, excel export), `app/api/capture/**` (~15 routes), `app/(portal)/portal/capture/**` (~11 pages), `components/capture/*` (~15 components).

## Verification

- `npm run lint`, `npx tsc --noEmit`, `npm run build`
- Manual UAT against doc's "Phase 1 is done when" checklist (create client+files, add opp → board, gated drags, calendar TZ, notes/files/tasks, Excel export, team-only-assigned editing via preview role)
- API-level tests of rules 2/3/4/9 via curl/REST client with ID tokens; cron endpoints tested locally with `CRON_SECRET`.

## Risks / considerations

- **ID-token auth helper is a new pattern** (no existing route verifies tokens); fallback if `adminAuth` env not configured → dev-mode allow, logged loudly.
- **Two write paths**: existing pages write Firestore directly; capture module writes only via API — mixed but isolated to new collections.
- **`customers` doc size**: govcon block + embedded arrays keep docs well under 1MB; capability statement binaries live in Storage (paths only in doc).
- **Embedded notes/files arrays** bounded in practice; tasks are top-level for queryability.
- **SAM.gov endpoints are unofficial** (site's own API) — already used by existing integration; auto-find job must be tolerant of failures/rate limits.
- **2FA deferred** — flagged in delivery notes; "never log out on inactivity" honored by Firebase persistence default (browserLocalPersistence).
- **Cron frequency**: Vercel plan-dependent; 6-hour match cadence and daily alerts assumed available — adjust schedules if plan limits.

---

## Implementation status (completed)

All phases built. Verification results:

- `npx tsc --noEmit` — clean (0 errors)
- `npm run build` — compiled successfully; all 23 `/api/capture/*` routes + 12 `/portal/capture/*` pages registered
- `npx eslint` on all capture files — 0 problems (1191 problems elsewhere in repo are pre-existing tech debt)

Delivered:

- `lib/schema.ts` — `CustomerDoc.govcon` block + capture collections/types (`captureOpportunities`, `captureTasks`, `captureMatches`, `captureSavedSearches`, `captureSettings`, `captureAlertLog`)
- `lib/capture/` — server-auth (ID-token + role), api-client, stages/transitions, dual-TZ dates, deadline-status, warnings, zod validation, settings defaults, match-score, scorecard, excel exporter, audit, hooks, client-types
- API routes — clients CRUD, opportunities CRUD + `/stage` gated transitions, tasks/notes/files subroutes, promote, export (xlsx), settings, trash + purge, alerts/run, match + match/[id] + match/run, summarize (OpenAI), import/sam-link, searches CRUD
- Pages — dashboard, clients list/profile/new, Kanban board (dnd, dual board types, gated-move dialogs), opportunity new (SAM-link prefill)/detail (tabs: notes/files/tasks + stage mover + AI summary), table+export, calendar (dual-TZ), my-tasks, match-queue (accept/dismiss + run-now), settings editor, trash (admin)
- Integrations — sidebar "Capture Management" section, "To board" promote button on My Solicitations, activity-logger entity types, firestore.indexes.json composite indexes, storage.rules `capture/` paths, vercel.json crons (alerts daily, match-run 6h, trash-purge daily)

Not yet done (follow-ups): 2FA (deferred per decision), PDF report generator (Excel export shipped; PDF can reuse existing jsPDF dep), "Convert to RFP" quick action on RFI cards (stage route supports it via type change), Firestore index deployment (`firebase deploy --only firestore:indexes` needed), UAT against doc checklist with real pilot data.
