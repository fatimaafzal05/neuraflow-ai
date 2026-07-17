import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  FileText,
  Mail,
  MessageSquare,
  Mic,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · NeuraFlow AI" }] }),
  component: DashboardPage,
});

const QUICK = [
  { to: "/chat", icon: MessageSquare, title: "Ask AI", desc: "Open a fresh chat" },
  { to: "/resume", icon: FileText, title: "Build a resume", desc: "ATS-friendly draft" },
  { to: "/cover-letter", icon: Mail, title: "Cover letter", desc: "Tailored to a role" },
  { to: "/interview", icon: Mic, title: "Mock interview", desc: "Practice + feedback" },
  { to: "/study", icon: GraduationCap, title: "Study helper", desc: "Notes & flashcards" },
];

function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      const uid = user.user.id;

      const [chats, resumes, letters, interviews, activity] = await Promise.all([
        supabase.from("chats").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("cover_letters").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("interview_sessions").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase
          .from("activity_logs")
          .select("id, action, resource_type, created_at, metadata")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      return {
        chats: chats.count ?? 0,
        resumes: resumes.count ?? 0,
        letters: letters.count ?? 0,
        interviews: interviews.count ?? 0,
        activity: activity.data ?? [],
      };
    },
  });

  // Fake weekly series for now (real chart driven by activity_logs aggregation later)
  const series = buildWeeklySeries(stats?.activity ?? []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A snapshot of your work in NeuraFlow."
        actions={
          <Button asChild className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            <Link to="/chat">
              <Sparkles className="mr-1.5 size-4" /> New chat
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 p-6 sm:p-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Conversations" value={stats?.chats ?? 0} icon={MessageSquare} accent="brand" />
          <StatCard label="Resumes" value={stats?.resumes ?? 0} icon={FileText} accent="glow" />
          <StatCard label="Cover letters" value={stats?.letters ?? 0} icon={Mail} accent="brand" />
          <StatCard label="Interviews" value={stats?.interviews ?? 0} icon={Mic} accent="glow" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur lg:col-span-2">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Activity</p>
                <h2 className="mt-1 font-display text-xl tracking-tight">Last 7 days</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="size-3.5 text-brand-glow" />
                All-time growth
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillBrand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.68 0.2 285)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.68 0.2 285)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                  <XAxis dataKey="day" stroke="oklch(0.68 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.68 0.02 260)" fontSize={11} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    cursor={{ stroke: "oklch(1 0 0 / 10%)" }}
                    contentStyle={{
                      background: "oklch(0.185 0.018 265)",
                      border: "1px solid oklch(1 0 0 / 10%)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="events" stroke="oklch(0.68 0.2 285)" strokeWidth={2} fill="url(#fillBrand)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent activity</p>
            <div className="mt-4 space-y-3">
              {(stats?.activity ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nothing yet — start a chat to see activity here.
                </p>
              ) : (
                stats?.activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <Clock className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{formatAction(a.action)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl tracking-tight">Quick actions</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {QUICK.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand/40"
              >
                <div className="absolute -right-6 -top-6 size-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-60" style={{ background: "var(--gradient-brand)" }} />
                <q.icon className="size-5 text-brand-glow" />
                <div className="mt-4 font-medium">{q.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{q.desc}</div>
                <ArrowUpRight className="absolute right-4 top-4 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: "brand" | "glow";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={accent === "brand" ? "size-4 text-brand" : "size-4 text-brand-glow"} />
      </div>
      <p className="mt-3 font-display text-3xl tracking-tight">{value}</p>
    </div>
  );
}

function formatAction(action: string) {
  return action.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function buildWeeklySeries(activity: Array<{ created_at: string }>) {
  const days: { day: string; events: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const events = activity.filter((a) => {
      const ad = new Date(a.created_at);
      return ad.toDateString() === d.toDateString();
    }).length;
    days.push({ day: label, events });
  }
  return days;
}
