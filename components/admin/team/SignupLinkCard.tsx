import qrcode from "qrcode-generator";
import { CopyButtons } from "./CopyButtons";

/** QR code as an inline SVG string (pure JS, runs on the server). */
function qrSvg(url: string): string | null {
  try {
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  } catch {
    return null;
  }
}

/**
 * A team member's personal sign-up link: QR code, the code in large type,
 * the full link, and copy / print buttons. Printing the page prints only
 * this card, so it works as a handout.
 */
export function SignupLinkCard({
  name,
  link,
  code,
  active,
}: {
  name: string;
  /** Full link, e.g. https://ecrn.com/r/MIKES */
  link: string;
  code: string;
  active: boolean;
}) {
  const svg = qrSvg(link);
  return (
    <section id="team-signup-card" className="bg-white rounded-[16px] border border-ecrn-line p-5">
      {/* Print just this card. */}
      <style>{`@media print {
  html, body { height: 100% !important; overflow: hidden !important; }
  body * { visibility: hidden !important; }
  #team-signup-card, #team-signup-card * { visibility: visible !important; }
  #team-signup-card { position: fixed; left: 0; top: 0; width: 100%; border: 0; padding: 24px; }
}`}</style>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[16px] font-semibold text-ecrn-ink">
            <span className="print:hidden">Their sign-up link</span>
            <span className="hidden print:inline">Join ECRN with {name}</span>
          </h2>
          <p className="mt-0.5 text-[12.5px] text-ecrn-secondary print:hidden">Everyone who joins through it is credited to {name}.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
        {svg ? (
          <div
            role="img"
            aria-label={`QR code for ${link}`}
            className="w-[168px] h-[168px] shrink-0 rounded-[12px] border border-ecrn-line bg-white p-1.5 [&>svg]:block [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="w-[168px] h-[168px] shrink-0 rounded-[12px] border border-ecrn-line bg-ecrn-paper grid place-items-center text-center text-[12.5px] text-ecrn-secondary px-3">
            QR code unavailable. The link still works.
          </div>
        )}

        <div className="min-w-0 flex-1 basis-[240px]">
          <p className="t-eyebrow">Invite code</p>
          <p className="mt-1 font-display text-[40px] leading-[44px] font-semibold tracking-[0.04em] text-ecrn-ink break-all">{code}</p>
          <p className="mt-3 t-eyebrow">Link</p>
          <p className="mt-1 font-mono text-[13.5px] text-ecrn-ink break-all select-all">{link}</p>
          <div className="mt-4">
            <CopyButtons link={link} code={code} />
          </div>
        </div>
      </div>

      <p className="mt-2 text-[13px] text-ecrn-secondary">Share this link or have people type the code when they sign up.</p>
      {!active && (
        <p className="mt-3 rounded-[12px] bg-amber-50 text-amber-900 px-3.5 py-2.5 text-[13px] print:hidden">
          {name} is inactive, so this link and code do not credit new sign-ups right now.
        </p>
      )}
    </section>
  );
}
