/**
 * Demo seed data for the AC1 — FAA Part 107 Remote Pilot Certification
 * Preparation course. Every document created is tagged with
 * `demoSeed: "ac1-demo"` so it can be removed cleanly from the admin
 * Demo Data page.
 *
 * Seeded content:
 *  - 1 published native course (AC1)
 *  - 6 lesson modules with rich HTML content (Unsplash/Pexels imagery)
 *  - 5 section quizzes (one after each content section)
 *  - 1 final exam question bank
 *  - 6 mock students, enrollments, lesson progress, exam attempts,
 *    and completion certificates
 */

import { randomBytes } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import type { QuizQuestion } from "./schema";

const COLLECTIONS = {
  TEAM_MEMBERS: "teamMembers",
  COURSES: "courses",
  COURSE_MODULES: "courseModules",
  QUESTION_BANKS: "questionBanks",
  ENROLLMENTS: "enrollments",
  LESSON_PROGRESS: "lessonProgress",
  EXAM_ATTEMPTS: "examAttempts",
  CERTIFICATES: "certificates",
} as const;

function generateCertificateNumber(): string {
  return `EFVS-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export const AC1_DEMO_TAG = "ac1-demo";

export interface SeedResult {
  created: boolean;
  message: string;
  counts: Record<string, number>;
}

const img = (url: string) => `${url}?auto=format&fit=crop&w=1200&q=80`;

const lesson = (
  imageUrl: string,
  imageAlt: string,
  body: string
): string => `
<img src="${imageUrl}" alt="${imageAlt}" style="width:100%;border-radius:0.5rem;margin-bottom:1rem;" />
${body}`;

const li = (items: string[]) =>
  `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

const q = (
  id: string,
  question: string,
  options: string[],
  correctIndex: number,
  explanation?: string
): QuizQuestion => ({ id, question, options, correctIndex, explanation });

// ============================================================================
// Course + module + question bank content
// ============================================================================

const MODULES: {
  title: string;
  description: string;
  contentHtml: string;
}[] = [
  {
    title: "Regulations & Remote Pilot Requirements",
    description:
      "14 CFR Part 107 scope, pilot eligibility, registration, and operating rules.",
    contentHtml: lesson(
      img("https://images.unsplash.com/photo-1473968512647-3e447244af8f"),
      "Drone flying over terrain",
      `<p>To fly a small unmanned aircraft system (sUAS) for compensation or hire, the pilot must hold a <strong>Remote Pilot Certificate</strong> issued under <strong>14 CFR Part 107</strong>. Recreational-only flyers follow different rules and must pass the TRUST test.</p>
<h4>Eligibility</h4>
${li([
  "Be at least 16 years old",
  "Read, speak, write, and understand English",
  "Pass the initial aeronautical knowledge exam at an FAA-approved testing center",
  "Complete FAA recurrent online training every 24 calendar months",
])}
<h4>Core Operating Rules</h4>
${li([
  "Maximum altitude: 400 feet AGL (or within 400 ft of a structure)",
  "Visual line of sight (VLOS) at all times",
  "Daylight operations unless anti-collision lighting or a waiver applies",
  "Maximum groundspeed: 87 knots (100 mph)",
  "Yield right of way to all manned aircraft",
  "No operations over people or moving vehicles unless compliant with §107 categories or a waiver",
])}
<p>Aircraft between <strong>0.55 lb (250 g) and 55 lb</strong> must be registered. Registrants receive a number that must be marked on the aircraft.</p>`
    ),
  },
  {
    title: "Airspace & Airport Operations",
    description:
      "Classes of airspace, controlled-airspace authorization, and LAANC.",
    contentHtml: lesson(
      img("https://images.unsplash.com/photo-1436491865332-7a61a109cc05"),
      "Aircraft in flight near controlled airspace",
      `<p>Understanding where your sUAS may fly begins with the <strong>National Airspace System (NAS)</strong>. Airspace is divided into classes A through G; drone pilots mainly deal with classes B, C, D, E, and G.</p>
<h4>Quick Reference</h4>
${li([
  "Class G (uncontrolled): operations permitted without prior authorization, subject to Part 107 limits",
  "Class B/C/D/E (controlled): require FAA airspace authorization before operating",
  "LAANC provides near-real-time authorization at participating airports",
  "Sectional charts identify airspace boundaries, altitudes, and special-use areas",
  "Restricted, prohibited, MOA, and TFR areas impose additional limits",
])}
<h4>Authorizations vs. Waivers</h4>
<p>An <strong>airspace authorization</strong> grants access to controlled airspace; a <strong>waiver</strong> relieves a specific Part 107 operational rule (e.g., night ops). They are requested separately through the FAA DroneZone portal or LAANC.</p>`
    ),
  },
  {
    title: "Aviation Weather & Weather Sources",
    description:
      "METARs, TAFs, weather briefings, visibility and density altitude.",
    contentHtml: lesson(
      img("https://images.unsplash.com/photo-1534088568595-a066f410bcda"),
      "Storm clouds building over a field",
      `<p>Remote pilots must evaluate weather before and during flight. The exam expects you to read <strong>METAR</strong> aviation routine weather reports and <strong>TAF</strong> terminal aerodrome forecasts.</p>
<h4>Key Concepts</h4>
${li([
  "METAR: coded surface observation issued hourly (e.g., wind, visibility, ceiling, temperature/dewpoint, altimeter)",
  "TAF: 24-30 hour forecast for the area within ~5 statute miles of an airport",
  "Standard visibility minimum: 3 statute miles; cloud clearance 500 ft below / 2,000 ft horizontal",
  "Density altitude rises with heat and elevation — reduces lift and prop efficiency",
  "Wind shear and microbursts are critical near thunderstorms",
])}
<h4>Sources</h4>
<p>Use an official weather briefing (1800wxbrief.com or Flight Service), aviationweather.gov, and approved apps. Verify NOTAMs and TFRs for the operating area before every mission.</p>`
    ),
  },
  {
    title: "Loading, Performance & Emergency Procedures",
    description:
      "Weight and balance, battery management, lost link, and flyaways.",
    contentHtml: lesson(
      img("https://images.unsplash.com/photo-1508444845599-5c89863b1c44"),
      "Quadcopter being prepared for flight",
      `<p>sUAS performance depends on weight, center of gravity, battery state, temperature, and wind. Overloading shortens endurance and degrades handling.</p>
<h4>Loading & Performance</h4>
${li([
  "Keep the total weight under 55 lb including payload",
  "Follow the manufacturer's center-of-gravity limits",
  "Cold temperatures reduce lithium battery capacity significantly",
  "Heavier payloads reduce flight time and climb performance",
])}
<h4>Emergency Procedures</h4>
${li([
  "Lost link: most sUAS execute a return-to-home or hover — know your platform's behavior",
  "Flyaway: note heading/altitude, notify ATC if near controlled airspace",
  "Low battery: land immediately at the nearest safe location",
  "Incident reporting: certain accidents must be reported to the FAA within 10 days",
])}`
    ),
  },
  {
    title: "Crew Resource Management, Physiology & Maintenance",
    description:
      "VLOS observers, fatigue, medications, and aircraft maintenance.",
    contentHtml: lesson(
      img("https://images.pexels.com/photos/442587/pexels-photo-442587.jpeg"),
      "Drone operator with controller and spotter",
      `<p>A remote pilot may use a <strong>visual observer (VO)</strong> to help maintain situational awareness. The remote pilot in command (RPIC) retains final authority and responsibility.</p>
<h4>Crew Resource Management</h4>
${li([
  "Brief the mission, hazards, and roles before launch",
  "Use standardized callouts and closed-loop communication",
  "The VO scans for traffic and obstacles — the RPIC keeps command authority",
])}
<h4>Physiology</h4>
${li([
  "Fatigue, stress, and illness degrade judgment — apply IMSAFE before flying",
  "Some medications (including OTC antihistamines) impair performance",
  "Night vision degrades quickly — allow ~30 minutes for dark adaptation",
])}
<h4>Maintenance</h4>
<p>Follow the manufacturer's inspection schedule, log discrepancies, and never fly aircraft with damaged props, swollen batteries, or firmware faults.</p>`
    ),
  },
  {
    title: "Night Operations, Remote ID & Waivers",
    description:
      "Night currency, Remote ID requirements, and the waiver process.",
    contentHtml: lesson(
      img("https://images.unsplash.com/photo-1504198458649-3128b932f49e"),
      "Drone silhouette at dusk",
      `<p>Since the 2021 rule update, Part 107 allows <strong>night operations without a waiver</strong> when the aircraft has anti-collision lighting visible for at least 3 statute miles and the pilot has completed updated training.</p>
<h4>Remote ID</h4>
${li([
  "Most drones must broadcast identification and location information",
  "Standard Remote ID is built-in; older aircraft can add a broadcast module",
  "FRIA areas allow operations without Remote ID under club rules",
])}
<h4>Waivers</h4>
${li([
  "Request waivers through FAA DroneZone — common requests: night, beyond VLOS, ops over people",
  "Provide a detailed safety case and procedures",
  "Allow up to 90 days for FAA processing",
])}`
    ),
  },
];

interface QuizSpec {
  moduleIndex: number;
  title: string;
  questions: QuizQuestion[];
}

const SECTION_QUIZZES: QuizSpec[] = [
  {
    moduleIndex: 0,
    title: "Section 1 Quiz — Regulations",
    questions: [
      q(
        "s1q1",
        "What is the minimum age to obtain a Remote Pilot Certificate under Part 107?",
        ["14", "16", "18", "21"],
        1,
        "14 CFR §107.61 — a person must be at least 16 years old."
      ),
      q(
        "s1q2",
        "The maximum altitude for Part 107 operations (absent a waiver or structure exception) is:",
        ["200 feet AGL", "400 feet AGL", "500 feet AGL", "1,000 feet AGL"],
        1,
        "§107.51(b) limits sUAS operations to 400 feet AGL, or within 400 feet of a structure."
      ),
      q(
        "s1q3",
        "A small UAS that weighs more than ______ must be registered with the FAA.",
        ["0.25 lb", "0.55 lb (250 g)", "5 lb", "10 lb"],
        1,
        "Registration is required for aircraft between 0.55 lb and 55 lb."
      ),
      q(
        "s1q4",
        "How often must a remote pilot complete recurrent training to keep Part 107 privileges current?",
        ["Every 6 months", "Every 12 months", "Every 24 calendar months", "Every 36 months"],
        2,
        "Recurrent online training is required every 24 calendar months."
      ),
      q(
        "s1q5",
        "During sUAS operations, right-of-way must always be yielded to:",
        ["Other drones", "Manned aircraft", "Helicopters only", "No one"],
        1,
        "§107.37 — sUAS must yield to all manned aircraft."
      ),
    ],
  },
  {
    moduleIndex: 1,
    title: "Section 2 Quiz — Airspace",
    questions: [
      q(
        "s2q1",
        "In which airspace may a remote pilot operate without prior FAA authorization?",
        ["Class B", "Class C", "Class D", "Class G"],
        3,
        "Class G is uncontrolled — no authorization required (subject to other Part 107 rules)."
      ),
      q(
        "s2q2",
        "LAANC provides:",
        [
          "Medical certification",
          "Near-real-time airspace authorizations at participating airports",
          "Aircraft registration",
          "Weather briefings",
        ],
        1
      ),
      q(
        "s2q3",
        "An airspace authorization and an operational waiver are:",
        [
          "The same document",
          "Two separate approvals requested through different criteria",
          "Only needed for recreational flights",
          "Automatically granted by LAANC",
        ],
        1,
        "Authorizations grant airspace access; waivers relieve specific operating rules."
      ),
      q(
        "s2q4",
        "A Temporary Flight Restriction (TFR) is found by checking:",
        ["Sectional chart legend", "NOTAMs", "The METAR", "The aircraft manual"],
        1,
        "TFRs are published via NOTAM — always check before flight."
      ),
      q(
        "s2q5",
        "On a sectional chart, Class B airspace is depicted by:",
        ["Solid blue lines", "Dashed magenta lines", "Solid magenta lines", "Dashed blue lines"],
        0,
        "Class B is shown with solid blue lines; Class C with solid magenta."
      ),
    ],
  },
  {
    moduleIndex: 2,
    title: "Section 3 Quiz — Weather",
    questions: [
      q(
        "s3q1",
        "A METAR reports weather that is:",
        ["A forecast", "An hourly surface observation", "A radar summary", "A satellite image"],
        1
      ),
      q(
        "s3q2",
        "The minimum flight visibility for most Part 107 operations is:",
        ["1 statute mile", "3 statute miles", "5 statute miles", "10 statute miles"],
        1,
        "§107.51 — minimum visibility is 3 statute miles."
      ),
      q(
        "s3q3",
        "Cloud clearance requirements for sUAS are:",
        [
          "Clear of clouds",
          "500 ft below, 1,000 ft above, 2,000 ft horizontal",
          "500 ft below, 2,000 ft horizontal",
          "1,000 ft below, 500 ft above",
        ],
        2,
        "500 ft below the cloud and 2,000 ft horizontally; sUAS may not fly above clouds."
      ),
      q(
        "s3q4",
        "Density altitude increases when:",
        [
          "Temperature decreases",
          "Temperature and elevation increase",
          "Humidity decreases",
          "Barometric pressure rises",
        ],
        1,
        "Hot, high, humid conditions raise density altitude and reduce performance."
      ),
      q(
        "s3q5",
        "A TAF covers a forecast area of approximately:",
        ["5 statute miles around the airport", "50 miles", "The entire state", "200 miles"],
        0
      ),
    ],
  },
  {
    moduleIndex: 3,
    title: "Section 4 Quiz — Loading & Emergencies",
    questions: [
      q(
        "s4q1",
        "The maximum weight for a Part 107 aircraft, including payload, is:",
        ["25 lb", "55 lb", "75 lb", "100 lb"],
        1
      ),
      q(
        "s4q2",
        "Cold temperatures primarily affect sUAS operations by:",
        [
          "Increasing battery capacity",
          "Reducing battery capacity and flight time",
          "Improving motor efficiency",
          "No effect",
        ],
        1
      ),
      q(
        "s4q3",
        "If control link is lost, most sUAS will:",
        [
          "Immediately descend",
          "Continue the last command indefinitely",
          "Execute a pre-programmed lost-link behavior such as return-to-home",
          "Land wherever they are",
        ],
        2
      ),
      q(
        "s4q4",
        "Certain sUAS accidents must be reported to the FAA within:",
        ["24 hours", "48 hours", "10 days", "30 days"],
        2,
        "§107.9 — report qualifying accidents within 10 days."
      ),
      q(
        "s4q5",
        "Adding payload weight generally:",
        [
          "Increases flight time",
          "Reduces flight time and climb performance",
          "Has no effect on performance",
          "Improves stability",
        ],
        1
      ),
    ],
  },
  {
    moduleIndex: 4,
    title: "Section 5 Quiz — CRM, Physiology & Maintenance",
    questions: [
      q(
        "s5q1",
        "The visual observer's primary role is to:",
        [
          "Control the aircraft",
          "Scan for air traffic and hazards to assist the RPIC",
          "File the flight plan",
          "Manage the camera",
        ],
        1
      ),
      q(
        "s5q2",
        "Final authority and responsibility for the flight rests with the:",
        ["Visual observer", "Remote pilot in command", "Client", "Manufacturer"],
        1
      ),
      q(
        "s5q3",
        "IMSAFE is a checklist for:",
        [
          "Maintenance items",
          "Airspace classes",
          "Personal readiness (illness, medication, stress, alcohol, fatigue, emotion)",
          "Weather briefing",
        ],
        2
      ),
      q(
        "s5q4",
        "Dark adaptation for night vision takes approximately:",
        ["5 minutes", "10 minutes", "30 minutes", "2 hours"],
        2
      ),
      q(
        "s5q5",
        "A swollen lithium battery should be:",
        [
          "Used for one more short flight",
          "Charged overnight",
          "Removed from service and disposed of per manufacturer guidance",
          "Punctured and drained",
        ],
        2
      ),
    ],
  },
];

const FINAL_EXAM: QuizQuestion[] = [
  q(
    "fe1",
    "The remote PIC wants to fly over a concert with an unshielded drone. This requires:",
    [
      "Nothing — concerts are fine",
      "A §107.39 waiver or compliance with an operations-over-people category",
      "Verbal permission from the venue",
      "A Class B authorization",
    ],
    1,
    "Operations over people require meeting OOP categories or a waiver."
  ),
  q("fe2", "Night flight without a waiver requires:", [
    "A visual observer",
    "Anti-collision lighting visible for 3 statute miles and updated training",
    "A strobe on the launch pad",
    "ATC clearance",
  ], 1),
  q("fe3", "Maximum groundspeed under Part 107 is:", [
    "50 knots", "75 knots", "87 knots (100 mph)", "120 knots",
  ], 2),
  q(
    "fe4",
    "Which is required to fly in Class D airspace?",
    [
      "An FAA airspace authorization",
      "A recreational TRUST certificate",
      "A pilot's license",
      "No approval needed",
    ],
    0
  ),
  q(
    "fe5",
    "Remote ID broadcasts:",
    [
      "Video feed",
      "Identification and location information",
      "Telemetry for the FAA only",
      "The pilot's phone number",
    ],
    1
  ),
  q(
    "fe6",
    "Before flight in controlled airspace via LAANC, authorization is typically:",
    [
      "Received in near-real-time",
      "Mailed within 90 days",
      "Granted verbally by ATC",
      "Impossible for drones",
    ],
    0
  ),
  q(
    "fe7",
    "A METAR '18008KT' indicates wind from:",
    [
      "080° at 18 knots",
      "180° at 8 knots",
      "180° at 8 mph",
      "008° at 180 knots",
    ],
    1
  ),
  q(
    "fe8",
    "When a visual observer is used, communication must be:",
    [
      "Written down",
      "Effective enough to keep the aircraft in VLOS",
      "Through an app only",
      "Not required",
    ],
    1
  ),
  q(
    "fe9",
    "Operations over a moving vehicle on a public road generally require:",
    [
      "A waiver or qualifying category compliance",
      "A police escort",
      "Nothing extra",
      "A Class E authorization",
    ],
    0
  ),
  q(
    "fe10",
    "Pre-flight action required by §107.49 includes:",
    [
      "Only charging the battery",
      "Assessing the operating environment, hazards, and ensuring the aircraft is safe",
      "Filing a flight plan with ATC",
      "Calling the tower",
    ],
    1
  ),
  q(
    "fe11",
    "A student forgets recurrent training is due. Their privileges:",
    [
      "Continue forever",
      "Lapse until recurrent training is completed",
      "Are revoked permanently",
      "Transfer automatically",
    ],
    1
  ),
  q(
    "fe12",
    "Flying under the influence of alcohol or drugs is:",
    [
      "Allowed under 0.04%",
      "Prohibited — 8 hours bottle-to-throttle and .04 BAC limit",
      "Allowed if below 400 ft",
      "Permitted with a VO",
    ],
    1
  ),
];

// ============================================================================
// Mock learners
// ============================================================================

const STUDENTS = [
  { firstName: "Jordan", lastName: "Hayes", email: "jordan.hayes@example.com", veteran: true },
  { firstName: "Casey", lastName: "Rivera", email: "casey.rivera@example.com", veteran: false },
  { firstName: "Morgan", lastName: "Okafor", email: "morgan.okafor@example.com", veteran: false },
  { firstName: "Riley", lastName: "Nguyen", email: "riley.nguyen@example.com", veteran: true },
  { firstName: "Avery", lastName: "Thompson", email: "avery.thompson@example.com", veteran: false },
  { firstName: "Skyler", lastName: "Martinez", email: "skyler.martinez@example.com", veteran: false },
];

// completion plan per student: [modulesCompleted, quizScores{moduleIdx:score}, finalScore|null]
const PLAN: {
  modules: number[];
  quizScores: Record<number, number>;
  finalScore: number | null;
  status: "completed" | "active";
  percent: number;
}[] = [
  { modules: [0, 1, 2, 3, 4, 5], quizScores: { 0: 100, 1: 80, 2: 100, 3: 80, 4: 100 }, finalScore: 92, status: "completed", percent: 100 },
  { modules: [0, 1, 2, 3, 4, 5], quizScores: { 0: 80, 1: 100, 2: 80, 3: 100, 4: 80 }, finalScore: 85, status: "completed", percent: 100 },
  { modules: [0, 1, 2, 3, 4, 5], quizScores: { 0: 100, 1: 60, 2: 80, 3: 80, 4: 60 }, finalScore: 81, status: "completed", percent: 100 },
  { modules: [0, 1, 2], quizScores: { 0: 80, 1: 80, 2: 60 }, finalScore: null, status: "active", percent: 50 },
  { modules: [0], quizScores: { 0: 100 }, finalScore: null, status: "active", percent: 17 },
  { modules: [], quizScores: {}, finalScore: null, status: "active", percent: 0 },
];

const DEMO_COLLECTIONS = [
  COLLECTIONS.TEAM_MEMBERS,
  COLLECTIONS.COURSES,
  COLLECTIONS.COURSE_MODULES,
  COLLECTIONS.QUESTION_BANKS,
  COLLECTIONS.ENROLLMENTS,
  COLLECTIONS.LESSON_PROGRESS,
  COLLECTIONS.EXAM_ATTEMPTS,
  COLLECTIONS.CERTIFICATES,
] as const;

async function alreadySeeded(): Promise<boolean> {
  if (!adminDb) return false;
  const snap = await adminDb.collection(COLLECTIONS.COURSES).where("code", "==", "AC1").limit(1).get();
  return !snap.empty;
}

/** Remove demo roster and grade records without deleting an imported catalog course. */
export async function removeAc1DemoData(): Promise<Record<string, number>> {
  if (!adminDb) return {};
  const importedCourses = await adminDb.collection(COLLECTIONS.COURSES)
    .where("demoSeed", "==", AC1_DEMO_TAG)
    .where("importedFrom", "==", "EFVS_Student_Registration_Form_Rev2_2026-10-04")
    .get();
  const protectedCourseIds = new Set(importedCourses.docs.map((document) => document.id));
  const counts: Record<string, number> = {};
  let preservedCourseContent = 0;
  for (const col of DEMO_COLLECTIONS) {
    const snap = await adminDb.collection(col).where("demoSeed", "==", AC1_DEMO_TAG).get();
    const batch = adminDb.batch();
    let deleted = 0;
    for (const document of snap.docs) {
      const preservesLinkedContent = col === COLLECTIONS.COURSE_MODULES || col === COLLECTIONS.QUESTION_BANKS;
      const preserve = (col === COLLECTIONS.COURSES && protectedCourseIds.has(document.id))
        || (preservesLinkedContent && protectedCourseIds.has(String(document.get("courseId") || "")));
      if (preserve) {
        preservedCourseContent++;
      } else {
        batch.delete(document.ref);
        deleted++;
      }
    }
    if (deleted > 0) await batch.commit();
    counts[col] = deleted;
  }
  counts.preservedCourseContent = preservedCourseContent;
  return counts;
}

/** Seed the full AC1 demo course + mock students/grades/certificates. */
export async function seedAc1DemoData(adminId: string): Promise<SeedResult> {
  if (!adminDb) {
    return {
      created: false,
      message: "Firebase is not configured.",
      counts: {},
    };
  }
  if (await alreadySeeded()) {
    return {
      created: false,
      message: "An AC1 catalog course already exists. Use the existing course or archive it before creating another demo copy.",
      counts: {},
    };
  }

  const now = Timestamp.now();
  const counts: Record<string, number> = {};

  // --- Course ---------------------------------------------------------------
  const courseRef = await adminDb.collection(COLLECTIONS.COURSES).add({
    code: "AC1",
    title: "FAA Part 107 Remote Pilot Certification Preparation",
    description:
      "Self-paced preparation for the FAA Part 107 aeronautical knowledge exam. Covers regulations, airspace, weather, loading and performance, crew resource management, and operations — with a section quiz after each lesson and a randomized final examination.",
    format: "native",
    priceCents: 14900,
    imageUrl: "/images/part107.jpg",
    published: true,
    passingScore: 80,
    maxAttempts: 3,
    demoSeed: AC1_DEMO_TAG,
    createdAt: now,
    updatedAt: now,
  });
  const courseId = courseRef.id;
  counts.courses = 1;

  // --- Modules ----------------------------------------------------------------
  const moduleIds: string[] = [];
  for (let i = 0; i < MODULES.length; i++) {
    const m = MODULES[i];
    const ref = await adminDb.collection(COLLECTIONS.COURSE_MODULES).add({
      courseId,
      title: m.title,
      description: m.description,
      order: i + 1,
      type: "document",
      contentHtml: m.contentHtml,
      demoSeed: AC1_DEMO_TAG,
      createdAt: now,
    });
    moduleIds.push(ref.id);
  }
  counts.modules = moduleIds.length;

  // --- Section quizzes + final exam -------------------------------------------
  const quizIds: Record<number, string> = {};
  for (const spec of SECTION_QUIZZES) {
    const ref = await adminDb.collection(COLLECTIONS.QUESTION_BANKS).add({
      courseId,
      moduleId: moduleIds[spec.moduleIndex],
      title: spec.title,
      type: "quiz",
      questions: spec.questions,
      randomize: true,
      demoSeed: AC1_DEMO_TAG,
      createdAt: now,
    });
    quizIds[spec.moduleIndex] = ref.id;
  }
  await adminDb.collection(COLLECTIONS.QUESTION_BANKS).add({
    courseId,
    title: "Final Examination — Part 107",
    type: "exam",
    questions: FINAL_EXAM,
    randomize: true,
    questionsPerAttempt: FINAL_EXAM.length,
    demoSeed: AC1_DEMO_TAG,
    createdAt: now,
  });
  counts.questionBanks = SECTION_QUIZZES.length + 1;

  // --- Mock students ----------------------------------------------------------
  const daysAgo = (n: number) =>
    Timestamp.fromMillis(Date.now() - n * 24 * 60 * 60 * 1000);

  let enrollCount = 0;
  let progressCount = 0;
  let attemptCount = 0;
  let certCount = 0;

  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i];
    const plan = PLAN[i];
    const memberRef = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).add({
        firebaseUid: `demo-uid-${i + 1}`,
        firstName: s.firstName,
        lastName: s.lastName,
        expertise: "",
        emailPrimary: s.email,
        mobile: "",
        company: "Demo Cohort",
        isVeteran: s.veteran,
        role: "student",
        status: "active",
        demoSeed: AC1_DEMO_TAG,
        createdAt: daysAgo(30 - i),
        updatedAt: now,
      }
    );
    const studentId = memberRef.id;

    const enrollmentRef = await adminDb.collection(COLLECTIONS.ENROLLMENTS).add({
        studentId,
        firebaseUid: `demo-uid-${i + 1}`,
        courseId,
        status: plan.status,
        progressPercent: plan.percent,
        enrolledAt: daysAgo(28 - i * 3),
        lastAccessedAt: daysAgo(plan.status === "completed" ? 7 + i : 1 + i),
        ...(plan.status === "completed" ? { completedAt: daysAgo(7 + i) } : {}),
        demoSeed: AC1_DEMO_TAG,
      }
    );
    enrollCount++;
    const enrollmentId = enrollmentRef.id;

    // Lesson progress for completed modules
    for (const mi of plan.modules) {
      await adminDb.collection(COLLECTIONS.LESSON_PROGRESS).add({
        enrollmentId,
        courseId,
        studentId,
        firebaseUid: `demo-uid-${i + 1}`,
        moduleId: moduleIds[mi],
        status: "completed",
        timeSpentSeconds: 900 + mi * 240 + i * 60,
        demoSeed: AC1_DEMO_TAG,
        updatedAt: daysAgo(20 - mi * 2 - i),
      });
      progressCount++;
    }

    // Section quiz attempts
    for (const [miStr, score] of Object.entries(plan.quizScores)) {
      const mi = parseInt(miStr, 10);
      const bank = SECTION_QUIZZES.find((s) => s.moduleIndex === mi);
      if (!bank) continue;
      const wrongNeeded = bank.questions.length - Math.round((score / 100) * bank.questions.length);
      const answers = bank.questions.map((qq, idx) => {
        const wrong = idx < wrongNeeded;
        return {
          questionId: qq.id,
          selectedIndex: wrong
            ? (qq.correctIndex + 1) % qq.options.length
            : qq.correctIndex,
          correct: !wrong,
        };
      });
      await adminDb.collection(COLLECTIONS.EXAM_ATTEMPTS).add({
        enrollmentId,
        courseId,
        studentId,
        firebaseUid: `demo-uid-${i + 1}`,
        quizId: quizIds[mi],
        attemptNumber: 1,
        scorePercent: score,
        passed: score >= 80,
        answers,
        demoSeed: AC1_DEMO_TAG,
        startedAt: daysAgo(18 - i),
        submittedAt: daysAgo(18 - i),
      });
      attemptCount++;
    }

    // Final exam attempt + certificate for completers
    if (plan.finalScore != null) {
      const wrongNeeded =
        FINAL_EXAM.length - Math.round((plan.finalScore / 100) * FINAL_EXAM.length);
      const answers = FINAL_EXAM.map((qq, idx) => {
        const wrong = idx < wrongNeeded;
        return {
          questionId: qq.id,
          selectedIndex: wrong
            ? (qq.correctIndex + 1) % qq.options.length
            : qq.correctIndex,
          correct: !wrong,
        };
      });
      await adminDb.collection(COLLECTIONS.EXAM_ATTEMPTS).add({
        enrollmentId,
        courseId,
        studentId,
        firebaseUid: `demo-uid-${i + 1}`,
        quizId: "final-exam",
        attemptNumber: 1,
        scorePercent: plan.finalScore,
        passed: plan.finalScore >= 80,
        answers,
        demoSeed: AC1_DEMO_TAG,
        startedAt: daysAgo(8 + i),
        submittedAt: daysAgo(8 + i),
      });
      attemptCount++;

      await adminDb.collection(COLLECTIONS.CERTIFICATES).add({
        certificateNumber: generateCertificateNumber(),
        studentId,
        firebaseUid: `demo-uid-${i + 1}`,
        studentName: `${s.firstName} ${s.lastName}`,
        courseId,
        courseCode: "AC1",
        courseTitle: "FAA Part 107 Remote Pilot Certification Preparation",
        enrollmentId,
        issuedAt: daysAgo(7 + i),
        issuedBy: adminId,
        demoSeed: AC1_DEMO_TAG,
      });
      certCount++;
    }
  }

  counts.students = STUDENTS.length;
  counts.enrollments = enrollCount;
  counts.lessonProgress = progressCount;
  counts.examAttempts = attemptCount;
  counts.certificates = certCount;

  return {
    created: true,
    message:
      "Demo course AC1 created with 6 lessons, 5 section quizzes, a final exam, 6 mock students, grades, and 3 certificates.",
    counts,
  };
}
