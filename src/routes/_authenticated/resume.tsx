import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Download, Trash2, FileText } from "lucide-react";
import { createOfflineResume } from "@/lib/offline-assistant";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({ meta: [{ title: "Resume Builder · NeuraFlow AI" }] }),
  component: ResumePage,
});

type ResumeData = {
  full_name: string;
  headline: string;
  summary: string;
  contact: { email: string; phone: string; location: string; website: string };
  experience: { company: string; role: string; start: string; end: string; bullets: string[] }[];
  education: { school: string; degree: string; start: string; end: string }[];
  skills: string[];
  projects: { name: string; description: string }[];
};

function ResumePage() {
  const qc = useQueryClient();
  const [role, setRole] = useState("");
  const [targetJob, setTargetJob] = useState("");
  const [background, setBackground] = useState("");
  const [tone, setTone] = useState<"professional" | "confident" | "friendly" | "concise">(
    "professional",
  );
  const [preview, setPreview] = useState<ResumeData | null>(null);

  const { data: resumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("id, title, target_role, data, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const resume = createOfflineResume({ role, targetJob, background });
      const { data, error } = await supabase
        .from("resumes")
        .insert({ title: `${resume.full_name} — ${role}`, target_role: role, data: resume })
        .select("id")
        .single();
      if (error) throw error;
      return { id: data?.id, resume };
    },
    onSuccess: (res) => {
      toast.success("Resume ready");
      setPreview(res.resume as ResumeData);
      qc.invalidateQueries({ queryKey: ["resumes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = async (id: string) => {
    await supabase.from("resumes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["resumes"] });
  };

  return (
    <div>
      <PageHeader
        title="Resume Builder"
        description="ATS-friendly resumes drafted, structured, and tailored in seconds."
      />
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <h2 className="font-display text-xl tracking-tight">Generate</h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label>Target role</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Senior Product Designer"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Target job description (optional)</Label>
              <Textarea
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                placeholder="Paste the JD for sharper keyword alignment"
                rows={4}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Your background</Label>
              <Textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Paste your current resume, LinkedIn text, or raw notes"
                rows={8}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="confident">Confident</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !role.trim() || background.trim().length < 20}
              className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Generate resume
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl tracking-tight">Preview</h2>
            {preview && (
              <Button size="sm" variant="secondary" onClick={() => downloadResume(preview)}>
                <Download className="mr-1.5 size-3.5" /> Download
              </Button>
            )}
          </div>
          {preview ? (
            <ResumePreview data={preview} />
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Your generated resume will appear here.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur lg:col-span-2">
          <h2 className="font-display text-xl tracking-tight">Saved resumes</h2>
          <div className="mt-4 divide-y divide-border">
            {(resumes ?? []).length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">No resumes yet.</p>
            )}
            {resumes?.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-brand-glow" />
                  <div>
                    <div className="text-sm font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.target_role} ·{" "}
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreview(r.data as unknown as ResumeData)}
                  >
                    Open
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ResumePreview({ data }: { data: ResumeData }) {
  return (
    <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-background p-6 text-sm">
      <div className="text-center">
        <h3 className="font-display text-2xl tracking-tight">{data.full_name}</h3>
        <p className="text-sm text-muted-foreground">{data.headline}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {[data.contact.email, data.contact.phone, data.contact.location, data.contact.website]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <Section title="Summary">
        <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
      </Section>
      <Section title="Experience">
        {data.experience.map((e, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-baseline justify-between">
              <div className="text-sm font-semibold">
                {e.role} · <span className="font-normal text-muted-foreground">{e.company}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {e.start} — {e.end}
              </div>
            </div>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {e.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Education">
        {data.education.map((ed, i) => (
          <div key={i} className="mb-2 flex items-baseline justify-between">
            <div>
              <div className="text-sm font-medium">{ed.degree}</div>
              <div className="text-xs text-muted-foreground">{ed.school}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {ed.start} — {ed.end}
            </div>
          </div>
        ))}
      </Section>
      <Section title="Skills">
        <div className="flex flex-wrap gap-1.5">
          {data.skills.map((s, i) => (
            <span key={i} className="rounded-md bg-secondary px-2 py-0.5 text-xs">
              {s}
            </span>
          ))}
        </div>
      </Section>
      {data.projects?.length > 0 && (
        <Section title="Projects">
          {data.projects.map((p, i) => (
            <div key={i} className="mb-2">
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.description}</div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h4 className="mb-2 border-b border-border pb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

function downloadResume(data: ResumeData) {
  const lines: string[] = [];
  lines.push(data.full_name, data.headline, "");
  lines.push(
    [data.contact.email, data.contact.phone, data.contact.location, data.contact.website]
      .filter(Boolean)
      .join(" · "),
    "",
  );
  lines.push("SUMMARY", data.summary, "");
  lines.push("EXPERIENCE");
  data.experience.forEach((e) => {
    lines.push(`${e.role} — ${e.company} (${e.start} – ${e.end})`);
    e.bullets.forEach((b) => lines.push(`  • ${b}`));
    lines.push("");
  });
  lines.push("EDUCATION");
  data.education.forEach((ed) =>
    lines.push(`${ed.degree} — ${ed.school} (${ed.start} – ${ed.end})`),
  );
  lines.push("", "SKILLS", data.skills.join(", "));
  if (data.projects?.length) {
    lines.push("", "PROJECTS");
    data.projects.forEach((p) => lines.push(`${p.name}: ${p.description}`));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.full_name.replace(/\s+/g, "_")}_resume.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
