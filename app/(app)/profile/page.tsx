import { Card, CardContent } from "@/components/ui/Card";
import { Page, PageTitle } from "@/components/ui/Page";
import { ResumeCard } from "@/components/profile/ResumeCard";
import { AddToHomeScreenGuide } from "@/components/onboarding/AddToHomeScreenGuide";
import { InviteLink } from "@/components/profile/InviteLink";
import { InviteCodeCard } from "@/components/profile/InviteCodeCard";
import { getCurrentProfile } from "@/lib/auth/session";
import Link from "next/link";
import { AppSettings } from "@/components/native/AppSettings";
import { countInvitedBy } from "@/lib/data/repository";
import { headers } from "next/headers";

export default async function ProfilePage() {
  const profile = (await getCurrentProfile())!;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : "https://goecrn.com");
  const inviteUrl = `${appUrl}/r/${profile.id}`;
  const invitedCount = profile.role !== "admin" ? await countInvitedBy(profile.id) : 0;

  const isSeeker = profile.role !== "admin";
  const canInvite = profile.role !== "admin";
  const STATUS: Record<string, string> = {
    actively_looking: "Actively looking",
    open_to_offers: "Open to a move (private)",
    not_looking: "Not looking",
  };

  return (
    <Page>
      <PageTitle eyebrow="Account" title="Profile" />

      {isSeeker && (
        <ResumeCard
          userId={profile.id}
          resumePath={profile.resumePath}
          uploadedAt={profile.resumeUploadedAt}
          hasBuilt={Boolean(profile.resumeBuilder.generated)}
        />
      )}

      <Card>
        <CardContent className="py-5 space-y-3">
          <Row
            label="Name"
            value={`${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "—"}
          />
          <Row label="Email" value={profile.email} />
          <Row label="Phone" value={profile.phone ?? "—"} />
          <Row
            label="Location"
            value={
              [profile.locationCity, profile.locationState].filter(Boolean).join(", ") || "—"
            }
          />
          {isSeeker && profile.discipline && <Row label="What you do" value={profile.discipline} />}
          {isSeeker && profile.yearsExperience && <Row label="Experience" value={`${profile.yearsExperience} years`} />}
          {isSeeker && profile.careerStatus && <Row label="Status" value={STATUS[profile.careerStatus] ?? profile.careerStatus} />}
          {isSeeker && profile.relocation && (
            <Row label="Relocation" value={{ yes: "Open to relocating", maybe: "For the right role", no: "Not relocating" }[profile.relocation]} />
          )}

        </CardContent>
      </Card>

      {/* Shows only while the member has no recruiter (and to confirm right after they connect). */}
      {profile.role !== "admin" && <InviteCodeCard hasRecruiter={Boolean(profile.recruitedByStaffId)} />}

      {canInvite && (
        <div id="invite">
          <h2 className="font-display text-[18px] font-semibold text-ecrn-ink mb-3">Invite others to ECRN</h2>
          <Card>
            <CardContent className="py-5">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Share your personal invite link. Anyone who signs up through it is connected back
                to you.
              </p>
              {invitedCount > 0 && (
                <p className="text-sm font-medium text-emerald-700 mb-4">
                  {invitedCount} {invitedCount === 1 ? "person has" : "people have"} joined through your link.
                </p>
              )}
              <InviteLink inviteUrl={inviteUrl} />
            </CardContent>
          </Card>
        </div>
      )}

      <AppSettings />

      <AddToHomeScreenGuide persistent />

      <div>
        <h2 className="font-display text-[18px] font-semibold text-ecrn-ink mb-3">Account</h2>
        <Card className="divide-y divide-ecrn-line overflow-hidden">
          <LinkRow href="/dashboard?tour=1" label="Replay the app tour" />
          <LinkRow href="/candidate/applications" label="My applications" />
          <LinkRow href="/support" label="Help & support" />
          <LinkRow href="/privacy" label="Privacy policy" />
          <LinkRow href="/terms" label="Terms of use" />
          <form action="/api/logout" method="post">
            <button type="submit" className="w-full text-left px-5 py-3.5 text-[15px] text-ecrn-ink active:bg-slate-50">
              Log out
            </button>
          </form>
          {profile.role !== "admin" && (
            <LinkRow href="/profile/delete" label="Delete account" danger />
          )}
        </Card>
      </div>
    </Page>
  );
}

function LinkRow({ href, label, danger }: { href: string; label: string; danger?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-5 py-3.5 text-[15px] active:bg-slate-50 ${
        danger ? "text-red-600" : "text-ecrn-ink"
      }`}
    >
      {label}
      <span className="text-slate-300">›</span>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-sm font-medium text-ecrn-ink text-right truncate">{value}</div>
    </div>
  );
}
