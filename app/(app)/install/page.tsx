import Link from "next/link";
import { AddToHomeScreenGuide } from "@/components/onboarding/AddToHomeScreenGuide";
import { Button } from "@/components/ui/Button";

export default function InstallPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-delta-ink">
          Install ECRN on your phone
        </h1>
        <p className="mt-1 text-slate-500">
          Add ECRN to your home screen for app-like access — no App Store, no download.
        </p>
      </div>

      <AddToHomeScreenGuide persistent />

      <Link href="/dashboard">
        <Button variant="secondary" size="sm">
          ← Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
