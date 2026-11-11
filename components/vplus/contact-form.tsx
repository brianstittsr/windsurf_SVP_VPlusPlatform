"use client";

import { useState } from "react";

const EMAIL = "info@strategicvalueplus.com";

export function VPlusContactForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [size, setSize] = useState("25–100");
  const [interest, setInterest] = useState("Constraint Diagnostic");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Add your name and a valid work email so we can reply.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "contact",
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          role: `${size} employees`,
          interest,
          message: message.trim() || undefined,
          website,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Submission failed");
      }
      setSent(true);
    } catch {
      setError(`Something went wrong — please email us directly at ${EMAIL}.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="ready">
        <strong>Message received</strong>
        <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>
          Thanks, {name.split(" ")[0] || "there"}. A member of the team will reply
          within one business day. If it&apos;s urgent, email {EMAIL}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="row2">
        <label htmlFor="f-name">
          Name
          <input id="f-name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label htmlFor="f-company">
          Company
          <input id="f-company" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
      </div>
      <div className="row2">
        <label htmlFor="f-email">
          Work email
          <input id="f-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label htmlFor="f-size">
          Employees
          <select id="f-size" value={size} onChange={(e) => setSize(e.target.value)}>
            <option>Under 25</option>
            <option>25–100</option>
            <option>101–250</option>
            <option>251–500</option>
            <option>Over 500</option>
          </select>
        </label>
      </div>
      <label htmlFor="f-interest">
        I&apos;m interested in
        <select id="f-interest" value={interest} onChange={(e) => setInterest(e.target.value)}>
          <option>Constraint Diagnostic</option>
          <option>Four Gates engagement</option>
          <option>CMMC / Executive Exposure Brief</option>
          <option>Supplier program (OEM buyer)</option>
          <option>Partner program</option>
          <option>Cogniverai AI adoption</option>
        </select>
      </label>
      <label htmlFor="f-msg">
        What are you working toward?
        <textarea
          id="f-msg"
          placeholder="For example: we quote for a tier 1 aerospace prime and need AS9100 within 9 months."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
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
          {submitting ? "Sending…" : "Send my message"}
        </button>
      </div>
    </form>
  );
}
