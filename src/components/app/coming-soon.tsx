import { PageHeader } from "@/components/app/page-header";
import { Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  description,
  copy,
}: {
  title: string;
  description: string;
  copy: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="p-6 sm:p-8">
        <div className="relative overflow-hidden rounded-3xl border border-border p-12 text-center">
          <div className="absolute inset-0 -z-10 opacity-70" style={{ background: "var(--gradient-hero)" }} />
          <Sparkles className="mx-auto size-6 text-brand-glow" />
          <h2 className="mt-4 font-display text-3xl tracking-tight">Coming next</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{copy}</p>
        </div>
      </div>
    </div>
  );
}
