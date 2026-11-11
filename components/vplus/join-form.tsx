"use client";

import { useState } from "react";

const EMAIL = "info@strategicvalueplus.com";

export function VPlusJoinForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [area, setArea] = useState("Quality (AS9100 / ISO 9001)");
  const [years, setYears] = useState("10–19");
  const [certs, setCerts] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Add your name and a valid email so we can reach you.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "careers",
          name: name.trim(),
          email: email.trim(),
          location: location.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          expertise: area,
          years,
          certifications: certs.trim() || undefined,
          message: `${note.trim()}\n\n[Applicant: please email your resume to ${EMAIL}]`.trim(),
          website,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Submission failed");
      }
      setSent(true);
    } catch {
      setError(`Something went wrong — please email your details to ${EMAIL}.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="ready">
        <strong>Application received</strong>
        <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>
          Thanks, {name.split(" ")[0] || "there"}. We review every application
          and will contact you if your experience fits upcoming work. Please
          email your resume to {EMAIL} to complete your application.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="row2">
        <label htmlFor="j-name">
          Full name
          <input id="j-name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label htmlFor="j-email">
          Email
          <input id="j-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>
      <div className="row2">
        <label htmlFor="j-location">
          City and state
          <input id="j-location" autoComplete="address-level2" placeholder="Greensboro, NC" value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <label htmlFor="j-linkedin">
          LinkedIn profile
          <input id="j-linkedin" type="url" placeholder="https://linkedin.com/in/…" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
        </label>
      </div>
      <div className="row2">
        <label htmlFor="j-area">
          Primary expertise
          <select id="j-area" value={area} onChange={(e) => setArea(e.target.value)}>
            <option>Quality (AS9100 / ISO 9001)</option>
            <option>Cybersecurity (CMMC / NIST 800-171)</option>
            <option>Operations (TOC / Lean / Six Sigma)</option>
            <option>Export compliance (ITAR / EAR)</option>
            <option>Federal contracting and capture</option>
            <option>Supply chain and digital twins</option>
            <option>Workforce and training</option>
            <option>AI and data</option>
            <option>Finance, ESOP and succession</option>
          </select>
        </label>
        <label htmlFor="j-years">
          Years of experience
          <select id="j-years" value={years} onChange={(e) => setYears(e.target.value)}>
            <option>5–9</option>
            <option>10–19</option>
            <option>20+</option>
          </select>
        </label>
      </div>
      <label htmlFor="j-certs">
        Certifications
        <input id="j-certs" placeholder="For example: RABQSA AS9100 Lead Auditor, CMMC CCP, Six Sigma Black Belt" value={certs} onChange={(e) => setCerts(e.target.value)} />
      </label>
      <label htmlFor="j-note">
        Tell us about a result you&apos;re proud of
        <textarea id="j-note" placeholder="For example: led a 90-person machine shop through AS9100 certification in seven months." value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {/* Honeypot — hidden from humans */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
      />
      {error && (
        <p className="mono" style={{ color: "var(--gap)", fontSize: ".85rem" }}>
          {error}
        </p>
      )}
      <div>
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit my application"}
        </button>
      </div>
    </form>
  );
}
