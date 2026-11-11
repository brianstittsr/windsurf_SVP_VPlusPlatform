"use client";

import { useState } from "react";

const EMAIL = "info@strategicvalueplus.com";

export function CogContactForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("CEO / Owner");
  const [interest, setInterest] = useState("AI Readiness Diagnostic");
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
          formType: "cogniverai",
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          role,
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
        <label htmlFor="c-name">
          Name
          <input id="c-name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label htmlFor="c-company">
          Company
          <input id="c-company" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
      </div>
      <div className="row2">
        <label htmlFor="c-email">
          Work email
          <input id="c-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label htmlFor="c-role">
          Your role
          <select id="c-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option>CEO / Owner</option>
            <option>COO / Operations</option>
            <option>CTO / IT</option>
            <option>Quality</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <label htmlFor="c-interest">
        I&apos;m interested in
        <select id="c-interest" value={interest} onChange={(e) => setInterest(e.target.value)}>
          <option>AI Readiness Diagnostic</option>
          <option>AI Opportunity Scan</option>
          <option>90-day AI Transformation Sprint</option>
          <option>Becoming a member or partner</option>
        </select>
      </label>
      <label htmlFor="c-msg">
        What would AI need to do for you?
        <textarea
          id="c-msg"
          placeholder="For example: cut quoting time in half without exposing CUI."
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
      {error && <p className="err mono">{error}</p>}
      <div>
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send my message"}
        </button>
      </div>
    </form>
  );
}
