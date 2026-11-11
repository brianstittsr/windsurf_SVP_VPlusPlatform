import Link from "next/link";
import type { Metadata } from "next";
import { VPlusJoinForm } from "@/components/vplus/join-form";

export const metadata: Metadata = {
  title: "Become a V+ Resource",
  description:
    "Apply to join the Strategic Value+ network of manufacturing consultants, auditors and operations leaders.",
};

export default function CareersPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap stack" style={{ gap: 20 }}>
          <span className="eyebrow">Careers · V+ resource network</span>
          <h1 style={{ fontSize: "clamp(2.6rem,6vw,4.6rem)" }}>
            Do the work you&apos;re best at.
            <br />
            <em style={{ fontStyle: "normal", color: "var(--brass)" }}>
              We&apos;ll bring the clients.
            </em>
          </h1>
          <p className="lede">
            Strategic Value+ matches seasoned manufacturing experts to U.S.
            manufacturers working to qualify, comply and grow. You bring the
            expertise; we bring the client, the scope and the engagement lead.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link className="btn primary" href="#apply">
              Apply now
            </Link>
            <Link className="btn" href="/#about">
              See our bench
            </Link>
          </div>
        </div>
      </section>

      <section id="standard">
        <div className="wrap">
          <div className="vet" style={{ marginTop: 0 }}>
            <div className="stack" style={{ gap: 12 }}>
              <span className="eyebrow">Our standard</span>
              <h3 style={{ fontSize: "2rem" }}>What we&apos;ll ask of you</h3>
              <p>
                Clients trust us with their floor and their data. Before your
                first assignment, we will confirm:
              </p>
            </div>
            <ul className="checks">
              <li>Your credentials and certifications, with the issuing body</li>
              <li>Two professional references</li>
              <li>A signed NDA and the V+ code of conduct</li>
              <li>Professional liability insurance</li>
              <li>U.S.-person status, for ITAR and CUI work</li>
              <li>Security clearance status, where a program requires it</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="apply" className="join">
        <div className="wrap split">
          <div className="stack" style={{ gap: 22 }}>
            <div className="stack" style={{ gap: 14 }}>
              <span className="eyebrow">Join our talent network</span>
              <h2>Become a V+ resource</h2>
              <p className="lede">
                Are you a manufacturing consultant, auditor or operations
                leader who gets results on the floor? Apply to join the
                Strategic Value+ resource network and work on qualification,
                compliance and transformation projects with U.S. manufacturers.
              </p>
            </div>
            <ul className="list">
              <li>
                <strong>Who we&apos;re looking for</strong>
                <span>
                  Independent consultants and seasoned practitioners in quality,
                  cybersecurity, operations, export compliance, supply chain,
                  workforce and AI.
                </span>
              </li>
              <li>
                <strong>What you get</strong>
                <span>
                  Assignments matched to your expertise, a defined scope and
                  milestones, and an engagement lead who handles the client
                  relationship.
                </span>
              </li>
              <li>
                <strong>How it works</strong>
                <span>
                  Submit your details and resume. We review every application
                  and contact those whose experience fits upcoming work.
                </span>
              </li>
            </ul>
          </div>
          <div>
            <VPlusJoinForm />
          </div>
        </div>
      </section>
    </>
  );
}
