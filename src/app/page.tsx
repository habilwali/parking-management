import { cookies } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HomeFormSwitcher } from "@/components/home-form-switcher";

export default async function Home() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";
  const userEmail = cookieStore.get("userEmail")?.value ?? "unknown";

  return (
    <div className="bg-background px-4 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Monthly Parking Registration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Register vehicles for monthly parking
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as <span className="font-semibold">{userEmail}</span>{" "}
            ({role}). Both admins and super admins can submit monthly parking
            entries.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/logout">Logout</Link>
            </Button>
          </div>
        </div>
        <HomeFormSwitcher />
      </div>
    </div>
  );
}
