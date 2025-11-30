import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { getDictionary, resolveLanguage } from "@/lib/i18n";

export default async function Unauthorized() {
  const cookieStore = await cookies();
  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dict = getDictionary(language);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          {dict.unauthorized.tagline}
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          {dict.unauthorized.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dict.unauthorized.description}
        </p>
        <p className="text-sm text-muted-foreground">
          {dict.unauthorized.signInPrompt}
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">{dict.unauthorized.returnHome}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">{dict.unauthorized.goToDashboard}</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">{dict.unauthorized.goToLogin}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

