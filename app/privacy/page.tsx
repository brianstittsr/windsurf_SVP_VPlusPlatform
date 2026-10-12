import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Strategic Value+",
  description: "Privacy Policy for Strategic Value+ platform, applications, and connected services.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: June 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Strategic Value Plus Solutions LLC (&quot;V+&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our platform, applications, and connected services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Scope of This Policy</h2>
            <p>
              This Privacy Policy applies to the Strategic Value+ website, web applications, mobile applications, and any connected services or integrations that reference this policy (collectively, the &quot;Services&quot;).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, company name, and job title</li>
              <li><strong>Account Information:</strong> Login credentials and account preferences</li>
              <li><strong>Usage Data:</strong> Information about how you use our platform and connected apps</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, operating system, and mobile device identifiers</li>
              <li><strong>App Data:</strong> App version, installation data, crash logs, and performance diagnostics</li>
              <li><strong>Connected Service Data:</strong> Information you authorize us to receive from third-party integrations, such as OEM portals, CRM systems, or utility providers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Provide and maintain our services</li>
              <li>Process your requests and transactions</li>
              <li>Send you important updates and communications</li>
              <li>Improve our platform, apps, and services</li>
              <li>Secure your account and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Connected Apps and Third-Party Integrations</h2>
            <p>
              When you connect your Strategic Value+ account to third-party applications or services, we may exchange information with those providers as authorized by you. Each connected service is governed by its own privacy policy and terms. We encourage you to review those policies before connecting an integration.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar technologies to operate our Services, understand usage, and improve user experience. You can manage your cookie preferences through your browser or device settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share data with trusted service providers who help us operate the Services, and when required by law or to protect our rights and users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
            <p>
              We retain personal information for as long as necessary to provide the Services, fulfill the purposes described in this policy, and comply with legal obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
              <li>Withdraw consent for optional data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the revised policy and updating the effective date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Strategic Value Plus Solutions LLC</strong><br />
              Email: privacy@strategicvalueplus.com<br />
              Website: <Link href="https://strategicvalueplus.com" className="text-primary hover:underline">strategicvalueplus.com</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
