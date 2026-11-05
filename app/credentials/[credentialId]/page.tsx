import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, GraduationCap, ShieldCheck } from "lucide-react";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CertificateDoc } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PublicCredentialPage({ params }: { params: Promise<{ credentialId: string }> }) {
  const { credentialId } = await params;
  if (!adminDb) notFound();
  const snapshot = await adminDb.collection(COLLECTIONS.CERTIFICATES)
    .where("publicCredentialId", "==", credentialId)
    .where("publicSharingEnabled", "==", true)
    .where("publicNameConsent", "==", true)
    .limit(1)
    .get();
  if (snapshot.empty) notFound();
  const record = snapshot.docs[0].data() as CertificateDoc;
  if (record.revokedAt) notFound();
  const issuedDate = record.issuedAt?.toDate?.().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) || "";
  const addToProfileUrl = process.env.NEXT_PUBLIC_LINKEDIN_ADD_TO_PROFILE_URL;

  return (
    <main className="min-h-screen bg-[#fdfdfb] text-[#071628]">
      <section className="bg-[#071628] text-white">
        <div className="container py-10">
          <Link href="/" className="font-display text-sm tracking-[0.2em] text-[#56b8e8]">EFVS UAS TRAINING ACADEMY</Link>
        </div>
      </section>
      <div className="container max-w-3xl py-12">
        <Card className="overflow-hidden border-[#d9d8ce]">
          <div className="h-2 bg-[#d3ac63]" />
          <CardHeader className="items-center text-center">
            <div className="rounded-full bg-[#e9f3f8] p-4"><BadgeCheck className="h-10 w-10 text-[#1478ac]" /></div>
            <CardTitle className="mt-2 font-display text-3xl">Verified EFVS Course Credential</CardTitle>
            <CardDescription>This page verifies an EFVS Academy course-completion credential.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Awarded to</p>
              <p className="mt-1 text-2xl font-semibold">{record.studentName}</p>
            </div>
            <div className="rounded-lg bg-[#f8f7f1] p-5">
              <GraduationCap className="mx-auto h-7 w-7 text-[#1478ac]" />
              <h1 className="mt-2 font-display text-xl font-bold">{record.badgeTitle || `${record.courseCode} — Completion`}</h1>
              <p className="mt-1 text-muted-foreground">{record.courseTitle}</p>
            </div>
            <div className="grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Issuing organization</p><p className="font-medium">Eagle Flight Vertical Solutions · EFVS UAS Training Academy</p></div>
              <div className="rounded border p-3"><p className="text-xs text-muted-foreground">Issue date</p><p className="font-medium">{issuedDate}</p></div>
              <div className="rounded border p-3 sm:col-span-2"><p className="text-xs text-muted-foreground">Credential ID</p><p className="font-mono font-medium">{record.certificateNumber}</p></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-700"><ShieldCheck className="h-4 w-4" /> Credential status: verified</div>
            <p className="text-xs text-muted-foreground">This credential documents completion of EFVS training. It is not an FAA Remote Pilot Certificate, does not certify FAA exam passage, and does not replace FAA certification.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {addToProfileUrl ? <Button asChild variant="outline"><a href={addToProfileUrl} target="_blank" rel="noopener noreferrer">Add to LinkedIn</a></Button> : null}
              <Button asChild className="bg-[#1478ac] hover:bg-[#318dc1]"><Link href="/pricing">Explore EFVS Academy courses</Link></Button>
            </div>
            {!addToProfileUrl && <p className="text-xs text-muted-foreground">The EFVS LinkedIn Add to Profile provider link will appear when configured. LinkedIn requires students to enter credential details themselves.</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
