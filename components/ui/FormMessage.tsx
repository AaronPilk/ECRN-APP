import { cn } from "@/lib/utils/cn";

/** Inline error / success banner driven by ?error= and ?message= params. */
export function FormMessage({
  error,
  message,
  className,
}: {
  error?: string;
  message?: string;
  className?: string;
}) {
  if (!error && !message) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "p-3 rounded-xl text-sm border leading-relaxed",
        error
          ? "bg-red-50 border-red-200/70 text-red-800"
          : "bg-emerald-50 border-emerald-200/70 text-emerald-900",
        className
      )}
    >
      {error ?? message}
    </div>
  );
}
