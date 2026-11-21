import "@/components/site/inner/inner.css";
import type { Metadata } from "next";
import { PageHero } from "@/components/site/Blocks";
import { LEGAL_UPDATED, SUPPORT_EMAIL } from "@/components/legal/LegalPage";
import { JsonLd } from "@/components/site/SiteChrome";
import { Band, Crumbs, DeltaNote } from "@/components/site/inner/Kit";
import { LegalDoc, type TocItem } from "@/components/site/inner/Legal";
import { breadcrumbJsonLd, pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Privacy Policy: Your Account and Personal Data | ECRN",
  description:
    "How ECRN collects, uses, and protects your information, including contacts you choose to refer, resumes, and location for nearby jobs.",
  path: "/privacy",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Privacy Policy", path: "/privacy" },
];

const TOC: TocItem[] = [
  { id: "collect", label: "What we collect" },
  { id: "contacts", label: "Your phone's contacts" },
  { id: "face-id", label: "Face ID" },
  { id: "use", label: "How we use information" },
  { id: "contacting", label: "Contacting people you refer" },
  { id: "sharing", label: "Sharing" },
  { id: "tracking", label: "Tracking" },
  { id: "retention", label: "Retention and deletion" },
  { id: "security", label: "Security" },
  { id: "children", label: "Children" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        image="cover-confidential-search"
        intro={<p>Last updated {LEGAL_UPDATED}. How ECRN collects, uses, and protects your information.</p>}
      />

      <Crumbs items={CRUMBS} />

      <Band first>
        <LegalDoc toc={TOC}>
          <p>
            ECRN (the Electrical Construction Referral Network) is operated by Delta Construction Partners
            (&quot;Delta,&quot; &quot;we,&quot; &quot;us&quot;). This policy explains what we collect through the ECRN
            app and website, how we use it, and the choices you have.
          </p>

          <h2 id="collect">What we collect</h2>
          <ul>
            <li>
              <strong>Account information:</strong> your name, email, phone number, location, LinkedIn URL,
              and the role you choose (referral partner, job seeker, or employer).
            </li>
            <li>
              <strong>Referrals you submit:</strong> details you provide about people you refer — name,
              contact information, job title, trade, location, LinkedIn URL, and notes.
            </li>
            <li>
              <strong>Job applications:</strong> information you include when applying, such as a resume
              link and work history.
            </li>
            <li>
              <strong>Hiring requests:</strong> company and contact details submitted through our hiring
              form.
            </li>
            <li>
              <strong>Device information:</strong> if you turn on notifications, a push notification token
              for your device.
            </li>
          </ul>

          <h2 id="contacts">Your phone&apos;s contacts</h2>
          <p>
            If you use &quot;Refer from contacts,&quot; the app asks for permission to read your contacts so
            you can choose people to refer. Your contact list stays on your phone.{" "}
            <strong>Only the specific contacts you select and submit are sent to ECRN.</strong> You can
            revoke contacts access at any time in your phone&apos;s Settings.
          </p>

          <h2 id="face-id">Face ID</h2>
          <p>
            If you turn on Face ID lock, authentication happens entirely on your device. We never receive
            your face data or fingerprint.
          </p>

          <h2 id="use">How we use information</h2>
          <ul>
            <li>To run your account and show your referrals, applications, and payout status.</li>
            <li>To recruit for open roles, contact referred candidates, and place people in jobs.</li>
            <li>To determine referral ownership and calculate referral payouts.</li>
            <li>To send account and status notifications you&apos;ve opted into.</li>
            <li>To keep the service secure and prevent fraud or duplicate claims.</li>
          </ul>

          <h2 id="contacting">Contacting people you refer</h2>
          <p>
            When you refer someone, Delta may contact them about career opportunities. Referred people can
            ask us to stop contacting them or to delete their information at any time by emailing{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>

          <h2 id="sharing">Sharing</h2>
          <p>
            We do not sell personal information and we do not use it for third-party advertising. We share
            information only with: hiring companies, when a candidate is being considered for a role;
            service providers that host and operate ECRN (such as Supabase for our database and Cloudflare
            for hosting), under contract; and authorities when required by law.
          </p>

          <h2 id="tracking">Tracking</h2>
          <p>
            ECRN does not track you across other companies&apos; apps or websites and contains no
            advertising SDKs.
          </p>

          <h2 id="retention">Retention and deletion</h2>
          <p>
            We keep account data while your account is active. You can delete your account at any time in
            the app under Profile → Delete account. This permanently removes your login and profile.
            Recruiting records about candidates you referred may be retained by Delta as part of its
            recruiting business but are no longer linked to you.
          </p>

          <h2 id="security">Security</h2>
          <p>
            Data is encrypted in transit, and access is restricted with row-level security so users can only
            see their own records.
          </p>

          <h2 id="children">Children</h2>
          <p>ECRN is intended for working professionals and is not directed to anyone under 18.</p>

          <h2 id="contact">Contact</h2>
          <p>
            Questions or requests: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </LegalDoc>

        <DeltaNote className="mt-14 sm:mt-20" />
      </Band>
    </>
  );
}
