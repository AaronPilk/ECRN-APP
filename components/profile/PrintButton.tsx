"use client";

import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button variant="soft" fullWidth onClick={() => window.print()}>
      Save as PDF
    </Button>
  );
}
