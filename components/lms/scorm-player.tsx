"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import type {
  EnrollmentDoc,
  ScormPackageDoc,
} from "@/lib/schema";
import { getScormRuntime } from "@/lib/lms";
import { Loader2 } from "lucide-react";

interface ScormPlayerProps {
  enrollment: EnrollmentDoc;
  pkg: ScormPackageDoc;
  onStatusChange?: (status: {
    lessonStatus?: string;
    scoreRaw?: string;
  }) => void;
}

/**
 * Hosts a SCORM package in an iframe with a same-origin scorm-again runtime.
 * - SCORM 1.2 and SCORM 2004 supported
 * - Commit data is POSTed to /api/scorm/commit and persisted to Firestore
 * - Prior CMI data is loaded back for resume support
 */
export function ScormPlayer({ enrollment, pkg }: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [launchUrl, setLaunchUrl] = useState("");

  useEffect(() => {
    let api: {
      terminate?: (callbackName: string, checkTerminated: boolean) => string;
    } | null = null;
    let mounted = true;

    const init = async () => {
      try {
        // Mint a signed scorm_session cookie authorizing content + commit
        if (!auth?.currentUser) throw new Error("Not signed in");
        const idToken = await auth.currentUser.getIdToken();
        const tokenRes = await fetch("/api/scorm/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ packageId: pkg.id }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
          throw new Error(tokenData.error || "Could not start course session");
        }
        if (mounted) setLaunchUrl(tokenData.launchUrl);

        const prior = await getScormRuntime(enrollment.id, enrollment.firebaseUid);

        const commitUrl =
          `/api/scorm/commit?enrollmentId=${enrollment.id}` +
          `&studentId=${enrollment.studentId}` +
          `&courseId=${enrollment.courseId}` +
          `&version=${pkg.version}`;

        const settings = {
          autocommit: true,
          autocommitSeconds: 60,
          lmsCommitUrl: commitUrl,
          dataReportFormat: "JSON",
          mastery_override: false,
          selfReportSessionTime: true,
          alwaysSendTotalTime: true,
          strict_errors: false,
        };

        const scormAgain = await import("scorm-again");

        if (pkg.version === "2004") {
          const api2004 = new scormAgain.Scorm2004API(settings);
          if (prior?.cmiData) {
            api2004.loadFromFlattenedJSON(
              prior.cmiData as Record<string, string>
            );
          }
          (window as unknown as Record<string, unknown>).API_1484_11 = api2004;
          api = api2004;
        } else {
          const api12 = new scormAgain.Scorm12API(settings);
          if (prior?.cmiData) {
            api12.loadFromFlattenedJSON(
              prior.cmiData as Record<string, string>
            );
          }
          (window as unknown as Record<string, unknown>).API = api12;
          api = api12;
        }

        if (!mounted) return;
        setLoading(false);
      } catch (e) {
        console.error("[ScormPlayer] init error:", e);
        if (mounted) {
          setError(
            e instanceof Error
              ? e.message
              : "Failed to initialize the SCORM runtime."
          );
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      try {
        api?.terminate?.("LMSFinish", true);
      } catch {
        // best-effort terminate
      }
      delete (window as unknown as Record<string, unknown>).API;
      delete (window as unknown as Record<string, unknown>).API_1484_11;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollment.id, pkg.id]);

  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#1478ac]" />
        </div>
      )}
      {error ? (
        <div className="flex items-center justify-center min-h-[400px] border rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={launchUrl || undefined}
          title={pkg.title || "SCORM Course"}
          className="w-full min-h-[600px] rounded-lg border bg-white"
          allow="autoplay; fullscreen"
        />
      )}
    </div>
  );
}
