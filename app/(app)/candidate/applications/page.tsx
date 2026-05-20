import { ComingSoon } from "@/components/ComingSoon";

export default function ApplicationsPage() {
  return (
    <ComingSoon
      title="My applications"
      description="Track applications you've submitted directly. Coming in Batch 3."
      batch={3}
      backHref="/candidate"
    />
  );
}
