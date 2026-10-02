import type { Metadata } from "next";
import { LegalPage, SUPPORT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <LegalPage title="Help & Support">
      <p>
        Need a hand with ECRN? Email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and the Delta Construction Partners team
        will get back to you within one business day.
      </p>

      <h2>Common questions</h2>
      <p>
        <strong>How do referral payouts work?</strong>
        <br />
        Refer someone you know. If Delta places them in a role, you&apos;re eligible for that role&apos;s
        referral payout (typically $1,000–$10,000). Track status under Earnings.
      </p>
      <p>
        <strong>Someone already referred my contact — what happens?</strong>
        <br />
        The first referrer keeps ownership. Your submission shows as &quot;Under review&quot; and our team
        checks every duplicate by hand.
      </p>
      <p>
        <strong>I forgot my password.</strong>
        <br />
        On the login screen tap &quot;Forgot password?&quot; or &quot;Email me a link&quot; to sign in without one.
      </p>
      <p>
        <strong>How do I delete my account?</strong>
        <br />
        In the app go to Profile → Delete account. It&apos;s permanent and takes effect immediately.
      </p>
      <p>
        <strong>I&apos;m hiring. How do I work with Delta?</strong>
        <br />
        Submit your hiring need at <a href="/hire">the hiring form</a> and a recruiter will reach out.
      </p>
    </LegalPage>
  );
}
