import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { getCurrentProfile } from "@/lib/auth/session";
import { resetPasswordAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  // The reset email link signs the user in via /auth/callback first.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/forgot-password?error=" + encodeURIComponent("That reset link expired. Request a new one."));

  return (
    <Card className="p-7 animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-ecrn-ink">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-slate-500">For {profile.email}</p>

      <FormMessage error={sp.error} className="mt-5" />

      <form action={resetPasswordAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <Button type="submit" variant="dark" fullWidth size="lg">
          Save password
        </Button>
      </form>
    </Card>
  );
}
