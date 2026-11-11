import Link from "next/link";
import { VPlusContactForm } from "@/components/vplus/contact-form";

const EMAIL = "info@strategicvalueplus.com";
const PHONE = "(302) 215-4700";

export default function VPlusHomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero" id="top">
        <div className="wrap hero-grid">
          <div className="stack" style={{ gap: 22 }}>
            <span className="eyebrow">
              Supplier readiness · Aerospace, defense and advanced manufacturing
            </span>
            <h1>
              Close the gaps.
              <br />
              <em>Win OEM business.</em>
            </h1>
            <p className="lede">
              We get small and mid-sized manufacturers qualified, compliant and
              capacity-ready to win and keep OEM and defense work. Quality,
              cybersecurity, flow and export compliance, closed gate by gate.
            </p>
            <div className="actions">
              <Link className="btn primary" href="#contact">
                Book a 30-minute call
              </Link>
              <Link className="btn" href="#offers">
                See the Constraint Diagnostic
              </Link>
            </div>
            <p className="for">
              For manufacturers with 25–500 employees · North Carolina and
              Southern California
            </p>
          </div>
          <aside className="tag" aria-label="Example readiness scorecard">
            <div className="tag-head">
              <strong>Readiness tag</strong>
              <span>Example scorecard</span>
            </div>
            <div className="gate-row">
              <span className="gate-id">GATE 1</span>
              <span className="gate-name">
                Quality<small>AS9100 / ISO 9001 system</small>
              </span>
              <span className="pill ok">Ready</span>
            </div>
            <div className="gate-row">
              <span className="gate-id">GATE 2</span>
              <span className="gate-name">
                Cybersecurity<small>CMMC L2 · NIST 800-171 · SPRS</small>
              </span>
              <span className="pill gap">Gap</span>
            </div>
            <div className="gate-row">
              <span className="gate-id">GATE 3</span>
              <span className="gate-name">
                Operations<small>TOC flow · on-time delivery</small>
              </span>
              <span className="pill warn">At risk</span>
            </div>
            <div className="gate-row">
              <span className="gate-id">GATE 4</span>
              <span className="gate-name">
                Compliance<small>ITAR / EAR controls</small>
              </span>
              <span className="pill ok">Ready</span>
            </div>
            <div className="tag-foot">
              <span>Illustrative, not client data</span>
              <span>2 of 4 gates cleared</span>
            </div>
          </aside>
        </div>
      </section>

      {/* Why now */}
      <section className="band" id="why">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Why now</span>
            <h2>
              Ready for the <em>AI-native</em> supply chain
            </h2>
            <p>
              OEMs are building digital, AI-enabled factories and they expect
              the same discipline from their suppliers. The shops that can prove
              quality, protect data and deliver on time will win the next decade
              of work.
            </p>
          </div>
          <div className="why">
            <div>
              <span className="eyebrow">North Carolina</span>
              <h3>A new aerospace supply base is forming</h3>
              <p>
                JetZero broke ground in Greensboro in 2026 on a Z4 plant planned
                around Siemens, Nvidia and AWS digital platforms. Regional
                suppliers will be measured against that bar.
              </p>
            </div>
            <div>
              <span className="eyebrow">Defense</span>
              <h3>CMMC is paused, the risk is not</h3>
              <p>
                Phase 2 third-party assessments are on hold, but Phase 1
                self-assessments, DFARS 7012, SPRS affirmations and False Claims
                Act exposure all still apply. Primes set their own deadlines.
              </p>
            </div>
            <div>
              <span className="eyebrow">Operations</span>
              <h3>Capacity is the quiet deal-breaker</h3>
              <p>
                Buyers qualify suppliers who can scale on schedule. A hidden
                constraint on one machine or one approval step can cap a whole
                plant&apos;s output.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Four Gates */}
      <section id="gates">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">The Four Gates framework</span>
            <h2>Four gates every OEM checks</h2>
            <p className="lede">
              Each gate is a question a buyer will ask before you get the
              purchase order. We show you where you stand on each one, then
              close the gaps in the order that unlocks revenue fastest.
            </p>
          </div>
          <div className="gates">
            <article className="gate">
              <span className="num">GATE 1</span>
              <h3>Quality</h3>
              <ul>
                <li>Gap assessment against AS9100 or ISO 9001</li>
                <li>Document control, CAPA, internal audit</li>
                <li>Audit preparation and first-article readiness</li>
              </ul>
              <span className="std">AS9100 · ISO 9001:2015 · IATF 16949</span>
            </article>
            <article className="gate">
              <span className="num">GATE 2</span>
              <h3>Cybersecurity</h3>
              <ul>
                <li>CMMC Level 1 and Level 2 readiness</li>
                <li>NIST SP 800-171 controls and SPRS score</li>
                <li>Executive Exposure Brief on FCA risk</li>
              </ul>
              <span className="std">CMMC 2.0 · DFARS 252.204-7012</span>
            </article>
            <article className="gate">
              <span className="num">GATE 3</span>
              <h3>Operations</h3>
              <ul>
                <li>Theory of Constraints flow analysis</li>
                <li>On-time delivery and lead-time reduction</li>
                <li>Faster, more accurate quoting</li>
              </ul>
              <span className="std">TOC · Goldratt Research Labs methods</span>
            </article>
            <article className="gate">
              <span className="num">GATE 4</span>
              <h3>Compliance</h3>
              <ul>
                <li>ITAR and EAR export-control program</li>
                <li>Section 889 and supply-chain attestations</li>
                <li>SAM.gov and federal registration support</li>
              </ul>
              <span className="std">ITAR · EAR · FAR/DFARS</span>
            </article>
          </div>
          <div className="gate5">
            <p>
              <strong>Ready for AI as well?</strong> AI readiness is delivered
              through Cogniverai, the AI adoption collaborative convened by
              Strategic Value+.
            </p>
            <Link className="btn" href="/cogniverai">
              Visit Cogniverai
            </Link>
          </div>
        </div>
      </section>

      {/* Offers ladder */}
      <section id="offers">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Services</span>
            <h2>Start small. Climb when it pays.</h2>
            <p className="lede">
              Every engagement starts with facts about your plant. The paid
              diagnostic ends with a priced roadmap, and half its fee is
              credited if you continue.
            </p>
          </div>
          <div className="ladder">
            <div className="rung">
              <span className="step">Step 1</span>
              <div>
                <h3>Discovery call</h3>
                <p>
                  Thirty minutes on your OEM targets, your current
                  certifications and what is blocking the next award.
                </p>
              </div>
              <p>Includes the online Four Gates readiness scorecard.</p>
              <div className="price">
                Free<small>No obligation</small>
              </div>
            </div>
            <div className="rung feature">
              <span className="step">Step 2</span>
              <div>
                <h3>Constraint Diagnostic</h3>
                <p>
                  On-site and data review that finds the one constraint limiting
                  throughput and scores you on all four gates.
                </p>
              </div>
              <p>
                You get a gate-by-gate scorecard, the constraint and its cost,
                and a priced qualification roadmap.
              </p>
              <div className="price">
                $9,950<small>50% credited to step 3</small>
              </div>
            </div>
            <div className="rung">
              <span className="step">Step 2b</span>
              <div>
                <h3>Executive Exposure Brief</h3>
                <p>
                  For defense suppliers: where your CMMC, DFARS 7012 and False
                  Claims Act exposure stands today.
                </p>
              </div>
              <p>
                Delivered with our cybersecurity partner for leadership and
                counsel.
              </p>
              <div className="price">
                Fixed fee<small>Quoted on the call</small>
              </div>
            </div>
            <div className="rung">
              <span className="step">Step 3</span>
              <div>
                <h3>Four Gates engagement</h3>
                <p>
                  Hands-on execution of the roadmap: quality system, cyber
                  controls, flow improvement and compliance program.
                </p>
              </div>
              <p>
                Specialists from our affiliate network join only where the
                roadmap needs them.
              </p>
              <div className="price">
                Monthly<small>Scoped from the diagnostic</small>
              </div>
            </div>
            <div className="rung">
              <span className="step">Step 4</span>
              <div>
                <h3>V+ EDGE™ and gain-share</h3>
                <p>
                  Keep the gains: KPI visibility and modular execution on the
                  V+ EDGE platform.
                </p>
              </div>
              <p>
                Where throughput gains are measurable, we can share in them
                instead of charging fees.
              </p>
              <div className="price">
                Subscription<small>or % of measured gain</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">How it works</span>
            <h2>From capable to qualified</h2>
          </div>
          <ol className="steps">
            <li>
              <h3>Discover</h3>
              <p>
                We learn your OEM goals and score your readiness on the four
                gates.
              </p>
            </li>
            <li>
              <h3>Diagnose</h3>
              <p>
                We find the constraint and the gaps that block qualification,
                with their cost.
              </p>
            </li>
            <li>
              <h3>Execute</h3>
              <p>
                Our team and vetted affiliates close the gaps against milestones
                you can track.
              </p>
            </li>
            <li>
              <h3>Qualify</h3>
              <p>
                You pass the audit, earn the approval and keep the business with
                stable delivery.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* OEM buyers */}
      <section id="oem">
        <div className="wrap split">
          <div className="stack" style={{ gap: 18 }}>
            <span className="eyebrow">For OEM and prime buyers</span>
            <h2>More qualified suppliers in your region</h2>
            <p className="lede">
              Supplier development teams use Strategic Value+ to bring promising
              local suppliers up to standard, faster than they could alone.
            </p>
            <div>
              <Link className="btn" href="#contact">
                Talk about a supplier program
              </Link>
            </div>
          </div>
          <ul className="list">
            <li>
              <strong>Supplier readiness cohorts</strong>
              <span>
                A group of regional suppliers moves through the four gates
                together on a shared schedule.
              </span>
            </li>
            <li>
              <strong>Targeted supplier rescue</strong>
              <span>
                A key supplier is late or failing an audit. We diagnose the
                constraint and fix it on site.
              </span>
            </li>
            <li>
              <strong>Funded programs</strong>
              <span>
                We deliver supplier readiness under SBA, NIST MEP, DoW and
                university programs, so suppliers pay little or nothing.
              </span>
            </li>
            <li>
              <strong>New plant onboarding</strong>
              <span>
                We prepare the local supply base as a new facility ramps up.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Partners */}
      <section id="partners">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Partner program</span>
            <h2>Bring us in. We&apos;ll bring you in.</h2>
            <p className="lede">
              Software vendors, staffing firms, integrators and consultants work
              with us under one simple program with three tiers.
            </p>
          </div>
          <div className="tiers">
            <article className="tier">
              <span className="who">Tier 1</span>
              <h3>Referral partner</h3>
              <p>
                Introduce a manufacturer who needs readiness help. You earn a
                standard referral fee on first-year fees, and we refer our
                clients to you.
              </p>
            </article>
            <article className="tier">
              <span className="who">Tier 2</span>
              <h3>Active partner</h3>
              <p>
                Help close the deal with a joint call or proposal input, and
                earn a higher rate. Leads are registered so ownership is never
                in question.
              </p>
            </article>
            <article className="tier">
              <span className="who">Tier 3</span>
              <h3>Delivery partner</h3>
              <p>
                Deliver specialist scope inside a Strategic Value+ engagement as
                a vetted affiliate, paid on your scope.
              </p>
            </article>
          </div>
          <div className="eco" aria-label="Ecosystem relationships">
            <span>Goldratt Research Labs (TOC)</span>
            <span>California State University, Long Beach</span>
            <span>Reshoring Initiative</span>
            <span>Women in Manufacturing</span>
            <span>American Defense Alliance</span>
            <span>HUBZone Contractors National Council</span>
          </div>
          <div style={{ marginTop: 28 }}>
            <Link className="btn" href="#contact">
              Apply to partner
            </Link>
          </div>
        </div>
      </section>

      {/* Cogniverai band */}
      <section className="cog-band" id="cogniverai">
        <div className="wrap cog-grid">
          <div className="stack" style={{ gap: 18 }}>
            <span className="eyebrow" style={{ color: "#5CC2B3" }}>
              Home of Cogniverai
            </span>
            <div className="cog-logo">
              cogniver<span>ai</span>
            </div>
            <p style={{ fontSize: "1.1rem" }}>
              AI adoption for aerospace and defense manufacturers. Leadership,
              technology, people and security, delivered by one coordinated team
              of specialist firms and convened by Strategic Value+.
            </p>
            <div>
              <Link className="btn" href="/cogniverai">
                Explore Cogniverai
              </Link>
            </div>
          </div>
          <div className="cog-dims">
            <div>
              <b>Leadership</b>
              <small>Executive alignment and an AI roadmap</small>
            </div>
            <div>
              <b>Technology</b>
              <small>Diagnostics, integration, digital twins</small>
            </div>
            <div>
              <b>People</b>
              <small>Workforce skills and immersive training</small>
            </div>
            <div>
              <b>Security</b>
              <small>Private, DoD-grade AI infrastructure</small>
            </div>
          </div>
        </div>
      </section>

      {/* Insights */}
      <section id="insights">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Insights</span>
            <h2>What we&apos;re seeing on the shop floor</h2>
          </div>
          <div className="insights">
            <article className="card">
              <span className="status">Quarterly · First edition Q1 2027</span>
              <h3>Supplier Readiness Index</h3>
              <p>
                A short quarterly brief on how small and mid-sized suppliers
                score across the four gates, built from anonymized readiness
                scorecards.
              </p>
              <Link className="btn" href="#contact" style={{ justifySelf: "start" }}>
                Get it when it&apos;s published
              </Link>
            </article>
            <article className="card">
              <span className="status">Webinar series · Monthly</span>
              <h3>False Claims Act exposure while CMMC is paused</h3>
              <p>
                What still applies to your SPRS score and annual affirmations,
                and what primes are asking of their suppliers right now.
              </p>
              <Link className="btn" href="#contact" style={{ justifySelf: "start" }}>
                Request the next session
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* About / talent */}
      <section id="about">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              About Strategic Value+ · Our talent pool
            </span>
            <h2>A bench built on the plant floor</h2>
            <p className="lede">
              Strategic Value+ is a network of transformational manufacturing
              talent: practitioners who have run lines, passed audits, secured
              networks and turned around suppliers. We match the right people to
              each gap, under one accountable engagement lead.
            </p>
          </div>

          <div className="sub-head">
            <h3>Core team</h3>
            <p>The people accountable for every engagement.</p>
          </div>
          <div className="team">
            <article className="person">
              <span className="avatar" aria-hidden="true">
                NV
              </span>
              <div>
                <h4>Nel Varenas</h4>
                <span className="title">CEO &amp; Co-Founder</span>
                <p>
                  Plant-floor roots at Toyota and Northrop Grumman. ISO
                  9001:2015 Certified Auditor. MBA, Finance and Accounting, UC
                  Davis.
                </p>
              </div>
            </article>
          </div>

          <div className="sub-head">
            <h3>The full bench</h3>
            <p>
              Specialist roles across the network, organized by the gate they
              help you clear.
            </p>
          </div>
          <div className="bench">
            <div className="bench-col">
              <span className="num">Gate 1 · Quality</span>
              <ul>
                <li>AS9100 and ISO 9001 lead auditors</li>
                <li>Quality engineers and managers</li>
                <li>APQP, PPAP and first-article specialists</li>
                <li>Six Sigma and root-cause practitioners</li>
              </ul>
            </div>
            <div className="bench-col">
              <span className="num">Gate 2 · Cyber</span>
              <ul>
                <li>CMMC and NIST 800-171 specialists</li>
                <li>DFARS and SPRS compliance advisors</li>
                <li>Secure IT and OT architects</li>
                <li>Policy and evidence writers</li>
              </ul>
            </div>
            <div className="bench-col">
              <span className="num">Gate 3 · Operations</span>
              <ul>
                <li>Theory of Constraints practitioners</li>
                <li>Lean and Toyota Production System veterans</li>
                <li>Plant and operations leaders</li>
                <li>Estimating and quoting experts</li>
              </ul>
            </div>
            <div className="bench-col">
              <span className="num">Gate 4 · Compliance</span>
              <ul>
                <li>ITAR and EAR program builders</li>
                <li>Federal contracting and capture professionals</li>
                <li>Supply-chain and trade compliance</li>
                <li>SAM.gov and registration support</li>
              </ul>
            </div>
            <div className="bench-col wide">
              <span className="num">Growth and transformation</span>
              <ul>
                <li>Supply-chain and digital twin analysts</li>
                <li>AI and data specialists, through Cogniverai</li>
                <li>Workforce development and immersive training</li>
                <li>Finance, ESOP and succession advisors</li>
                <li>Program managers for funded cohorts</li>
              </ul>
            </div>
          </div>
          <div className="origins">
            <span className="k">Where our people come from</span>
            <div className="eco" style={{ marginTop: 0 }}>
              <span>Commercial aerospace OEMs</span>
              <span>Defense primes</span>
              <span>Tier 1–3 suppliers</span>
              <span>Automotive and the Toyota Production System</span>
              <span>Federal programs and agencies</span>
              <span>Manufacturing extension and universities</span>
            </div>
          </div>

          <div className="vet">
            <div className="stack" style={{ gap: 12 }}>
              <span className="eyebrow">How we vet every resource</span>
              <h3 style={{ fontSize: "2rem" }}>
                Checked before anyone meets a client
              </h3>
              <p style={{ color: "var(--muted)" }}>
                Defense and aerospace work demands people you can trust with
                your floor and your data. Every V+ resource clears the same
                standard.
              </p>
            </div>
            <ul className="checks">
              <li>Credentials and certifications verified with the issuing body</li>
              <li>Two professional references checked</li>
              <li>NDA and V+ code of conduct signed before any client contact</li>
              <li>Professional liability insurance in place</li>
              <li>U.S.-person status confirmed for ITAR and CUI work</li>
              <li>
                Security clearance status recorded where a program requires it
              </li>
            </ul>
          </div>

          <div className="deploy">
            <div>
              <strong>Matched to the gap</strong>
              <span>
                Each specialist is chosen for the gate and the stage your
                roadmap is in.
              </span>
            </div>
            <div>
              <strong>Vetted before assignment</strong>
              <span>
                Every resource meets the standard above before an assignment
                starts.
              </span>
            </div>
            <div>
              <strong>One accountable lead</strong>
              <span>
                A Strategic Value+ engagement lead owns the plan, the milestones
                and the result.
              </span>
            </div>
          </div>

          <Link className="teaser" href="/careers">
            <span>
              <b>Are you a manufacturing expert?</b> Join the V+ resource
              network.
            </span>
            <span className="go">Become a V+ resource →</span>
          </Link>
          <p style={{ color: "var(--muted)", marginTop: 28 }}>
            Strategic Value Plus Solutions, LLC is registered in Delaware, with
            our office in Dover. We deliver across North Carolina and Southern
            California.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact">
        <div className="wrap split">
          <div className="stack" style={{ gap: 24 }}>
            <div className="stack" style={{ gap: 14 }}>
              <span className="eyebrow">Contact</span>
              <h2>Book a 30-minute call</h2>
              <p className="lede">
                Tell us which OEM or program you&apos;re chasing. We&apos;ll
                tell you, plainly, which gate stands in the way.
              </p>
            </div>
            <div className="contact-facts">
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
              <div className="fact">
                <span className="k">Office</span>
                <span className="v" style={{ fontWeight: 500 }}>
                  Dover, Delaware
                </span>
              </div>
            </div>
          </div>
          <div>
            <VPlusContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
