import { NextRequest, NextResponse } from "next/server";
import { requireUser, type CaptureUser } from "@/lib/capture/server-auth";

/** Require a staff caller (admin or team) for Grant Builder routes. */
export async function requireGrantStaff(req: NextRequest): Promise<CaptureUser | NextResponse> {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "admin" && user.role !== "team") {
    return NextResponse.json({ error: "Forbidden: staff access required" }, { status: 403 });
  }
  return user;
}
