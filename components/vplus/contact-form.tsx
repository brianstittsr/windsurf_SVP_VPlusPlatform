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
      `To: ${EMAIL}\nSubject: ${interest} — ${company.trim() || name.trim()}\n\n` +
        `Name: ${name.trim()}\nCompany: ${company.trim() || "—"}\nEmail: ${email.trim()}\n` +
        `Employees: ${size}\nInterested in: ${interest}\n\n${message.trim()}`
    );
  };

  const copy = async () => {
    if (!readyText) return;
    try {
      await navigator.clipboard.writeText(readyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — user can select the text */
    }
  };

  if (readyText !== null) {
    return (
      <div className="ready">
        <strong>Your message is ready to send</strong>
        <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>
          Copy it and email it to {EMAIL}, or{" "}
          <a href={`mailto:${EMAIL}?subject=${encodeURIComponent(`${interest} — ${company.trim() || name.trim()}`)}&body=${encodeURIComponent(readyText.split("\n\n").slice(1).join("\n\n"))}`}>
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
      {error && (
        <p className="mono" style={{ color: "var(--gap)", fontSize: ".85rem" }}>
          Add your name and a valid work email so we can reply.
        </p>
      )}
      <div>
        <button className="btn primary" type="submit">
          Prepare my message
        </button>
      </div>
    </form>
  );
}
