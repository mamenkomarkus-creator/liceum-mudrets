// Receives Content-Security-Policy violation reports from browsers and writes them to the Vercel logs,
// so the policy can be checked before it is enforced (see next.config.ts).
export async function POST(request: Request) {
  const body = (await request.text()).slice(0, 4000);
  try {
    const report = JSON.parse(body) as Record<string, unknown>;
    const r = (report["csp-report"] ?? report) as Record<string, unknown>;
    console.warn(
      JSON.stringify({
        scope: "csp",
        directive: r["violated-directive"] ?? r["effective-directive"],
        blocked: r["blocked-uri"],
        page: r["document-uri"],
      })
    );
  } catch {
    // Not JSON: nothing useful to log.
  }
  return new Response(null, { status: 204 });
}
