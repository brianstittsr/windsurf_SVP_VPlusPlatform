import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "End-User License Agreement | Strategic Value+",
  description: "End-User License Agreement for Strategic Value+ applications and connected services.",
};

export default function EulaPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-8">End-User License Agreement</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: June 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              This End-User License Agreement (&quot;EULA&quot;, &quot;Agreement&quot;) is a legal agreement between you and Strategic Value Plus Solutions LLC (&quot;V+&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) governing your use of the Strategic Value+ applications, web platform, and connected services (collectively, the &quot;Apps&quot;).
            </p>
            <p className="mt-2">
              By downloading, installing, accessing, or using any of the Apps, you agree to be bound by this EULA. If you do not agree, do not download, install, access, or use the Apps.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. License Grant</h2>
            <p>
              Subject to your compliance with this EULA, V+ grants you a limited, non-exclusive, non-transferable, revocable license to download, install, and use the Apps for your personal or internal business use, solely in connection with your authorized use of the Strategic Value+ platform.
            </p>
            <p className="mt-2">
              This license does not allow you to use the Apps on any device that you do not own or control, and you may not distribute or make the Apps available over a network where they could be used by multiple devices at the same time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. License Restrictions</h2>
            <p>You may not, and you may not permit others to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Reproduce, modify, translate, adapt, or create derivative works of the Apps</li>
              <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Apps</li>
              <li>Remove, alter, or obscure any proprietary notices or labels in the Apps</li>
              <li>Rent, lease, lend, sell, sublicense, assign, or otherwise transfer the Apps or your rights under this EULA</li>
              <li>Use the Apps for any unlawful purpose or in violation of any applicable laws or regulations</li>
              <li>Interfere with or disrupt the integrity or performance of the Apps or the platform</li>
              <li>Circumvent any access restrictions, rate limits, or security measures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Accounts and Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use or security breach.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Connected Services and Third-Party Integrations</h2>
            <p>
              The Apps may connect to or integrate with third-party services, platforms, or data sources. Your use of such connected services is subject to their respective terms and privacy policies. V+ is not responsible for the availability, accuracy, or practices of these third-party services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Usage and Privacy</h2>
            <p>
              Your use of the Apps is also governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which explains how we collect, use, and protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p>
              The Apps, including all content, features, designs, code, trademarks, and other materials, are owned by V+ or its licensors and are protected by intellectual property laws. This EULA does not grant you any ownership interest in the Apps or any related intellectual property rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Updates and Modifications</h2>
            <p>
              V+ may, at its discretion, update or modify the Apps, including this EULA, at any time. Continued use of the Apps after such changes constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p>
              This EULA is effective until terminated by you or V+. Your rights under this EULA will terminate automatically if you fail to comply with any of its terms. Upon termination, you must cease all use of the Apps and destroy all copies in your possession.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
            <p>
              The Apps are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, V+ shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Apps, even if advised of the possibility of such damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p>
              This EULA shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              If you have any questions about this End-User License Agreement, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Strategic Value Plus Solutions LLC</strong><br />
              Email: legal@strategicvalueplus.com<br />
              Website: <Link href="https://strategicvalueplus.com" className="text-primary hover:underline">strategicvalueplus.com</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
