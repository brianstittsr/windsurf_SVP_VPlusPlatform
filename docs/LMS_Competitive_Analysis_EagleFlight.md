# LMS Competitive Analysis & Pricing Recommendation for David Ibarra (Eagle Flight Vertical Solutions)

**Prepared by:** Strategic Value+ (V+) Team  
**Date:** October 4, 2026  
**Purpose:** Comparative analysis of LMS platforms + V+ platform features, with recommended pricing tiers for white-label course hosting — informed by David Ibarra's inquiry regarding FAA Part 107 course migration.

---

## Executive Summary

David Ibarra, President of Eagle Flight Vertical Solutions, inquired about hosting his FAA Part 107 Remote Pilot course on V+'s white-labeled platform. He is currently under an agreement with another LMS provider but seeks to break away his Part 107 course. He also asked about pricing for military veterans.

This analysis compares five relevant LMS platforms against V+'s existing platform capabilities, evaluates the white-label LMS market, and proposes three pricing tiers specifically tailored for training content providers like Eagle Flight.

---

## Current Market Landscape: Top LMS Platforms for White-Label Course Hosting

| Platform | White-Label Starting Price | Key Strengths | Limitations |
|---|---|---|---|
| **Thinkific Plus** | ~$499+/mo (custom) | Strong course builder, community features, zero transaction fees on Plus | White-label only on higher tiers; no native mobile app |
| **Kajabi** | ~$143/mo (annual) | All-in-one marketing + courses, built-in email/funnels | Limited product count on lower tiers; clunky interface |
| **LearnWorlds** | $249/mo (Learning Center, annual) | Interactive video, branded mobile apps | Higher cost per feature set |
| **TalentLMS** | $828–$8,352/yr (20–1,000 users) | Fast setup, gamification, compliance focus | White-label costs 3–5x the base plan |
| **Teachable** | $39–$199/mo | Simple setup, international tax automation | Transaction fees on lower tiers |

### Market Pricing Patterns (White-Label LMS)

- **Self-serve creator platforms:** $49–$399/month for white-label
- **Enterprise LMS:** $150–$300+/month (per-seat or per-learner)
- **Branded mobile app add-on:** $150–$200/month (nearly universal hidden cost)
- **Aviation-specific LMS:** $119–$449/month (per active user models)
- **Perpetual license (self-hosted):** $5,000–$50,000+ annually
- **Pay-per-registered-learner:** $3.58–$4.46/user/month (volume discounts at scale)

> **Source:** Docebo, iSpring, TalentLMS, LearnWorlds, Kajabi, Thinkific, Teachable, Cypher Learning, Paradiso, ProProfs (pricing data aggregated from vendor sites and comparative reviews, March 2026)

---

## V+ Platform Feature Comparison

V+ is a Next.js 16 / Firebase B2B SaaS platform with 37 pages, 38 API routes, 25+ Firestore collections, and 10+ third-party integrations. While built primarily for manufacturing consulting and supply chain development, its white-label architecture and tool suite provide a strong foundation for repurposing as an LMS.

### V+ Existing Features Relevant to LMS Functionality

