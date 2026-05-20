import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AddToHomeScreenGuide } from "@/components/onboarding/AddToHomeScreenGuide";
import { getCurrentProfile } from "@/lib/auth/mock";

export default async function ProfilePage() {
  const profile = (await getCurrentProfile())!;
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
        Your profile
      </h1>

      <Card>
        <CardContent className="py-5 space-y-3">
          <Row label="Name" value={`${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "—"} />
          <Row label="Email" value={profile.email} />
          <Row label="Phone" value={profile.phone ?? "—"} />
          <Row label="Role" value={profile.role.replace("_", " ")} />
        </CardContent>
      </Card>

      <div id="invite">
        <h2 className="text-base font-semibold text-ecrn-ink mb-3">Invite others to ECRN</h2>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-slate-600">
              Sharable invite links land in Batch 2 alongside referral creation. The link will
              attach your ambassador ID so anyone who signs up via your link is connected back to
              you.
            </p>
            <Button size="sm" variant="secondary" disabled className="mt-3">
              Copy invite link
            </Button>
          </CardContent>
        </Card>
      </div>

      <AddToHomeScreenGuide persistent />

      <form action="/api/logout" method="get">
        <Button type="submit" variant="ghost" size="sm">
          Log out
        </Button>
      </form>
    </div>
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
