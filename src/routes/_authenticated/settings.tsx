import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · NeuraFlow AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url, plan, ai_messages_used, ai_messages_limit")
        .eq("id", user.user.id)
        .maybeSingle();
      return data;
    },
  });

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile?.display_name]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <div>
      <PageHeader title="Settings" description="Profile, plan, and preferences." />
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur lg:col-span-2">
          <h2 className="font-display text-xl tracking-tight">Profile</h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} disabled className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={save}
                disabled={saving || !displayName.trim()}
                className="rounded-xl bg-foreground text-background hover:bg-foreground/90"
              >
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl tracking-tight">Plan</h2>
            <Badge variant="secondary" className="capitalize">
              {profile?.plan ?? "free"}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            You're on the {profile?.plan ?? "free"} plan.
          </p>
          <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">AI messages</span>
              <span className="font-medium">
                {profile?.ai_messages_used ?? 0}/{profile?.ai_messages_limit ?? 30}
              </span>
            </div>
          </div>
          {profile?.plan === "free" && (
            <Button className="mt-4 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90">
              <Sparkles className="mr-1.5 size-4" /> Upgrade to Pro
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}