| Feature Category | V+ Capability | LMS Equivalent | Gap Analysis |
|---|---|---|---|
| **Authentication & User Management** | Firebase Auth with role-based access (admin/team/affiliate) | Standard in all LMS | ✅ V+ has robust auth; RBAC is basic but extensible |
| **Content Management** | CMS-controlled pages via Firestore (`siteContent` collection) with dynamic section rendering | Core CMS functionality | ⚠️ V+ CMS is marketing-focused; needs course-specific section types |
| **White-Label Branding** | Full branding context provider, logo/color/font config, dynamic metadata | Standard white-label feature | ✅ V+ has comprehensive white-label infrastructure |
| **Tool Suite / Modules** | Feature-flagged tools (Affiliates, Supplier Search, AI Workforce, Proposals, DocuSeal, etc.) | Modular LMS course/library access | ✅ V+ feature flagging is production-ready |
| **License Key System** | SoftwareKeyDoc schema: key generation, activation, tool access control, expiration | LMS license/tenant management | ✅ V+ key system maps to course access licensing |
| **Multi-Deployment** | WhiteLabelDeploymentDoc schema: per-tenant branding, domains, feature overrides | Multi-tenant LMS | ✅ V+ multi-deployment architecture is planned; partially incomplete |
| **Integration Hub** | MatterMost, DocuSeal, GoHighLevel, Apollo, Microsoft Graph, Mercury, OpenAI, Zoom | LMS integrations (Zoom, CRM, SSO) | ✅ V+ has broader integration coverage |
| **Pricing Model Support** | Subscription term toggle (6–60 months), real-time TCV calculation | Subscription billing | ⚠️ V+ has subscription logic in opportunities but no Stripe integration yet |
| **Document Signing** | DocuSign/DocuSeal integration for e-signatures | Certificate issuance, agreement signing | ✅ V+ can issue/signature-gate certificates |
| **AI Tools** | OpenAI-powered chat (IntellEDGE), LinkedIn content, image generation, transcription, translation | AI course generation, content repurposing | ✅ V+ AI tools exceed typical LMS capabilities |
| **Analytics Dashboard** | Planned; currently missing | LMS reporting/analytics | ❌ Gap — no usage analytics or learner progress tracking |
| **Course Authoring** | Not present | Built-in course builder | ❌ Gap — would need LMS-specific authoring module |
| **Progress Tracking & Certification** | Not present | Core LMS feature | ❌ Gap — would need learner progress, quiz scoring, certificates |
| **Mobile App** | Not present | Standard or add-on | ❌ Gap — no native mobile app |
| **SCORM/xAPI Support** | Not present | Standard LMS content format | ❌ Gap — no SCORM import/export |

### Key Insight

The V+ platform has **strong foundational capabilities** for white-label SaaS (branding, auth, multi-tenant architecture, integration hub, license key system) but lacks **core LMS-specific functionality**: course creation, progress tracking, quizzes, certification, and analytics. Adding an LMS module to the existing platform leverages the white-label infrastructure already built.

---

## Competitive Positioning vs. LMS Platforms

| Platform | White-Label | Course Builder | Mobile App | Analytics | Pricing (Annual) | V+ Differentiation |
|---|---|---|---|---|---|---|
| **Thinkific Plus** | ✅ (higher tier) | ✅ Excellent | ❌ Add-on ($199/mo) | ⚠️ Limited | ~$5,988+ | V+: stronger white-label infra, broader integrations |
| **Kajabi** | ⚠️ Limited | ✅ Good | ✅ Included | ⚠️ Basic | $1,716–$5,988 | V+: manufacturing focus, AI tools, supply chain context |
| **LearnWorlds** | ✅ (higher tier) | ✅ Interactive video | ✅ Included | ✅ Good | $2,988+ | V+: lower base cost potential, existing integrations |
| **TalentLMS** | ✅ (higher tier) | ✅ Good | ✅ Included | ✅ Good | $828–$8,352 | V+: better customization, manufacturing-specific use cases |
| **Teachable** | ⚠️ Limited | ✅ Good | ✅ Included | ⚠️ Basic | $468–$2,388 | V+: no transaction fees, better B2B features |
| **V+ Platform** | ✅ Built-in | ❌ Not yet built | ❌ Not yet built | ❌ Not yet built | Proposed below | V+: manufacturing ecosystem, white-label ready, AI-powered |

---

## Proposed V+ LMS Pricing Tiers for Training Content Providers

Based on the competitive analysis above, market positioning, and V+'s existing white-label infrastructure, here are three recommended pricing tiers:

### Tier 1: Solo Creator / Small Instructor ($49/month)
**Target:** Individual instructors, small training businesses (like Eagle Flight initially)

| Feature | Included |
|---|---|
| **White-label branding** | ✅ Custom domain, logo, colors |
| **Course limit** | Up to 5 courses |
| **Student limit** | Up to 250 active learners |
| **Course builder** | ✅ Drag-and-drop modules, video embedding, quizzes (50 questions per course) |
| **Progress tracking** | ✅ Basic completion tracking |
| **Certificates** | ✅ Auto-generated upon completion |
| **Mobile access** | ✅ Responsive web (no native app) |
| **Integrations** | Email notifications, Zapier, Zoom |
| **Support** | Email support, 48hr response |
| **Setup fee** | ❌ Waived for online signup |

