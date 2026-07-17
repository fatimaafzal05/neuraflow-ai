import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  MessageSquare,
  FileText,
  Mail,
  Mic,
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronsUpDown,
  Shield,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/cover-letter", label: "Cover Letter", icon: Mail },
  { to: "/interview", label: "Interview Coach", icon: Mic },
  { to: "/study", label: "Study Assistant", icon: GraduationCap },
  { to: "/prompts", label: "Prompt Library", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="flex h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-card/30 backdrop-blur md:flex">
        <SidebarContents />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-card">
            <SidebarContents />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border/60 px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <Logo />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarContents() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
      return Boolean(data);
    },
  });
  const items = isAdmin
    ? [...NAV.slice(0, -1), { to: "/admin" as const, label: "Admin", icon: Shield }, NAV[NAV.length - 1]]
    : NAV;
  return (
    <>
      <div className="flex h-14 items-center px-4">
        <Link to="/dashboard">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors",
                "hover:bg-accent hover:text-foreground",
                active && "bg-accent text-foreground",
              )}
            >
              <item.icon className={cn("size-4", active && "text-brand-glow")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <UsageMeter />
      <UserMenu />
    </>
  );
}

function UsageMeter() {
  const { data: profile } = useProfile();
  const used = profile?.ai_messages_used ?? 0;
  const limit = profile?.ai_messages_limit ?? 30;
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div className="mx-3 mb-2 rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">AI usage</span>
        <span className="font-medium">
          {used}/{limit}
        </span>
      </div>
      <Progress value={pct} className="mt-2 h-1.5" />
      {profile?.plan === "free" && (
        <Button asChild size="sm" variant="ghost" className="mt-2 h-7 w-full justify-start gap-1.5 text-xs text-brand-glow hover:text-brand-glow">
          <Link to="/settings">
            <Sparkles className="size-3" /> Upgrade to Pro
          </Link>
        </Button>
      )}
    </div>
  );
}

function UserMenu() {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const name = profile?.display_name || profile?.email || "You";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="border-t border-border/60 p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent">
            <Avatar className="size-8">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="truncate text-xs capitalize text-muted-foreground">{profile?.plan ?? "free"} plan</div>
            </div>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-56">
          <DropdownMenuLabel>{profile?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings className="mr-2 size-4" /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url, plan, ai_messages_used, ai_messages_limit")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
