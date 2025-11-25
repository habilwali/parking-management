import Link from "next/link";
import { LogoutCard } from "@/components/auth/logout-card";
import { Button } from "@/components/ui/button";

export default function LogoutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Authentication
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Sign out of Parking
          </h1>
          <p className="text-sm text-muted-foreground">
            Clear your current role to experience the platform as another user.
          </p>
        </div>
        <LogoutCard />
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}

