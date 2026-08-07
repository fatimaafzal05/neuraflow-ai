import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteNav() {
  return (
    <header className="sticky top-4 z-50 mx-auto flex w-full max-w-6xl items-center justify-between rounded-full glass px-4 py-2.5 sm:px-6">
      <Link to="/" className="focus-visible:outline-none">
        <Logo />
      </Link>
      <nav className="hidden items-center gap-8 md:flex">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {l.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link to="/auth">Sign in</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="rounded-full bg-foreground text-background hover:bg-foreground/90"
        >
          <Link to="/dashboard">Open app</Link>
        </Button>
      </div>
    </header>
  );
}
