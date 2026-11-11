import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Strategic Value+ helps U.S. manufacturers qualify, comply and grow through the Four Gates: quality systems, cybersecurity, operations and compliance.",
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap stack" style={{ gap: 20 }}>
          <span className="eyebrow">About Strategic Value+</span>
          <h1 style={{ fontSize: "clamp(2.6rem,6vw,4.6rem)" }}>
            Supplier readiness,
            <br />
            <em style={{ fontStyle: "normal", color: "var(--brass)" }}>
              delivered as a system.
            </em>
          </h1>
          <p className="lede">
            Strategic Value Plus Solutions, LLC works with U.S. manufacturers
            that want to win — and keep — demanding OEM, aerospace, defense and
            industrial customers. We assess readiness across the Four Gates:
            quality systems, cybersecurity, operations and compliance.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link className="btn primary" href="/#contact">
              Book a 30-minute call
            </Link>
            <Link className="btn" href="/careers">
              Join our talent network
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap split">
          <div className="stack" style={{ gap: 18 }}>
            <span className="eyebrow">Who we are</span>
            <h2>Operators, auditors and engineers — not slide decks</h2>
            <p className="lede">
              V+ is a network of senior manufacturing practitioners: quality
              auditors, security professionals, operations leaders and
              compliance specialists. Engagements are led by people who have run
              plants, passed audits and shipped under ITAR and CMMC
              requirements.
            </p>
          </div>
          <ul className="list">
            <li>
              <strong>The Four Gates</strong>
              <span>
                Every engagement is mapped to the four gates an OEM grades a
                supplier on: quality systems, cybersecurity, operations and
                compliance.
              </span>
            </li>
            <li>
              <strong>Cogniverai</strong>
              <span>
                Our AI adoption collaborative helps manufacturers deploy AI
                securely — with leadership alignment, a ready workforce and
                infrastructure that survives an audit.
              </span>
            </li>
            <li>
              <strong>V+ Academy</strong>
              <span>
                Our training platform delivers the courses and credentials that
                keep supplier teams qualified.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="wrap split">
          <div className="stack" style={{ gap: 18 }}>
            <span className="eyebrow">Where to start</span>
            <h2>A fixed-fee diagnostic, then a plan</h2>
            <p className="lede">
              Most engagements begin with a Constraint Diagnostic: a structured
              assessment that shows exactly which gate is blocking your next
              contract, and what it takes to clear it.
            </p>
          </div>
          <ul className="list">
            <li>
              <strong>For manufacturers</strong>
              <span>
                Tell us what your customers are asking for — AS9100, CMMC,
                ITAR, capacity — and we&apos;ll show you the fastest credible
                path.
              </span>
            </li>
            <li>
              <strong>For OEM buyers</strong>
              <span>
                We run supplier development programs that bring your supply
                base up to requirement — with evidence, not promises.
              </span>
            </li>
            <li>
              <strong>For experts</strong>
              <span>
                Seasoned practitioners can join the V+ resource network and
                work on qualification and transformation projects.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
