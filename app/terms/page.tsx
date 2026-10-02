import type { Metadata } from "next";
import { LegalPage, SUPPORT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        These terms govern your use of ECRN, a referral network operated by Delta Construction Partners
        (&quot;Delta&quot;). By creating an account you agree to them.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be 18 or older and provide accurate information.</li>
        <li>Keep your login secure. You&apos;re responsible for activity on your account.</li>
        <li>You can delete your account at any time from Profile → Delete account.</li>
      </ul>

      <h2>Submitting referrals</h2>
      <ul>
        <li>Only refer people you actually know, and only submit information you&apos;re allowed to share.</li>
        <li>Don&apos;t submit false, misleading, or duplicate information to claim a payout.</li>
        <li>Referred people may be contacted by Delta about job opportunities.</li>
      </ul>

      <h2>Referral ownership</h2>
      <p>
        The first person to refer a candidate is that candidate&apos;s primary referrer. Later
        submissions of the same person are recorded for review and do not change ownership unless Delta
        decides otherwise after review. Delta&apos;s determination of ownership is final.
      </p>

      <h2>Referral payouts</h2>
      <ul>
        <li>
          A payout may be earned when Delta places a candidate for whom you are the primary referrer. The
          amount for each role is shown in the app and typically ranges from $1,000 to $10,000.
        </li>
        <li>
          Payouts are approved after the placement is confirmed and any client guarantee period has
          passed. If a placement falls through during that period, the payout may be denied.
        </li>
        <li>
          Amounts shown as &quot;estimated&quot; or &quot;pending&quot; are not guaranteed. Payout tracking in
          the app is informational; Delta will contact you to arrange payment for approved payouts.
        </li>
        <li>Delta may change or end the referral program, with future changes posted here.</li>
        <li>You&apos;re responsible for any taxes on payouts you receive.</li>
      </ul>

      <h2>Job seekers</h2>
      <p>
        Applying through ECRN doesn&apos;t guarantee an interview or offer. Your information is shared
        with hiring companies only as part of the recruiting process.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don&apos;t misuse ECRN: no scraping, spamming, impersonation, or attempts to access other
        users&apos; data. We may suspend accounts that break these terms.
      </p>

      <h2>Disclaimers</h2>
      <p>
        ECRN is provided &quot;as is.&quot; To the extent allowed by law, Delta isn&apos;t liable for indirect
        or consequential damages arising from use of the service.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
