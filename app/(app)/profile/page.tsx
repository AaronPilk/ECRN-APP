import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AddToHomeScreenGuide } from "@/components/onboarding/AddToHomeScreenGuide";
import { InviteLink } from "@/components/profile/InviteLink";
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
  const invitedCount = profile.role === "referral_partner" ? await countInvitedBy(profile.id) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
        Your profile
      </h1>

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
          <Row label="Role" value={profile.role.replace(/_/g, " ")} />
        </CardContent>
      </Card>

      {profile.role === "referral_partner" && (
        <div id="invite">
          <h2 className="text-base font-semibold text-ecrn-ink mb-3">Invite others to ECRN</h2>
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
        <h2 className="text-base font-semibold text-ecrn-ink mb-3">Account</h2>
        <Card className="divide-y divide-slate-100 overflow-hidden">
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
    </div>
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
