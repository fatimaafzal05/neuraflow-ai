import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  FileText,
  MessageSquare,
  GraduationCap,
  Zap,
  Shield,
  Layers,
  BarChart3,
  Check,
} from "lucide-react";
import { SiteNav } from "@/components/marketing/site-nav";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuraFlow AI — Your AI Career & Productivity Copilot" },
      {
        name: "description",
        content:
          "NeuraFlow AI helps students, freelancers, and professionals write resumes, ace interviews, master study material, and get more done — with a single fast copilot.",
      },
      { property: "og:title", content: "NeuraFlow AI — Your AI Career & Productivity Copilot" },
      {
        property: "og:description",
        content:
          "NeuraFlow AI helps students, freelancers, and professionals write resumes, ace interviews, master study material, and get more done — with a single fast copilot.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <div className="px-4 pt-4 sm:px-6">
        <SiteNav />
      </div>

      <Hero />
      <LogoStrip />
      <Features />
      <Workflow />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 text-center sm:px-6 sm:pt-28">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
      >
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
        </span>
        Now with streaming AI chat
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mt-6 font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl"
      >
        Your AI career & <span className="italic text-gradient">productivity copilot</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
      >
        NeuraFlow AI writes your resume, coaches your interviews, summarizes your PDFs, and answers
        anything — in one calm, keyboard-fast workspace.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <Button
          asChild
          size="lg"
          className="h-11 rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
        >
          <Link to="/chat">
            Start for free <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost" className="h-11 rounded-full text-foreground/80">
          <a href="#features">See what it does</a>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25 }}
        className="mx-auto mt-20 max-w-5xl"
      >
        <div className="glass rounded-3xl p-2 shadow-elevated">
          <div className="rounded-2xl border border-border/60 bg-[oklch(0.12_0.02_265)] p-6 text-left">
            <div className="mb-4 flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[oklch(0.65_0.2_25)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.75_0.15_85)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.7_0.15_150)]" />
              <span className="ml-3 text-xs text-muted-foreground">NeuraFlow — Assistant</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm">
                  Rewrite my resume summary for a senior PM role at a fintech.
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <Sparkles className="size-3.5 text-brand-foreground" />
                </div>
                <div className="glass max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed">
                  <p className="text-muted-foreground">
                    <span className="text-foreground">Senior Product Manager</span> with 8+ years
                    shipping payments infrastructure at hyper-growth fintechs. Led a 12-person pod
                    that grew ARR from $4M → $28M in 18 months by rebuilding onboarding and
                    launching embedded ledgers…
                  </p>
                  <div className="mt-2 inline-flex h-2 w-1.5 animate-pulse bg-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function LogoStrip() {
  const items = ["Berkeley", "Toptal", "Stanford", "Shopify", "MIT", "Notion"];
  return (
    <section className="border-y border-border/50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Trusted by builders from
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {items.map((n) => (
            <span key={n} className="font-display text-xl tracking-tight text-muted-foreground/70">
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Streaming AI Chat",
    desc: "Fast, markdown-rich answers with code highlighting. Feels alive.",
  },
  {
    icon: FileText,
    title: "Resume & Cover Letters",
    desc: "ATS-friendly resumes generated, analyzed, and improved in seconds.",
  },
  {
    icon: GraduationCap,
    title: "Study Assistant",
    desc: "Notes, flashcards, and quizzes from any PDF or topic.",
  },
  {
    icon: Zap,
    title: "Interview Coach",
    desc: "Mock interviews with instant, honest feedback tuned to your role.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Usage",
    desc: "See where your time and prompts go. Get better every week.",
  },
  {
    icon: Shield,
    title: "Private by default",
    desc: "Your data is yours. Encrypted at rest, never used to train models.",
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-widest text-brand-glow">Features</p>
        <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Everything you need. Nothing you don't.
        </h2>
        <p className="mt-4 text-muted-foreground">
          One workspace for careers, study, and shipping. Composable, keyboard-fast, delightful.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-6 backdrop-blur transition-colors hover:border-brand/40"
          >
            <div
              className="absolute -right-8 -top-8 size-32 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            />
            <div className="relative">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background/50">
                <f.icon className="size-5 text-brand-glow" />
              </div>
              <h3 className="font-medium tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    { n: "01", t: "Ask", d: "Type a goal, paste a JD, or upload a PDF." },
    { n: "02", t: "Generate", d: "NeuraFlow drafts, analyzes, or explains — instantly." },
    { n: "03", t: "Refine", d: "Iterate in chat. Export to PDF or share." },
  ];
  return (
    <section id="workflow" className="border-y border-border/50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-glow">Workflow</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Ask. Generate. Refine.
            </h2>
            <p className="mt-4 text-muted-foreground">
              A single loop that gets you from blank page to polished output in minutes.
            </p>
          </div>
          <div className="space-y-3">
            {steps.map((s) => (
              <div key={s.n} className="glass flex items-start gap-5 rounded-2xl p-5">
                <span className="font-display text-3xl text-gradient">{s.n}</span>
                <div>
                  <h3 className="font-medium">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      desc: "For trying out.",
      features: ["30 AI messages / day", "Resume analyzer", "Basic study tools"],
      cta: "Start free",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$12",
      desc: "For serious work.",
      features: [
        "Unlimited AI messages",
        "Resume + cover letter suite",
        "PDF chat, flashcards, quizzes",
        "Priority models",
        "Export to PDF",
      ],
      cta: "Go Pro",
      highlight: true,
    },
    {
      name: "Team",
      price: "$29",
      desc: "For small teams.",
      features: [
        "Everything in Pro",
        "Shared prompt library",
        "Admin dashboard",
        "SSO (coming soon)",
      ],
      cta: "Contact sales",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-widest text-brand-glow">Pricing</p>
        <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Simple, honest pricing.
        </h2>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={
              p.highlight
                ? "relative rounded-2xl border border-brand/40 p-6 shadow-glow glass"
                : "relative rounded-2xl border border-border bg-card/40 p-6 backdrop-blur"
            }
          >
            {p.highlight && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-foreground"
                style={{ background: "var(--gradient-brand)" }}
              >
                Most popular
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <h3 className="font-medium">{p.name}</h3>
              <div>
                <span className="font-display text-3xl">{p.price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-glow" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className={
                p.highlight
                  ? "mt-6 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
                  : "mt-6 w-full rounded-full"
              }
              variant={p.highlight ? "default" : "secondary"}
            >
              <Link to="/chat">{p.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border p-10 text-center sm:p-16">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute inset-0 -z-10 bg-grid opacity-30" />
        <Layers className="mx-auto size-6 text-brand-glow" />
        <h2 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
          Ship your best work, <span className="italic text-gradient">faster</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Join thousands using NeuraFlow to write, learn, and interview better every day.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 h-11 rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
        >
          <Link to="/chat">
            Open NeuraFlow <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <Logo />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} NeuraFlow AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
