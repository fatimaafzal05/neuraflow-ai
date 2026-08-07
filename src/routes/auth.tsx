import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/brand/logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const authSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · NeuraFlow AI" },
      { name: "description", content: "Sign in to NeuraFlow AI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: authSearchSchema,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const safeRedirect = redirect && redirect.startsWith("/") ? redirect : "/dashboard";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safeRedirect, replace: true });
    });
  }, [navigate, safeRedirect]);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <div className="glass rounded-2xl p-6 shadow-elevated sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to NeuraFlow.</p>
          </div>

          <p className="mb-6 rounded-lg border border-border bg-background/40 px-3 py-2 text-center text-xs text-muted-foreground">
            Guest mode: your workspace is saved only in this browser.
          </p>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-5">
              <EmailForm mode="signin" redirectTo={safeRedirect} />
            </TabsContent>
            <TabsContent value="signup" className="mt-5">
              <EmailForm mode="signup" redirectTo={safeRedirect} />
            </TabsContent>
          </Tabs>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}

const emailSchema = z.string().trim().email("Enter a valid email");
const passwordSchema = z.string().min(8, "At least 8 characters");

function EmailForm({ mode, redirectTo }: { mode: "signin" | "signup"; redirectTo: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailR = emailSchema.safeParse(email);
    const passR = passwordSchema.safeParse(password);
    if (!emailR.success) return toast.error(emailR.error.issues[0]?.message);
    if (!passR.success) return toast.error(passR.error.issues[0]?.message);

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast.success("Account created. Redirecting…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: redirectTo, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@work.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
      >
        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
        {mode === "signup" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
