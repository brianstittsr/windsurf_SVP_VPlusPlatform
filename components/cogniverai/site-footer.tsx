import Link from "next/link";
export function CogniveraiFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot">
          <div className="stack" style={{ gap: 10 }}>
            <span className="logo">
              cogniver<span>ai</span>
            </span>
            <p>
              An AI adoption collaborative for aerospace and defense
              manufacturing, convened by Strategic Value Plus Solutions, LLC.
            </p>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <Link href="/">Strategic Value+</Link>
            <Link href="/cogniverai#members">Founding members</Link>
            <Link href="/cogniverai#contact">Contact</Link>
          </div>
        </div>
        <div className="legal">
          <span>
            © {new Date().getFullYear()} Strategic Value Plus Solutions, LLC ·
            cogniverai.com
          </span>
          <span>Member names are the property of their respective firms.</span>
        </div>
      </div>
    </footer>
  );
}
