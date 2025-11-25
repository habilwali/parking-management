"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type RenewVehicleButtonProps = {
  vehicleId: string;
};

export function RenewVehicleButton({ vehicleId }: RenewVehicleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRenew = () => {
    startTransition(async () => {
      const res = await fetch(`/api/vehicles/${vehicleId}/renew`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Vehicle renewed successfully");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.message ?? "Failed to renew vehicle.");
      }
    });
  };

  return (
    <Button size="sm" onClick={handleRenew} disabled={isPending}>
      {isPending ? "Renewing..." : "Renew"}
    </Button>
  );
}

