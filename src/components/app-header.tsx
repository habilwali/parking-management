import Link from "next/link";
import { Menu } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/parking-sessions", label: "Parking Sessions" },
  { href: "/api/parking", label: "Parking API" },
  { href: "/login", label: "Login" },
  { href: "/logout", label: "Logout" },
];

export function AppHeader() {
  return (
    <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Parking Suite
        </Link>
        <input type="checkbox" id="mobile-nav" className="peer hidden" />
        <label
          htmlFor="mobile-nav"
          className="ml-auto rounded-md p-2 text-muted-foreground transition hover:bg-muted/80 focus-visible:outline-none sm:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </label>
        <nav className="hidden w-full flex-col gap-1 border-t pt-3 text-sm font-medium peer-checked:flex sm:ml-auto sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-2 sm:border-0 sm:pt-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-foreground transition hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

