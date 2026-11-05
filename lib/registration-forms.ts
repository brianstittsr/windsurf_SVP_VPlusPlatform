import type { RegistrationFormFieldDoc } from "@/lib/schema";

export const REGISTRATION_FORM_SLUG = "student-registration";

export const DEFAULT_STUDENT_REGISTRATION_FIELDS: RegistrationFormFieldDoc[] = [
  { id: "student-info", type: "section", label: "Student Information", required: false },
  { id: "full-name", type: "name", purpose: "fullName", label: "Full name", required: true, validation: { minLength: 2, maxLength: 120 } },
  { id: "company", type: "text", purpose: "company", label: "Company name", helpText: "If applicable", required: false, validation: { maxLength: 160 } },
  { id: "birth-month-year", type: "monthYear", purpose: "birthMonthYear", label: "Month and year of birth", required: true },
  { id: "email", type: "email", purpose: "email", label: "Email address", required: true },
  { id: "mobile", type: "phone", purpose: "phone", label: "Mobile phone", required: true },
  { id: "address", type: "address", purpose: "address", label: "Mailing address", required: true },
  {
    id: "veteran-status",
    type: "yesNoPreferNot",
    purpose: "veteranStatus",
    label: "Veteran status",
    helpText: "Optional. Choose ‘Prefer not to answer’ if you do not wish to disclose.",
    required: false,
  },
  { id: "course-selection", type: "courseSelector", purpose: "courseSelection", label: "Select the online course or courses you wish to enroll in", required: true },
  { id: "email-permission", type: "section", label: "Email and Newsletter Permission", required: false },
  {
    id: "newsletter-consent",
    type: "consent",
    purpose: "newsletterConsent",
    label: "Yes, I agree to receive the EFVS newsletter and program updates.",
    helpText: "EFVS uses your email for registration, course access, billing, and program communications. Newsletter consent is optional and is not required to enroll.",
    required: false,
  },
  { id: "student-acknowledgment", type: "section", label: "Student Acknowledgment", required: false },
  {
    id: "accuracy-acknowledgment",
    type: "consent",
    purpose: "studentAcknowledgment",
    label: "I certify that the information provided is accurate. I understand that enrollment is subject to course availability, receipt of payment or approved sponsorship, and completion of applicable registration requirements. I understand that course access may be issued through a licensed online learning platform.",
    required: true,
  },
  {
    id: "program-policies-acknowledgment",
    type: "consent",
    purpose: "programPolicies",
    label: "I have read, acknowledged, and agree to the Student Agreement and Program Policies.",
    helpText: "Review the EFVS Student Agreement and Program Policies before signing.",
    helpLink: { label: "EFVS website", url: "https://www.efvertical.com" },
    required: true,
  },
  {
    id: "electronic-signature",
    type: "signature",
    purpose: "signature",
    label: "Student signature",
    helpText: "Type your legal name and draw your signature. By signing, you agree to the electronic-signature disclosure and the acknowledgments above.",
    required: true,
  },
];

export const SIGNATURE_CONSENT_TEXT =
  "I agree to use an electronic signature for this registration. I understand that my typed and drawn signature, the form version and acknowledgments shown to me, and the submission timestamp will be retained as the signed registration record.";
