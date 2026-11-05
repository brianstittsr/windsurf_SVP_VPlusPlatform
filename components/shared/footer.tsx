import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const legalLinks = [
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Terms of Service", href: "/terms" },
  { title: "Student Agreement", href: "/eula" },
];

export function Footer() {
  return (
    <footer className="bg-[#071628] text-white">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/images/efvs-logo.png"
                alt="Eagle Flight Vertical Solutions"
                width={180}
                height={52}
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm text-white/70 max-w-xs">
              The EFVS UAS Training Academy delivers FAA Part 107 certification
              preparation and specialized uncrewed aircraft systems training.
            </p>
          </div>

          {/* Academy */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#d3ac63] font-display tracking-wide">
              ACADEMY
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/#courses" className="hover:text-white transition-colors">
                  Course Catalog
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-white transition-colors">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-white transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <a
                  href="https://www.efvertical.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <Globe className="h-3.5 w-3.5" /> efvertical.com
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#d3ac63] font-display tracking-wide">
              CONTACT EFVS
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:info@efvertical.com"
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  info@efvertical.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+18055841157"
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  805-584-1157
                </a>
              </li>
            </ul>
            <p className="text-xs text-white/50 leading-relaxed">
              Platform certificates document completion of EFVS training. They do
              not constitute an FAA Remote Pilot Certificate or replace the FAA
              certification process.
            </p>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} Eagle Flight Vertical Solutions® · A dba
            of Aviante HWC, Inc.
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
