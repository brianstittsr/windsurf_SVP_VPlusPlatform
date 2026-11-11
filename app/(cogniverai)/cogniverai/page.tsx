import Link from "next/link";
import type { Metadata } from "next";
import { CogContactForm } from "@/components/cogniverai/cog-contact-form";

export const metadata: Metadata = {
  title: "Cogniverai",
  description:
    "Cogniverai: AI adoption for aerospace and defense manufacturers, delivered by a coordinated team of specialist firms and convened by Strategic Value+.",
};

const EMAIL = "info@strategicvalueplus.com";
const PHONE = "(302) 215-4700";

export default function CogniveraiPage() {
  return (
    <>
      {/* Hero deck */}
      <section className="deck hero">
        <div className="wrap hero-grid">
          <div className="stack" style={{ gap: 22 }}>
            <span className="eyebrow">
              AI adoption for aerospace and defense manufacturers
            </span>
            <h1>
              Adopt AI.
              <br />
              <em>Keep control.</em>
            </h1>
            <p className="lede">
              Your OEMs, your board and your vendors all expect AI progress.
              Cogniverai gives you one coordinated team for the whole job:
              leadership alignment, the right technology, a ready workforce and
              security you can defend in an audit.
            </p>
            <div className="actions">
              <Link className="btn primary" href="#contact">
                Request an AI Readiness Diagnostic
              </Link>
              <Link className="btn" href="#members">
                Meet the founding members
              </Link>
            </div>
            <p className="endorse">
              Convened by <Link href="/">Strategic Value+</Link> · cogniverai.com
            </p>
          </div>
          <aside className="board" aria-label="Example: a team assembled for one client">
            <div className="board-head">
              <span>Team assembled per client</span>
              <span>Example</span>
            </div>
            <div className="client">
              <b>Tier 2 aerostructures supplier, 180 people</b>
              <small>Goal: AI-assisted quoting and quality data an OEM can trust</small>
            </div>
            <div className="chips">
              <div className="chip on">
                <span>Strategic Value+</span>
                <i>LEAD</i>
              </div>
              <div className="chip on">
                <span>Semantic OS</span>
                <i>ON TEAM</i>
              </div>
              <div className="chip on">
                <span>AI Agility</span>
                <i>ON TEAM</i>
              </div>
              <div className="chip on">
                <span>E3S</span>
                <i>ON TEAM</i>
              </div>
              <div className="chip">
                <span>LogiCore</span>
              </div>
              <div className="chip">
                <span>BizzTech</span>
              </div>
              <div className="chip">
                <span>AthenaMind.io</span>
              </div>
              <div className="chip">
                <span>AOCyber.ai</span>
              </div>
            </div>
            <p className="board-foot">
              Illustrative engagement. Each client gets only the members its
              goals require.
            </p>
          </aside>
        </div>
      </section>

      {/* Approach */}
      <section id="approach">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Why AI stalls in manufacturing</span>
            <h2>AI fails on four fronts at once</h2>
            <p className="lede">
              Most pilots stall for reasons that have nothing to do with the
              model. We work all four fronts together, so a pilot becomes how
              the plant runs.
            </p>
          </div>
          <div className="dims">
            <article className="dim">
              <span className="q">Leadership</span>
              <h3>Where should AI pay first?</h3>
              <p>
                Executive alignment on a short list of use cases tied to
                throughput, quality and margin, with owners and a roadmap.
              </p>
            </article>
            <article className="dim">
              <span className="q">Technology</span>
              <h3>What do we connect, and how?</h3>
              <p>
                Opportunity diagnostics, systems integration, digital twins and
                decision automation with a full audit trail.
              </p>
            </article>
            <article className="dim">
              <span className="q">People</span>
              <h3>Will the floor actually use it?</h3>
              <p>
                Change readiness, role-based skills and immersive training so
                operators, planners and quality staff adopt the tools.
              </p>
            </article>
            <article className="dim">
              <span className="q">Security</span>
              <h3>Can we defend it to a prime?</h3>
              <p>
                Private, controlled AI infrastructure built for CUI, CMMC and
                ITAR environments, up to DoD-grade builds.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">How an engagement runs</span>
            <h2>From first scan to working AI in 90 days</h2>
          </div>
          <ol className="flow">
            <li>
              <h3>Scan</h3>
              <p>
                A quick AI opportunity scan shows where AI could save time or
                money in your operation.
              </p>
            </li>
            <li>
              <h3>Diagnose</h3>
              <p>
                Two or three members assess leadership, data, security and
                workforce readiness, and price the work.
              </p>
            </li>
            <li>
              <h3>Assemble</h3>
              <p>
                Strategic Value+ builds the team from the founding members your
                goals need, under one contract.
              </p>
            </li>
            <li>
              <h3>Sprint</h3>
              <p>
                A 90-day sprint puts the first use cases into daily operation,
                with measures agreed up front.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* Offers */}
      <section id="offers">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Offers</span>
            <h2>Four ways to start</h2>
          </div>
          <div className="offers">
            <article className="offer">
              <span className="kind">Entry</span>
              <h3>AI Opportunity Scan</h3>
              <p>
                A fast scan of where AI fits in your operation, plus an
                executive briefing for your leadership team.
              </p>
              <div className="terms">
                No cost<small>For qualified manufacturers</small>
              </div>
            </article>
            <article className="offer feature">
              <span className="kind">Recommended first step</span>
              <h3>AI Readiness Diagnostic</h3>
              <p>
                Leadership, data, security and workforce readiness, scored and
                turned into a priced sprint plan.
              </p>
              <div className="terms">
                Fixed fee<small>50% credited to the sprint</small>
              </div>
            </article>
            <article className="offer">
              <span className="kind">Core engagement</span>
              <h3>90-day AI Transformation Sprint</h3>
              <p>
                A team assembled for your goals delivers the first use cases,
                trains your people and secures the stack.
              </p>
              <div className="terms">
                Scoped per client<small>From the diagnostic</small>
              </div>
            </article>
            <article className="offer">
              <span className="kind">Ongoing</span>
              <h3>Platforms and training</h3>
              <p>
                Vendor-matching cockpit, immersive workforce training and
                managed secure AI infrastructure.
              </p>
              <div className="terms">
                Subscription<small>or per-seat training</small>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Members */}
      <section id="members">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Founding members</span>
            <h2>Eight specialist firms, one accountable team</h2>
            <p className="lede">
              Each member is independent and best in its field. Strategic
              Value+ convenes the collaborative, holds the contract and runs
              the program.
            </p>
          </div>
          <div className="members">
            <article className="member convener">
              <span className="role">Convener · Orchestration</span>
              <h3>Strategic Value+</h3>
              <p>
                Program leadership, manufacturing readiness and the Four Gates
                framework.
              </p>
              <span className="site">strategicvalueplus.com</span>
            </article>
            <article className="member">
              <span className="role">AI opportunity diagnostics</span>
              <h3>Semantic OS</h3>
              <p>AI opportunity scans and the vendor-matching cockpit.</p>
            </article>
            <article className="member">
              <span className="role">Leadership and culture</span>
              <h3>AI Agility</h3>
              <p>
                Executive alignment, culture-change readiness and workforce
                capability.
              </p>
              <span className="site">leadingaiagility.com</span>
            </article>
            <article className="member">
              <span className="role">Secure AI engineering</span>
              <h3>E3S</h3>
              <p>Secure AI engineering, digital twins and compliance.</p>
              <span className="site">eecomputing.com</span>
            </article>
            <article className="member">
              <span className="role">Systems and logistics</span>
              <h3>LogiCore Corporation</h3>
              <p>Systems engineering and logistics.</p>
            </article>
            <article className="member">
              <span className="role">Immersive training</span>
              <h3>BizzTech</h3>
              <p>Immersive, AI-powered workforce training.</p>
            </article>
            <article className="member">
              <span className="role">Decision execution</span>
              <h3>AthenaMind.io</h3>
              <p>
                Autonomous decision execution and integration across enterprise
                systems, with an audit trail.
              </p>
              <span className="site">athenamind.io</span>
            </article>
            <article className="member">
              <span className="role">Secure infrastructure</span>
              <h3>AOCyber.ai</h3>
              <p>Private AI infrastructure for DoD- and IC-grade builds.</p>
              <span className="site">aocyber.ai</span>
            </article>
          </div>
        </div>
      </section>

      {/* Region */}
      <section id="region">
        <div className="wrap split">
          <div className="stack" style={{ gap: 18 }}>
            <span className="eyebrow">Where we start</span>
            <h2>North Carolina first, then Southern California</h2>
            <p className="lede">
              The Piedmont Triad is becoming one of the country&apos;s newest
              aerospace hubs, with a digitally planned aircraft plant under
              construction in Greensboro. Its suppliers are where AI readiness
              matters first.
            </p>
          </div>
          <div className="region">
            <div>
              <span className="when">Q1 2027</span>
              <p>
                <b>Piedmont Triad launch</b>
                <span>
                  Launch event with a founding member and a local manufacturer.
                </span>
              </p>
            </div>
            <div>
              <span className="when">H1 2027</span>
              <p>
                <b>North Carolina A&amp;D suppliers</b>
                <span>Charlotte, the Triad and the Research Triangle.</span>
              </p>
            </div>
            <div>
              <span className="when">H2 2027</span>
              <p>
                <b>Southern California</b>
                <span>Long Beach and the Los Angeles aerospace base.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section id="principles">
        <div className="wrap split">
          <div className="stack" style={{ gap: 18 }}>
            <span className="eyebrow">How we work</span>
            <h2>What you can count on</h2>
          </div>
          <ul className="list">
            <li>
              <strong>Vendor-neutral</strong>
              <span>
                We recommend tools for fit, not commission. Any software
                relationship is disclosed up front.
              </span>
            </li>
            <li>
              <strong>One contract, one owner</strong>
              <span>
                Strategic Value+ holds the contract and answers for the whole
                team&apos;s delivery.
              </span>
            </li>
            <li>
              <strong>Your data stays yours</strong>
              <span>
                We build for CUI and export-controlled environments, and your
                data is never used to train shared models.
              </span>
            </li>
            <li>
              <strong>Only the team you need</strong>
              <span>
                You pay for the members your goals require, not a standing
                bench.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section id="contact">
        <div className="wrap split">
          <div className="stack" style={{ gap: 24 }}>
            <div className="stack" style={{ gap: 14 }}>
              <span className="eyebrow">Contact</span>
              <h2>Start with a diagnostic</h2>
              <p className="lede">
                Tell us what your customers and leadership are asking for.
                We&apos;ll tell you which front to work first.
              </p>
            </div>
            <div className="fact">
              <span className="k">Email</span>
              <span className="v">
                <span>{EMAIL}</span>
              </span>
            </div>
            <div className="fact">
              <span className="k">Phone</span>
              <span className="v">
                <span>{PHONE}</span>
              </span>
            </div>
          </div>
          <div>
            <CogContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
