import { ComingSoon } from "@/components/ComingSoon";

export default function AdminCandidatesPage() {
  return (
    <ComingSoon
      title="All candidates"
      description="Searchable, filterable candidate table with duplicate detection, ownership, status changes, and CSV export. Coming in Batch 4."
      batch={4}
      backHref="/admin"
    />
  );
}
