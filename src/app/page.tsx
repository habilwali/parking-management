import { cookies } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HomeFormSwitcher } from "@/components/home-form-switcher";
import { getDictionary, resolveLanguage } from "@/lib/i18n";

export default async function Home() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";
  const userEmail = cookieStore.get("userEmail")?.value ?? "unknown";
  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dictionary = getDictionary(language);

  return (
    <div className="bg-background px-4 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            {dictionary.home.heroTagline}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {dictionary.home.heroTitle}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {dictionary.home.heroDescription({ email: userEmail, role })}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href="/dashboard">{dictionary.home.dashboardButton}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/logout">{dictionary.home.logoutButton}</Link>
            </Button>
          </div>
        </div>
        <HomeFormSwitcher
          labels={{
            prompt: dictionary.home.formPrompt,
            tabs: dictionary.home.tabs,
          }}
        />
        </div>
    </div>
  );
}
