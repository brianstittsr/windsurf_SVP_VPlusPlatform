import Link from "next/link";
import { Factory, Linkedin, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  services: [
    { title: "V+ EDGE™", href: "/v-edge" },
    { title: "TwinEDGE™", href: "/twinedge" },
    { title: "IntellEDGE™", href: "/intelledge" },
    { title: "ISO & QMS", href: "/v-edge/quality" },
    { title: "Reshoring", href: "/v-edge/reshore" },
    { title: "Supplier Readiness", href: "/services/supplier-readiness" },
  ],
  company: [
    { title: "About Us", href: "/about" },
    { title: "Core Team", href: "/about#team" },
    { title: "Affiliates", href: "/affiliates" },
    { title: "Case Studies", href: "/case-studies" },
    { title: "Careers", href: "/careers" },
    { title: "Contact", href: "/contact" },
  ],
  resources: [
    { title: "Blog", href: "/resources/blog" },
    { title: "Guides & Playbooks", href: "/resources/guides" },
    { title: "Webinars", href: "/resources/webinars" },
    { title: "Events", href: "/events" },
    { title: "FAQ", href: "/faq" },
    { title: "News", href: "/news" },
  ],
  legal: [
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Terms of Service", href: "/terms" },
    { title: "Cookie Policy", href: "/cookies" },
    { title: "Accessibility", href: "/accessibility" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Factory className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-none">Strategic Value+</span>
                <span className="text-xs text-gray-400">Transforming U.S. Manufacturing</span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 max-w-xs">
              Helping small- and mid-sized U.S. manufacturers win OEM contracts through 
              supplier qualification, ISO certification, and operational readiness.
            </p>
            <div className="flex gap-4">
              <Link href="https://linkedin.com" className="text-gray-400 hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="https://twitter.com" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="https://youtube.com" className="text-gray-400 hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-accent">Services</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.title}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold text-accent">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.title}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-accent">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.title}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-accent">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>United States</span>
              </li>
              <li>
                <Link href="mailto:info@strategicvalueplus.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                  <Mail className="h-4 w-4" />
                  info@strategicvalueplus.com
                </Link>
              </li>
              <li>
                <Link href="tel:+1-555-123-4567" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                  <Phone className="h-4 w-4" />
                  (555) 123-4567
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Strategic Value+ Solutions. All rights reserved.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="text-sm text-gray-400 hover:text-white transition-colors"
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
