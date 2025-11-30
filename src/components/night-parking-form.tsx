"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const NIGHT_RATE = 30;

export function NightParkingForm() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [price, setPrice] = useState(NIGHT_RATE);
  const [timestamp] = useState(() => new Date());
  const [isSaving, setIsSaving] = useState(false);

  const recordNightStay = async () => {
    if (!vehicleNumber.trim()) {
      toast.error("Please enter a vehicle number");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/night", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleNumber: vehicleNumber.trim(),
          timestamp,
          price,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to record night stay.");
      }
      toast.success("Night parking recorded successfully");
      setVehicleNumber("");
      setPrice(NIGHT_RATE);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record night stay.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border bg-background p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">Night parking</h2>
      <p className="text-sm text-muted-foreground">
        Register overnight stays with a flat AED {NIGHT_RATE} rate. The current
        date/time is captured automatically.
      </p>

      <div className="space-y-1">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="night-vehicle"
        >
          Vehicle number
        </label>
        <input
          id="night-vehicle"
          value={vehicleNumber}
          onChange={(event) => setVehicleNumber(event.target.value)}
          placeholder="AA 12345"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs uppercase text-muted-foreground">Current time</p>
          <p className="text-sm font-semibold text-foreground">
            {timestamp.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="night-price"
          >
            Price (AED)
          </label>
          <input
            id="night-price"
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <Button
        size="sm"
        disabled={!vehicleNumber.trim() || isSaving}
        onClick={recordNightStay}
      >
        {isSaving ? "Saving..." : "Record night stay"}
      </Button>
    </div>
  );
}

