"use client";

import Link from "next/link";

import { useState } from "react";

const links = [
  { title: "Four Gates", href: "/#gates" },
  { title: "Services", href: "/#offers" },
  { title: "For OEM buyers", href: "/#oem" },
  { title: "Partners", href: "/#partners" },
  { title: "Insights", href: "/#insights" },
  { title: "Our talent", href: "/#about" },
  { title: "Join our network", href: "/careers" },
];

export function VPlusHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site">
      <div className="wrap nav">
        <Link className="brand" href="/#top" aria-label="Strategic Value+ home">
          <span className="mark">V+</span>
          <b>
            Strategic Value<span>+</span>
          </b>
        </Link>
        <nav className={`links${open ? " open" : ""}`} id="links" aria-label="Main">
          {links.map((link) => (
            <Link key={link.title} href={link.href} onClick={() => setOpen(false)}>
              {link.title}
            </Link>
          ))}
          <Link className="cog" href="/cogniverai" onClick={() => setOpen(false)}>
            Cogniverai
          </Link>
        </nav>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link className="btn primary hide-sm" href="/#contact">
            Book a 30-minute call
          </Link>
          <button
            className="menu-btn"
            aria-expanded={open}
            aria-controls="links"
            onClick={() => setOpen((o) => !o)}
          >
            Menu
          </button>
        </div>
      </div>
    </header>
  );
}
