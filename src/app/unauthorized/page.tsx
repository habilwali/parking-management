import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Access denied
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          You don&apos;t have permission to view that page.
        </h1>
        <p className="text-sm text-muted-foreground">
          Switch to a role that has the right access level and try again. Admins
          can visit the home screen. Super admins can access both home and the
          dashboard.
        </p>
        <p className="text-sm text-muted-foreground">
          Need to sign in? Use the login button below.
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

