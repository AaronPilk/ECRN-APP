import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { getCurrentProfile } from "@/lib/auth/session";
import { deleteAccountAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function DeleteAccountPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/profile");

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <Link href="/profile" className="text-sm text-slate-500 hover:text-ecrn-ink">
        ← Profile
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ecrn-ink">Delete your account</h1>

      <Card>
        <CardContent className="py-6 space-y-4">
          <p className="text-[15px] text-slate-700 leading-relaxed">
            This permanently deletes your ECRN account ({profile.email}) and signs you out on every
            device. It can&apos;t be undone.
          </p>
          <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
            <li>Your profile, login, and saved settings are erased.</li>
            <li>Any pending or approved referral payouts are forfeited.</li>
            <li>
              Contacts you referred stay in Delta&apos;s recruiting records but are no longer linked to
              you.
            </li>
          </ul>

          <FormMessage error={sp.error} />

          <form action={deleteAccountAction} className="space-y-3 pt-2">
            <div>
              <Label htmlFor="confirm">Type DELETE to confirm</Label>
              <Input id="confirm" name="confirm" autoComplete="off" autoCapitalize="characters" required />
            </div>
            <Button type="submit" variant="danger" fullWidth size="lg">
              Permanently delete my account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
