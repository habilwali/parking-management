import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Authentication
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Sign in to Parking
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick a role to simulate different access levels in the demo.
          </p>
        </div>
        <LoginForm />
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}