### Tier 2: Professional / Growing Business ($199/month)
**Target:** Established training providers, SMEs with multiple instructors

| Feature | Included |
|---|---|
| **Course limit** | Unlimited courses |
| **Student limit** | Up to 2,500 active learners |
| **Course builder** | ✅ Advanced builder, SCORM import, drip scheduling |
| **Progress tracking** | ✅ Detailed tracking + export |
| **Quizzes & Assessments** | ✅ Unlimited, question banks, timed quizzes |
| **Certificates** | ✅ Custom certificate templates, branded PDF |
| **Mobile app** | ✅ Branded mobile app add-on ($79/mo) |
| **E-commerce** | ✅ Course marketplace, coupon codes, affiliate commissions |
| **Veteran pricing** | ✅ Special rate available (see below) |
| **Integrations** | All Tier 1 + SSO (SAML/OAuth), CRM, LMS integrations |
| **Support** | Priority email, chat support, 24hr response |
| **Setup fee** | ❌ Waived |

### Tier 3: Enterprise / Military/Veteran Program ($499+/month)
**Target:** Large organizations, government agencies, military veteran training programs, enterprise-wide deployment

| Feature | Included |
|---|---|
| **Multi-tenant** | ✅ Separate branded portals for sub-organizations |
| **Student limit** | Unlimited active learners |
| **Course builder** | ✅ Advanced + custom development, API access |
| **Veteran/Military discount** | ✅ 25–40% off any tier (see Special Pricing section) |
| **Progress tracking** | ✅ Advanced analytics dashboard, real-time reporting |
| **Assessments** | ✅ Proctoring support, advanced question types |
| **Mobile app** | ✅ Native iOS/Android branded apps |
| **E-commerce** | ✅ Full marketplace, B2B bulk enrollment, invoicing |
| **Custom domain** | ✅ Multiple custom domains |
| **API access** | ✅ Full REST API, webhook support |
| **Data export** | ✅ Full data export, SCORM/xAPI |
| **Compliance** | SOC 2, GDPR-ready, accessibility (WCAG 2.1) |
| **Support** | ✅ Dedicated account manager, 24/7 support, SLA |
| **Setup fee** | Waived for annual commitment; $1,500 for monthly |

---

## Special Pricing: Military Veterans & Veteran-Owned Businesses

**Context:** David Ibarra asked about military veteran pricing. This aligns with V+'s broader economic development and workforce development focus.

| Discount Category | Discount | Applies To | Notes |
|---|---|---|---|
| **Veteran-owned businesses** | 30% off any tier (annual billing) | Monthly or annual plans | Proof of veteran ownership required (DD-214 or business registration) |
| **Veteran instructors** | 25% off Pro tier | Tier 2 ($199 → $149/month) | For individual veteran instructors transitioning to civilian training careers |
| **Military transition programs** | 40% off Enterprise tier | Tier 3 ($499 → $299/month) | For DoD transition programs, base education centers, VR&E chapters |
| **Group enrollment (25+ veterans)** | Custom pricing | Volume discounts available | Contact sales for custom cohort pricing |

---

## Addressing David Ibarra's Specific Scenario

### David's Situation:
- President, Eagle Flight Vertical Solutions
- Currently under agreement with another LMS (not white-labeled)
- Wants to migrate FAA Part 107 course to V+'s white-labeled platform
- May move additional courses later
- Asked about veteran pricing

### Recommended Approach:

1. **Start with Tier 1 ($49/month)** — Hosts Part 107 course with up to 250 students
   - White-label under Eagle Flight brand
   - FAA Part 107 course content uploaded via course builder
   - Progress tracking + completion certificates
   - Responsive web access for students

2. **Upgrade path built-in** — As David adds more courses (beyond 5) or exceeds 250 active students, automatically qualifies for Tier 2 ($199/month)

3. **Veteran pricing available** — If David qualifies as a veteran-owned business or serves veteran students, he receives 30% off any tier

4. **Migration support** — Offer optional migration service ($499 one-time) to move existing Part 107 content from his current LMS to V+

