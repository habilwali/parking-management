import Link from "next/link";
import { cookies } from "next/headers";
import { LanguageToggle } from "@/components/language-toggle";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDictionary, resolveLanguage } from "@/lib/i18n";

const coreLinks = [
  { href: "/", key: "home" as const },
  { href: "/dashboard", key: "dashboard" as const },
  { href: "/parking-sessions", key: "sessions" as const },
  { href: "/api/parking", key: "api" as const },
];

export async function AppHeader() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get("userEmail")?.value);
  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dictionary = getDictionary(language);

  const links = [
    ...coreLinks.map((link) => ({
      href: link.href,
      label: dictionary.header.nav[link.key],
    })),
    ...(isLoggedIn
      ? [{ href: "/logout", label: dictionary.header.nav.logout }]
      : [{ href: "/login", label: dictionary.header.nav.login }]),
  ];

  return (
    <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {dictionary.header.brand}
        </Link>
        
        {/* Show navigation only when logged in */}
        {isLoggedIn ? (
          <>
            {/* Mobile Sidebar - Only visible on mobile */}
            <MobileSidebar
              links={links}
              brand={dictionary.header.brand}
              language={language}
              languageLabels={dictionary.header.language}
            />
            
            {/* Desktop Navigation - Only visible on desktop */}
            <nav className="ml-auto hidden sm:flex sm:items-center sm:gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
              <ThemeToggle />
              <div className="ml-3 min-w-[150px]">
                <LanguageToggle
                  currentLanguage={language}
                  labels={dictionary.header.language}
                />
              </div>
            </nav>
          </>
        ) : (
          /* Show only theme and language toggles when not logged in */
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="min-w-[150px]">
              <LanguageToggle
                currentLanguage={language}
                labels={dictionary.header.language}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

