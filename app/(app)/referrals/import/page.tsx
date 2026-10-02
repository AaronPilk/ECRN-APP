import Link from "next/link";
import { ContactImporter } from "@/components/native/ContactImporter";

export default function ImportContactsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <Link href="/referrals" className="text-sm text-slate-500 hover:text-ecrn-ink">
        ← My referrals
      </Link>
      <ContactImporter />
    </div>
  );
}
