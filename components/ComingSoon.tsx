import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ComingSoonProps {
  title: string;
  description: string;
  batch: number;
  backHref?: string;
}

/**
 * Placeholder page for routes the nav references but Batch 1 hasn't
 * implemented yet. Keeps navigation working end-to-end while making
 * clear what's coming when.
 */
export function ComingSoon({ title, description, batch, backHref = "/dashboard" }: ComingSoonProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Badge variant="amber" className="mb-3">
        Batch {batch}
      </Badge>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">{title}</h1>
      <p className="mt-2 text-slate-600">{description}</p>

      <Card className="mt-6 p-6">
        <h2 className="text-base font-semibold text-ecrn-ink">What&apos;s ready today</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          The schema, types, and data-access layer for this feature are already wired up. We&apos;re
          building the UI in the next batch.
        </p>
        <div className="mt-5">
          <Link href={backHref}>
            <Button variant="secondary" size="sm">
              ← Back
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
