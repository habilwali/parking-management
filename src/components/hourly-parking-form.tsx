"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

const DEFAULT_HOURLY_RATE = 5;
const BUFFER_MINUTES = 10;

type ActiveVehicle = {
  id: string;
  vehicleNumber: string;
  hourlyRate: number;
  startTime: Date | string;
};

export function HourlyParkingForm() {
  const [newVehicle, setNewVehicle] = useState("");
  const [newPrice, setNewPrice] = useState(DEFAULT_HOURLY_RATE.toString());
  const [activeVehicles, setActiveVehicles] = useState<ActiveVehicle[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<ActiveVehicle | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [totalRes, vehiclesRes] = await Promise.all([
          fetch("/api/hourly?total=true"),
          fetch("/api/active-hourly"),
        ]);

        const totalData = await totalRes.json();
        if (totalRes.ok && totalData.total !== undefined) {
          setTotalAmount(totalData.total);
        }

        const vehiclesData = await vehiclesRes.json();
        if (vehiclesRes.ok && vehiclesData.vehicles) {
          setActiveVehicles(
            vehiclesData.vehicles.map((v: ActiveVehicle) => ({
              ...v,
              startTime: new Date(v.startTime),
            })),
          );
        }
      } catch {
        // Failed to load data
        toast.error("Failed to load active vehicles");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const addVehicle = async () => {
    if (!newVehicle.trim()) {
      toast.error("Please enter a vehicle number");
      return;
    }
    const hourlyRate = Number(newPrice);
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }

    try {
      const res = await fetch("/api/active-hourly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleNumber: newVehicle.trim(),
          hourlyRate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to add vehicle.");
      }

      const vehicle: ActiveVehicle = {
        id: data.id,
        vehicleNumber: newVehicle.trim(),
        hourlyRate,
        startTime: new Date(),
      };
      setActiveVehicles((prev) => [...prev, vehicle]);
      setNewVehicle("");
      setNewPrice(DEFAULT_HOURLY_RATE.toString());
      toast.success(`Vehicle ${vehicle.vehicleNumber} added and timer started`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add vehicle.",
      );
    }
  };

  const removeVehicle = async (id: string) => {
    try {
      const res = await fetch(`/api/active-hourly?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActiveVehicles((prev) => prev.filter((v) => v.id !== id));
      }
    } catch {
      // Failed to remove vehicle
    }
  };

  const calculateVehiclePrice = (startTime: Date | string, hourlyRate: number) => {
    const start = typeof startTime === "string" ? new Date(startTime) : startTime;
    const diffMs = now.getTime() - start.getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    const billable = mins > 60 ? mins + BUFFER_MINUTES : Math.max(1, mins || 1);
    const hours = Math.max(1, Math.ceil(billable / 60));
    return {
      elapsedMinutes: mins,
      billableMinutes: billable,
      billableHours: hours,
      totalPrice: hours * hourlyRate,
      bufferApplied: mins > 60,
    };
  };

  const handleStopClick = (vehicle: ActiveVehicle) => {
    setSelectedVehicle(vehicle);
    setIsPaid(false);
    setShowStopDialog(true);
  };

  const stopTimer = async () => {
    if (!selectedVehicle) return;

    const vehicle = selectedVehicle;
    setIsSaving(vehicle.id);
    try {
      const startTime =
        typeof vehicle.startTime === "string"
          ? new Date(vehicle.startTime)
          : vehicle.startTime;
      const calc = calculateVehiclePrice(startTime, vehicle.hourlyRate);
      const res = await fetch("/api/hourly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleNumber: vehicle.vehicleNumber,
          hourlyRate: vehicle.hourlyRate,
          startTime,
          endTime: now,
          elapsedMinutes: calc.elapsedMinutes,
          billableMinutes: calc.billableMinutes,
          billableHours: calc.billableHours,
          totalPrice: calc.totalPrice,
          bufferApplied: calc.bufferApplied,
          paid: isPaid,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to save session.");
      }
      toast.success(
        `Recorded ${vehicle.vehicleNumber} - AED ${calc.totalPrice.toFixed(2)}${isPaid ? " (Paid)" : " (Unpaid)"}`,
      );
      await removeVehicle(vehicle.id);
      if (isPaid) {
        setTotalAmount((prev) => prev + calc.totalPrice);
      }
      // Refresh total from server to get accurate paid total
      const totalRes = await fetch("/api/hourly?total=true");
      const totalData = await totalRes.json();
      if (totalRes.ok && totalData.total !== undefined) {
        setTotalAmount(totalData.total);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save session.",
      );
    } finally {
      setIsSaving(null);
      setSelectedVehicle(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-background p-6 text-center text-sm text-muted-foreground">
        Loading active vehicles...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-background p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Hourly parking
        </h2>
        <p className="text-sm text-muted-foreground">
          Add vehicles to start tracking. A {BUFFER_MINUTES} minute buffer
          applies once the session exceeds one hour. Timer starts automatically
          when vehicle is added.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label
              className="text-xs font-medium text-foreground"
              htmlFor="vehicle-input"
            >
              Vehicle number
            </label>
            <input
              id="vehicle-input"
              value={newVehicle}
              onChange={(event) => setNewVehicle(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addVehicle();
                }
              }}
              placeholder="AA 12345"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label
              className="text-xs font-medium text-foreground"
              htmlFor="price-input"
            >
              Hourly rate (AED)
            </label>
            <input
              id="price-input"
              type="number"
              min={0}
              step={0.5}
              value={newPrice}
              onChange={(event) => setNewPrice(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addVehicle();
                }
              }}
              placeholder="5.00"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={addVehicle} disabled={!newVehicle.trim()}>
            Add vehicle & start timer
          </Button>
        </div>

        {totalAmount > 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-950/20">
            <p className="text-xs uppercase text-muted-foreground">
              Total hourly revenue
            </p>
            <p className="text-xl font-semibold text-foreground">
              AED {totalAmount.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {activeVehicles.length > 0 && (
        <div className="space-y-3">
          {activeVehicles.map((vehicle) => {
            const startTime =
              typeof vehicle.startTime === "string"
                ? new Date(vehicle.startTime)
                : vehicle.startTime;
            const calc = calculateVehiclePrice(startTime, vehicle.hourlyRate);
            return (
              <div
                key={vehicle.id}
                className="rounded-xl border bg-background p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-foreground">
                      {vehicle.vehicleNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Started: {startTime.toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rate: AED {vehicle.hourlyRate.toFixed(2)}/hour
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        AED {calc.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {calc.elapsedMinutes}m elapsed · {calc.billableHours}h
                        billed
                        {calc.bufferApplied ? " (+buffer)" : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStopClick(vehicle)}
                      disabled={isSaving === vehicle.id}
                      className="w-full sm:w-auto"
                    >
                      {isSaving === vehicle.id ? "Saving..." : "Stop timer"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeVehicles.length === 0 && (
        <div className="rounded-xl border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
          No active vehicles. Add a vehicle to start tracking hourly parking.
        </div>
      )}

      {selectedVehicle && (
        <ConfirmationDialog
          open={showStopDialog}
          onOpenChange={setShowStopDialog}
          title="Stop Timer"
          description={
            <div className="space-y-3">
              <p>
                Do you want to stop the timer for vehicle {selectedVehicle.vehicleNumber}? The session will be recorded and saved.
              </p>
              <div className="flex items-center space-x-2 rounded-md border border-input bg-background p-3">
                <input
                  id="hourly-paid"
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                />
                <label
                  htmlFor="hourly-paid"
                  className="text-sm font-medium text-foreground cursor-pointer flex-1"
                >
                  Payment received
                </label>
                <span className="text-xs text-muted-foreground">
                  {isPaid
                    ? "✓ Included in totals"
                    : "⚠ Not in totals"}
                </span>
              </div>
            </div>
          }
          confirmText="Stop Timer"
          cancelText="Cancel"
          onConfirm={stopTimer}
          variant="destructive"
        />
      )}
    </div>
  );
}
