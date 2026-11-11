"use client";

import Link from "next/link";

import { useState } from "react";

const links = [
  { title: "Approach", href: "/cogniverai#approach" },
  { title: "Offers", href: "/cogniverai#offers" },
  { title: "Founding members", href: "/cogniverai#members" },
  { title: "Where we start", href: "/cogniverai#region" },
  { title: "Contact", href: "/cogniverai#contact" },
];

export function CogniveraiHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site">
      <div className="wrap nav">
        <Link className="logo" href="/cogniverai" aria-label="Cogniverai home">
          cogniver<span>ai</span>
        </Link>
        <nav className={`links${open ? " open" : ""}`} id="links" aria-label="Main">
          {links.map((link) => (
            <Link key={link.title} href={link.href} onClick={() => setOpen(false)}>
              {link.title}
            </Link>
          ))}
          <Link className="home" href="/" onClick={() => setOpen(false)}>
            Strategic Value+
          </Link>
        </nav>
        <button
          className="menu-btn"
          aria-expanded={open}
          aria-controls="links"
          onClick={() => setOpen((o) => !o)}
        >
          Menu
        </button>
      </div>
    </header>
  );
}
