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
      `To: ${EMAIL}\nSubject: Cogniverai — ${interest} — ${company.trim() || name.trim()}\n\n` +
        `Name: ${name.trim()}\nCompany: ${company.trim() || "—"}\nEmail: ${email.trim()}\n` +
        `Role: ${role}\nInterested in: ${interest}\n\n${message.trim()}`
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
        <strong>Your message is ready to send</strong>
        <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>
          Copy it and email it to {EMAIL}, or{" "}
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Cogniverai — ${interest} — ${company.trim() || name.trim()}`)}&body=${encodeURIComponent(readyText.split("\n\n").slice(1).join("\n\n"))}`}
          >
            open it in your mail app
          </a>
          .
        </p>
        <pre>{readyText}</pre>
        <div className="acts">
          <button className="btn primary" type="button" onClick={copy}>
            {copied ? "Copied" : "Copy message"}
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
      {error && (
        <p className="err mono">Add your name and a valid work email so we can reply.</p>
      )}
      <div>
        <button className="btn primary" type="submit">
          Prepare my message
        </button>
      </div>
    </form>
  );
}
