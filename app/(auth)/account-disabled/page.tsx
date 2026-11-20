import Link from "next/link";
import { SUPPORT_EMAIL } from "@/components/legal/LegalPage";

/** Shown to a signed-in member whose account an admin has deactivated. */
export default function AccountDisabledPage() {
  return (
    <div className="animate-slide-up">
      <h1 className="t-page !text-[32px] !leading-[35px]">This account is paused</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ecrn-secondary">
        Your ECRN account has been deactivated. If you think this is a mistake, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-ecrn-green-text">
          {SUPPORT_EMAIL}
        </a>{" "}
        and we&apos;ll sort it out.
      </p>
      <Link href="/api/logout" prefetch={false} className="mt-6 inline-block text-[15px] font-medium text-ecrn-green-text">
        Log out
      </Link>
    </div>
  );
}
