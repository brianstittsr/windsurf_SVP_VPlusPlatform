import Link from "next/link";
export function VPlusFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot">
          <div className="stack" style={{ gap: 10 }}>
            <Link className="brand" href="/#top" style={{ color: "var(--band-ink)" }}>
              <span className="mark">V+</span>
              <b>
                Strategic Value<span style={{ color: "var(--band-brass)" }}>+</span>
              </b>
            </Link>
            <p>
              Helping small and mid-sized U.S. manufacturers win OEM and defense
              contracts through supplier qualification, compliance and
              operational readiness.
            </p>
          </div>
          <div>
            <h4>Services</h4>
            <Link href="/#gates">Four Gates</Link>
            <Link href="/#offers">Constraint Diagnostic</Link>
            <Link href="/#offers">V+ EDGE™</Link>
            <Link href="/#oem">For OEM buyers</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link href="/#about">Our talent</Link>
            <Link href="/careers">Become a V+ resource</Link>
            <Link href="/#partners">Partner program</Link>
            <Link href="/#insights">Insights</Link>
            <Link href="/cogniverai">Cogniverai</Link>
          </div>
          <div>
            <h4>Contact</h4>
            <Link href="/#contact">Book a call</Link>
            <span style={{ display: "block", padding: "3px 0", color: "var(--band-ink)" }}>
              info@strategicvalueplus.com
            </span>
            <span style={{ display: "block", padding: "3px 0", color: "var(--band-ink)" }}>
              (302) 215-4700
            </span>
          </div>
        </div>
        <div className="legal">
          <span>
            © {new Date().getFullYear()} Strategic Value Plus Solutions, LLC ·
            strategicvalueplus.com
          </span>
          <span>V+ EDGE™ is a trademark of Strategic Value Plus Solutions, LLC</span>
        </div>
      </div>
    </footer>
  );
}
