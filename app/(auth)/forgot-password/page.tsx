import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { forgotPasswordAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <Card className="p-7 animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-ecrn-ink">Reset your password</h1>
      <p className="mt-1.5 text-sm text-slate-500">Enter your email and we&apos;ll send a reset link.</p>

      <FormMessage error={sp.error} className="mt-5" />

      <form action={forgotPasswordAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" autoFocus />
        </div>
        <Button type="submit" variant="dark" fullWidth size="lg">
          Send reset link
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm">
        <Link href="/login" className="font-medium text-ecrn-ink hover:underline">
          Back to log in
        </Link>
      </div>
    </Card>
  );
}
