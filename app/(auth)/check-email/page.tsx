import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Mail } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ email?: string; kind?: string }>;
}

export default async function CheckEmailPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const copy =
    sp.kind === "link"
      ? "If there's an ECRN account for that email, a one-tap login link is on its way."
      : sp.kind === "reset"
        ? "If there's an ECRN account for that email, a password reset link is on its way."
        : "Tap the confirmation link we just sent to finish creating your account.";

  return (
    <Card className="p-8 text-center animate-slide-up">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-ecrn-green/15 text-emerald-700 grid place-items-center">
        <Mail className="w-6 h-6" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-ecrn-ink">Check your email</h1>
      {sp.email && <p className="mt-1 text-sm font-medium text-ecrn-ink">{sp.email}</p>}
      <p className="mt-3 text-slate-600 leading-relaxed">{copy}</p>
      <p className="mt-4 text-xs text-slate-500">Nothing after a few minutes? Check spam, or try again.</p>
      <Link href="/login" className="inline-block mt-6 text-sm font-medium text-ecrn-ink hover:underline">
        Back to log in
      </Link>
    </Card>
  );
}
