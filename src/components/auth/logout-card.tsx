"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function LogoutCard() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const res = await fetch("/api/session", { method: "DELETE" });
      const data = await res.json();
      setMessage(data.message ?? "Signed out.");
      if (res.ok) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
      <p className="text-base font-semibold text-foreground">
        Ready to switch accounts?
      </p>
      <p className="text-sm text-muted-foreground">
        Logging out clears the role cookie so you can pick a different access
        level.
      </p>
      <Button
        type="button"
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
        disabled={isPending}
      >
        {isPending ? "Signing out..." : "Sign out"}
      </Button>
      {message ? (
        <p className="text-center text-xs text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}

