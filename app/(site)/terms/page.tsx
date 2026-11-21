import "@/components/site/inner/inner.css";
import type { Metadata } from "next";
import { PageHero } from "@/components/site/Blocks";
import { LEGAL_UPDATED, SUPPORT_EMAIL } from "@/components/legal/LegalPage";
import { JsonLd } from "@/components/site/SiteChrome";
import { Band, Crumbs, DeltaNote } from "@/components/site/inner/Kit";
import { LegalDoc, type TocItem } from "@/components/site/inner/Legal";
import { breadcrumbJsonLd, pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Terms of Use & Referral Program Terms | ECRN",
  description:
    "The terms for using ECRN and the ECRN Referral Compensation Program: eligibility, payout tiers, the 90-day guarantee period, taxes, and disputes.",
  path: "/terms",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Terms of Use", path: "/terms" },
];

const TOC: TocItem[] = [
  { id: "account", label: "Your account" },
  { id: "submitting", label: "Submitting referrals" },
  { id: "ownership", label: "Referral ownership" },
  { id: "payouts", label: "Referral payouts" },
  { id: "job-seekers", label: "Job seekers" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "program", label: "Referral Compensation Program" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <PageHero
        eyebrow="Legal"
        title="Terms of Use"
        image="conduit-racks"
        intro={
          <p>
            Last updated {LEGAL_UPDATED}. The terms for using ECRN and the ECRN Referral Compensation Program.
          </p>
        }
      />

      <Crumbs items={CRUMBS} />

      <Band first>
        <LegalDoc toc={TOC}>
          <p>
            These terms govern your use of ECRN, a referral network operated by Delta Construction Partners
            (&quot;Delta&quot;). By creating an account you agree to them.
          </p>

          <h2 id="account">Your account</h2>
          <ul>
            <li>You must be 18 or older and provide accurate information.</li>
            <li>Keep your login secure. You&apos;re responsible for activity on your account.</li>
            <li>You can delete your account at any time from Profile → Delete account.</li>
          </ul>

          <h2 id="submitting">Submitting referrals</h2>
          <ul>
            <li>Only refer people you actually know, and only submit information you&apos;re allowed to share.</li>
            <li>Don&apos;t submit false, misleading, or duplicate information to claim a payout.</li>
            <li>Referred people may be contacted by Delta about job opportunities.</li>
          </ul>

          <h2 id="ownership">Referral ownership</h2>
          <p>
            The first person to refer a candidate is that candidate&apos;s primary referrer. Later
            submissions of the same person are recorded for review and do not change ownership unless Delta
            decides otherwise after review. Delta&apos;s determination of ownership is final.
          </p>

          <h2 id="payouts">Referral payouts</h2>
          <ul>
            <li>
              A payout may be earned when Delta places a candidate for whom you are the primary referrer. The
              amount for each role is shown in the app and is shown as an estimate of up to $10,000 (see the program terms below).
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

          <h2 id="job-seekers">Job seekers</h2>
          <p>
            Applying through ECRN doesn&apos;t guarantee an interview or offer. Your information is shared
            with hiring companies only as part of the recruiting process.
          </p>

          <h2 id="acceptable-use">Acceptable use</h2>
          <p>
            Don&apos;t misuse ECRN: no scraping, spamming, impersonation, or attempts to access other
            users&apos; data. We may suspend accounts that break these terms.
          </p>

          <h2 id="disclaimers">Disclaimers</h2>
          <p>
            ECRN is provided &quot;as is.&quot; To the extent allowed by law, Delta isn&apos;t liable for indirect
            or consequential damages arising from use of the service.
          </p>

          <h2 id="program">ECRN Referral Compensation Program (effective April 2026)</h2>
          <p>
            These program terms are provided by Delta Construction Partners and are subject to final review and approval by its legal
            counsel. Where they differ from the general terms above, these program terms control for referral compensation.
          </p>
          <h3>Eligibility</h3>
          <p>
            You must be a registered ECRN member in good standing, 18 or older, and legally authorized to work in the United States.
            Employees and immediate family members of Delta Construction Partners are not eligible to receive referral compensation.
          </p>
          <h3>Compensation structure</h3>
          <p>
            Referral compensation is variable and determined at the sole discretion of Delta Construction Partners. Figures shown on ECRN
            are estimates only. Estimated tiers:
          </p>
          <ul>
            <li><strong>Tier 1, field positions:</strong> up to $2,500 per placement (wiremen, journeymen, electricians).</li>
            <li><strong>Tier 2, field leadership:</strong> up to $5,000 (foremen, superintendents, field professionals).</li>
            <li><strong>Tier 3, office positions:</strong> up to $7,500 (estimators and project managers at all levels).</li>
            <li><strong>Tier 4, executive leadership:</strong> up to $10,000 (CEOs, COOs, vice presidents).</li>
          </ul>
          <p>Final amounts are confirmed in writing by Delta Construction Partners before processing and may be adjusted at any time.</p>
          <h3>No guarantee of compensation</h3>
          <p>
            Participation does not guarantee compensation. Payouts depend on successful placement, completion of the guarantee period,
            and final approval by Delta Construction Partners.
          </p>
          <h3>Payout conditions</h3>
          <p>
            Compensation is paid only after placement and completion of the guarantee period, typically 90 days from the referred
            person&apos;s start date. If the placement ends before then, no compensation is issued, and compensation already issued may be
            recouped at Delta&apos;s discretion.
          </p>
          <h3>Referral submission</h3>
          <p>
            Referrals must be submitted through the official ECRN platform. Duplicate referrals of the same person are attributed to the
            first verified submission on record.
          </p>
          <h3>Taxes</h3>
          <p>
            Referral compensation may be taxable income, and you are responsible for any taxes. Delta issues a Form 1099 for compensation
            totaling $600 or more in a calendar year where required by law.
          </p>
          <h3>Program changes and disputes</h3>
          <p>
            Delta may modify, suspend, or end the program at any time. Disputes about compensation must be submitted in writing within 30
            days of the disputed event, and Delta&apos;s determination is final. These program terms are governed by the laws of the State of
            Florida, with any legal action brought in Florida state or federal courts.
          </p>

          <h2 id="contact">Contact</h2>
          <p>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </LegalDoc>

        <DeltaNote className="mt-14 sm:mt-20" />
      </Band>
    </>
  );
}
