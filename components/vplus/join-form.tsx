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
  const [error, setError] = useState(false);
  const [readyText, setReadyText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError(true);
      return;
    }
    setError(false);
    setReadyText(
      `To: ${EMAIL}\nSubject: V+ Resource Application — ${name.trim()} — ${area}\n\n` +
        `Name: ${name.trim()}\nEmail: ${email.trim()}\nLocation: ${location.trim() || "—"}\n` +
        `LinkedIn: ${linkedin.trim() || "—"}\nPrimary expertise: ${area}\nYears of experience: ${years}\n` +
        `Certifications: ${certs.trim() || "—"}\nResume: Please attach your resume to the email\n\n${note.trim()}`
    );
  };

  const copy = async () => {
    if (!readyText) return;
    try {
      await navigator.clipboard.writeText(readyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (readyText !== null) {
    return (
      <div className="ready">
        <strong>Your application is ready to send</strong>
        <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>
          Copy it into an email to {EMAIL} and attach your resume, or{" "}
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(`V+ Resource Application — ${name.trim()} — ${area}`)}&body=${encodeURIComponent(readyText.split("\n\n").slice(1).join("\n\n"))}`}
          >
            open it in your mail app
          </a>
          .
        </p>
        <pre>{readyText}</pre>
        <div className="acts">
          <button className="btn primary" type="button" onClick={copy}>
            {copied ? "Copied" : "Copy application"}
          </button>
          <button className="btn" type="button" onClick={() => setReadyText(null)}>
            Edit
          </button>
        </div>
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
      {error && (
        <p className="mono" style={{ color: "var(--gap)", fontSize: ".85rem" }}>
          Add your name and a valid email so we can reach you.
        </p>
      )}
      <div>
        <button className="btn primary" type="submit">
          Prepare my application
        </button>
      </div>
    </form>
  );
}
