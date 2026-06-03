/**
 * Normalises S3 pre-signed URLs so images never expire.
 *
 * /public/* paths  → rewrite to cdn.sportyexpats.fr (CDN mirrors this prefix)
 * /uploads/* paths → keep the full pre-signed URL (bucket is private, signature required)
 * Everything else  → returned as-is (Clerk, external, already-CDN)
 */
export function normalizeMediaUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    // Already on CDN or not S3 — leave unchanged
    if (parsed.hostname === "cdn.sportyexpats.fr") return url;
    if (!parsed.hostname.includes("amazonaws.com")) return url;

    const pathname = parsed.pathname;

    if (pathname.startsWith("/public/")) {
      // CDN mirrors /public — strip prefix and serve from CDN
      return `https://cdn.sportyexpats.fr${pathname.replace(/^\/public/, "")}`;
    }

    // /uploads/ or anything else — keep the full pre-signed URL intact
    return url;
  } catch {
    return url;
  }
}
