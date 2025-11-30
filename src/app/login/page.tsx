import Link from "next/link";
import { cookies } from "next/headers";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { getDictionary, resolveLanguage } from "@/lib/i18n";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dict = getDictionary(language);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            {dict.login.tagline}
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            {dict.login.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dict.login.description}
          </p>
        </div>
        <LoginForm />
        <Button asChild variant="outline" className="w-full">
          <Link href="/">{dict.login.backToHome}</Link>
        </Button>
      </div>
    </div>
  );
}

