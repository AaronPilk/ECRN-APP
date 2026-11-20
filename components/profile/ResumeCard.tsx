"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, FileUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { resumeLinkAction, setResumePathAction } from "@/app/(app)/candidate/resume/actions";

/** Upload / replace / view the member's resume, or jump into the builder. */
export function ResumeCard({
  userId,
  resumePath,
  uploadedAt,
  hasBuilt,
}: {
  userId: string;
  resumePath: string | null;
  uploadedAt: string | null;
  hasBuilt: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (file.size > 10 * 1024 * 1024) return setError("That file is over 10 MB.");
    setBusy(true);
    const ext = (file.name.split(".").pop() ?? "pdf").toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
    const path = `${userId}/resume-${Date.now()}.${ext}`;
    const { error: upErr } = await getSupabaseBrowserClient()
      .storage.from("resumes")
      .upload(path, file, { contentType: file.type || undefined });
    if (upErr) {
      setBusy(false);
      return setError("Upload failed. Try a PDF.");
    }
    const r = await setResumePathAction(path);
    setBusy(false);
    if (!r.ok) return setError(r.error ?? "Couldn't save.");
    router.refresh();
  }

  async function view() {
    const url = await resumeLinkAction();
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <div id="resume" className="group-surface p-5 scroll-mt-24">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-[12px] bg-ecrn-action-surface grid place-items-center shrink-0">
          <FileText className="w-5 h-5 text-ecrn-green-text" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-[18px] font-semibold text-ecrn-ink">Resume</h2>
          <p className="text-[13.5px] text-ecrn-secondary">
            {resumePath
              ? `Uploaded ${uploadedAt ? new Date(uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}. Only Delta recruiters can see it.`
              : hasBuilt
                ? "Built with ECRN. You can also upload a file."
                : "Upload one, or answer a few questions and we'll build it."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant={resumePath ? "secondary" : "primary"} onClick={() => fileRef.current?.click()} loading={busy}>
          <FileUp className="w-4 h-4" /> {resumePath ? "Replace" : "Upload"}
        </Button>
        <Link href="/candidate/resume/build">
          <Button variant="soft" fullWidth>
            <Sparkles className="w-4 h-4" /> {hasBuilt ? "Edit built resume" : "Build with us"}
          </Button>
        </Link>
      </div>
      <div className="mt-2 flex gap-4 text-[13.5px]">
        {resumePath && (
          <button type="button" onClick={view} className="font-medium text-ecrn-green-text">
            View file
          </button>
        )}
        {hasBuilt && (
          <Link href="/candidate/resume" className="font-medium text-ecrn-green-text">
            View built resume
          </Link>
        )}
      </div>
      {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
    </div>
  );
}
