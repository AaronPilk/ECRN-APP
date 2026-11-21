/** Public release identifier; native clients use it to load new web bundles. */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { version: process.env.NEXT_PUBLIC_ECRN_BUILD_ID ?? "development" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
