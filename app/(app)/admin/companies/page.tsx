import { ComingSoon } from "@/components/ComingSoon";

export default function AdminCompaniesPage() {
  return (
    <ComingSoon
      title="Company hiring leads"
      description="Every company hiring request submitted via /hire. Status pipeline + recruiter assignment. Coming in Batch 5."
      batch={5}
      backHref="/admin"
    />
  );
}
