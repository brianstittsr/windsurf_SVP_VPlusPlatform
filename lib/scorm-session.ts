import crypto from "crypto";

/**
 * Signed, short-lived SCORM session tokens.
 *
 * SCORM content plays inside an iframe that cannot send Authorization
 * headers, and relative asset requests inside the package cannot carry query
 * params. So /api/scorm/token mints an HMAC-signed session, delivered as an
 * httpOnly cookie scoped to /api/scorm, which the content + commit routes
 * verify on every request.
 */

export const SCORM_SESSION_COOKIE = "scorm_session";
export const SCORM_SESSION_TTL_SECONDS = 4 * 60 * 60;

const secret = (): string =>
  process.env.SCORM_SESSION_SECRET ||
  process.env.STRIPE_SECRET_KEY ||
  "vplus-dev-scorm-secret";

export interface ScormSession {
  uid: string;
  pkgId: string;
  exp: number;
}

export function signScormSession(
  uid: string,
  pkgId: string,
  ttlSeconds: number = SCORM_SESSION_TTL_SECONDS
): string {
  const payload: ScormSession = {
    uid,
    pkgId,
    exp: Date.now() + ttlSeconds * 1000,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret())
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifyScormSession(
  token: string | undefined | null
): ScormSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto
    .createHmac("sha256", secret())
    .update(data)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString()
    ) as ScormSession;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null;
    }
    if (!payload.uid || !payload.pkgId) return null;
    return payload;
  } catch {
    return null;
  }
}
