import Link from "next/link";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Thanks", robots: { index: false, follow: true } };

export default function HireThanksPage() {
  return (
    <div className="flex flex-col py-16">
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center text-2xl">✓</div>
          <h1 className="mt-5 text-2xl font-bold text-ecrn-ink">We&apos;ve got it.</h1>
          <p className="mt-2 text-slate-600">
            Your hiring need is in front of Delta&apos;s recruiting team. Someone will reach out
            shortly.
          </p>
          <Link href="/" className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center rounded-[15px] border border-ecrn-line bg-white px-4 text-[15px] font-medium text-ecrn-ink hover:bg-ecrn-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-ecrn-green">
            Back to home
          </Link>
        </Card>
      </div>
    </div>
  );
}
