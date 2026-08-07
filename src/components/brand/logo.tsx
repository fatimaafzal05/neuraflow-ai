import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative size-7 rounded-lg" style={{ background: "var(--gradient-brand)" }}>
        <div
          className="absolute inset-0 rounded-lg opacity-60 blur-md"
          style={{ background: "var(--gradient-brand)" }}
        />
        <svg
          viewBox="0 0 24 24"
          className="relative size-7 text-brand-foreground"
          fill="none"
          aria-hidden
        >
          <path
            d="M6 17V7l6 6 6-6v10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight">
          NeuraFlow<span className="text-muted-foreground"> AI</span>
        </span>
      )}
    </div>
  );
}
