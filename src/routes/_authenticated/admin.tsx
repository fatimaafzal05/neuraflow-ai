import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, FileText, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin · NeuraFlow AI" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

function AdminPage() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [users, chats, resumes, activity] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, display_name, plan, ai_messages_used, ai_messages_limit, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("chats").select("id", { count: "exact", head: true }),
        supabase.from("resumes").select("id", { count: "exact", head: true }),
        supabase
          .from("activity_logs")
          .select("id, user_id, action, resource_type, created_at")
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      const { count: userCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      return {
        userCount: userCount ?? 0,
        chatCount: chats.count ?? 0,
        resumeCount: resumes.count ?? 0,
        users: users.data ?? [],
        activity: activity.data ?? [],
      };
    },
  });

  const stats = [
    { icon: Users, label: "Users", value: data?.userCount ?? 0 },
    { icon: MessageSquare, label: "Chats", value: data?.chatCount ?? 0 },
    { icon: FileText, label: "Resumes", value: data?.resumeCount ?? 0 },
    { icon: TrendingUp, label: "Recent events", value: data?.activity.length ?? 0 },
  ];

  return (
    <div>
      <PageHeader title="Admin" description="Users, activity, and platform health." />
      <div className="grid gap-4 p-6 sm:p-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </span>
              <s.icon className="size-4 text-brand-glow" />
            </div>
            <div className="mt-2 font-display text-3xl tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 px-6 pb-8 sm:px-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <h2 className="font-display text-xl tracking-tight">Latest users</h2>
          <div className="mt-4 divide-y divide-border">
            {data?.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="font-medium">{u.display_name || u.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.email} · {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {u.ai_messages_used}/{u.ai_messages_limit}
                  </span>
                  <Badge variant="secondary" className="capitalize">
                    {u.plan}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <h2 className="font-display text-xl tracking-tight">Activity</h2>
          <div className="mt-4 divide-y divide-border">
            {data?.activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="font-medium">{a.action}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.resource_type ?? "—"} ·{" "}
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