### Why V+ Over Competitors for David:
| Factor | V+ | Thinkific | Kajabi | TalentLMS |
|---|---|---|---|---|
| White-label from entry tier | ✅ Yes ($49) | ❌ Plus tier (~$500) | ⚠️ Limited ($143) | ❌ Higher tier ($828+) |
| No transaction fees | ✅ Yes | ✅ Yes (Plus) | ✅ Yes | ✅ Yes |
| FAA Part 107 course fit | ✅ Regulatory training focus | General purpose | Marketing-focused | Compliance-friendly |
| Military/veteran pricing | ✅ Explicit program | ❌ Not specified | ❌ Not specified | ⚠️ Ask sales |
| Migration support | ✅ Offered | ⚠️ Self-service | ⚠️ Self-service | ⚠️ Self-service |
| Manufacturing ecosystem | ✅ Aligned | ❌ | ❌ | ❌ |

---

## Implementation Roadmap for V+ LMS Module

To deliver the proposed pricing tiers, the following LMS capabilities need to be added to the V+ platform:

| Priority | Feature | Estimated Effort | Revenue Impact |
|---|---|---|---|
| **P0** | Course builder (modules, lessons, quizzes, certificates) | 2–3 weeks | Enables Tier 1 launch |
| **P0** | Learner progress tracking + completion certificates | 1–2 weeks | Enables certification delivery |
| **P0** | Stripe integration + subscription billing | 1–2 weeks | Enables revenue collection |
| **P1** | Pricing page with tier comparison | 2 days | Enables self-service signup |
| **P1** | Veteran discount code system | 3 days | Captures veteran market |
| **P2** | Branded mobile app (React Native wrapper) | 3–4 weeks | Supports Tier 2 upgrade |
| **P2** | SCORM/xAPI import/export | 2–3 weeks | Supports enterprise migration |
| **P2** | Analytics dashboard (learner progress, revenue) | 2 weeks | Enables data-driven decisions |
| **P3** | Multi-tenant LMS portals | 4+ weeks | Supports Tier 3 enterprise |
| **P3** | Native iOS/Android apps | 6+ weeks | Full Tier 3 support |

---

## Recommendations

1. **Respond to David Ibarra** with the Tier 1 starting offer ($49/month) and mention the veteran discount program explicitly. Frame the value proposition around "regulatory training platform" rather than general LMS — this aligns with V+'s manufacturing/quality certification focus and FAA Part 107 is a regulated certification just like ISO/AS9100.

2. **Build the LMS module** as a new feature-flagged tool within the existing V+ platform, leveraging the white-label architecture already in place. The course builder and progress tracking are the two highest-priority development items.

3. **Launch with a limited beta** — Offer David early access at a discounted beta rate ($29/month) in exchange for feedback and a case study. This reduces risk and provides social proof.

4. **Position as "training infrastructure for regulated industries"** — V+'s existing strength in manufacturing, ISO certification, and supply chain compliance maps directly to regulated training environments (FAA, OSHA, safety, quality). This is a defensible niche versus generic LMS platforms.

5. **Bundle with existing V+ tools** — Offer LMS + Affiliate Network + DocuSeal + AI IntellEDGE as a bundled package for training providers who also need business management tools.

---

## Appendix: Source Documents Reviewed

- `docs/BusinessAnalysis_Dec2025_v2.md` — V+ platform capabilities and monetization gaps
- `docs/BusinessAnalysis_Dec2025.md` — Platform metrics and feature inventory
- `docs/WHITE_LABEL_TEMPLATE_PROMPT.md` — White-label architecture and pricing schema
- `docs/SVP_OEM_Acquisition_Funnel.md` — Client acquisition strategy
- `docs/SVP_Niche_Definition.md` — Market positioning and manufacturing focus
- `docs/SVP_Strategic_Plan.md` — BHAG and growth strategy
- `docs/SizeSummary.md` — Development roadmap and priorities
- `app/onboarding/client/page.tsx` — Client onboarding with training program selection
- Docebo: "22 Best Learning Management Systems in 2025"
- iSpring: "White Label LMS Platforms" comparison
- Kourses.com: "8 Best White Label LMS and Course Platforms"
- Blend-Ed: "White Label LMS Pricing for Academies"
- Thinkific: "Top 10 Online Learning Platforms for 2025"
- Albato: "Top 6 Learning Management Systems"
- TheDroneU: "FAA Part 107 Drone License Cost" blog

---

*Prepared for follow-up email response to David Ibarra. Last updated: October 4, 2026.*