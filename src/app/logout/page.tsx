import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutCard } from "@/components/auth/logout-card";
import { getDictionary, resolveLanguage } from "@/lib/i18n";

export default async function LogoutPage() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get("userEmail")?.value);
  
  // If not logged in, redirect to login
  if (!isLoggedIn) {
    redirect("/login");
  }

  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dict = getDictionary(language);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            {dict.logout.tagline}
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            {dict.logout.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dict.logout.description}
          </p>
        </div>
        <LogoutCard />
      </div>
    </div>
  );
}

