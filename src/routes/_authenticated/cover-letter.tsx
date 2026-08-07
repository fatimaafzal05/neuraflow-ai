import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { Loader2, Sparkles, Copy, Trash2, Mail } from "lucide-react";
import { generateCoverLetter } from "@/lib/ai.functions";
import { MessageContent } from "@/components/chat/message-content";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/cover-letter")({
  head: () => ({ meta: [{ title: "Cover Letter · NeuraFlow AI" }] }),
  component: CoverLetterPage,
});

function CoverLetterPage() {
  const qc = useQueryClient();
  const gen = useServerFn(generateCoverLetter);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [bg, setBg] = useState("");
  const [tone, setTone] = useState<"professional" | "enthusiastic" | "warm" | "concise">(
    "professional",
  );
  const [preview, setPreview] = useState<string>("");

  const { data: letters } = useQuery({
    queryKey: ["cover-letters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cover_letters")
        .select("id, company, role, content, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () =>
      gen({ data: { company, role, jobDescription: jd, background: bg, tone } }),
    onSuccess: (res) => {
      setPreview(res.content);
      toast.success("Cover letter ready");
      qc.invalidateQueries({ queryKey: ["cover-letters"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = async (id: string) => {
    await supabase.from("cover_letters").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["cover-letters"] });
  };

  return (
    <div>
      <PageHeader title="Cover Letter" description="Tailored, sharp, and in your voice." />
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <h2 className="font-display text-xl tracking-tight">Generate</h2>
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Company</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Job description</Label>
              <Textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={5}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Your background</Label>
              <Textarea
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                rows={5}
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
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending ||
                !company.trim() ||
                !role.trim() ||
                jd.trim().length < 20 ||
                bg.trim().length < 20
              }
              className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Generate cover letter
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl tracking-tight">Preview</h2>
            {preview && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(preview);
                  toast.success("Copied");
                }}
              >
                <Copy className="mr-1.5 size-3.5" /> Copy
              </Button>
            )}
          </div>
          <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-background p-6">
            {preview ? (
              <MessageContent text={preview} />
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Your cover letter will appear here.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur lg:col-span-2">
          <h2 className="font-display text-xl tracking-tight">Saved letters</h2>
          <div className="mt-4 divide-y divide-border">
            {(letters ?? []).length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">No cover letters yet.</p>
            )}
            {letters?.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-brand-glow" />
                  <div>
                    <div className="text-sm font-medium">
                      {l.role} — {l.company}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setPreview(l.content)}>
                    Open
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(l.id)}>
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
