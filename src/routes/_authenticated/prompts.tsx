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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Copy, Plus, Star, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prompts")({
  head: () => ({ meta: [{ title: "Prompt Library · NeuraFlow AI" }] }),
  component: PromptsPage,
});

function PromptsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");

  const { data: prompts } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("id, title, body, category, favorited, created_at")
        .order("favorited", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("prompts").insert({
        user_id: user.user.id,
        title,
        body,
        category: category || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prompt saved");
      setTitle("");
      setBody("");
      setCategory("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["prompts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFav = async (id: string, v: boolean) => {
    await supabase.from("prompts").update({ favorited: !v }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["prompts"] });
  };
  const remove = async (id: string) => {
    await supabase.from("prompts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["prompts"] });
  };

  const filtered = (prompts ?? []).filter((p) =>
    !q ? true : (p.title + " " + p.body + " " + (p.category ?? "")).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Prompt Library"
        description="Save, favorite, and reuse your best prompts."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                <Plus className="mr-1.5 size-4" /> New prompt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New prompt</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Category (optional)</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Writing, Coding, Research…"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Prompt</Label>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="mt-1.5" />
                </div>
                <Button
                  onClick={() => create.mutate()}
                  disabled={!title.trim() || !body.trim() || create.isPending}
                  className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
                >
                  Save prompt
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-6 sm:p-8">
        <Input
          placeholder="Search prompts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-6 max-w-md"
        />
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            <BookOpen className="mx-auto mb-3 size-6 text-brand-glow" />
            No prompts yet — save your first one.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className="group rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold">{p.title}</div>
                    {p.category && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{p.category}</div>
                    )}
                  </div>
                  <button onClick={() => toggleFav(p.id, p.favorited)}>
                    <Star
                      className={`size-4 ${p.favorited ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                    />
                  </button>
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">{p.body}</p>
                <div className="mt-3 flex justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(p.body);
                      toast.success("Copied");
                    }}
                  >
                    <Copy className="mr-1.5 size-3.5" /> Copy
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
