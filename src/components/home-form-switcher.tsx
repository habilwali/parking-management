"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VehicleRegistrationForm } from "@/components/vehicle-registration-form";
import { HourlyParkingForm } from "@/components/hourly-parking-form";
import { NightParkingForm } from "@/components/night-parking-form";

const tabs = [
  { key: "monthly", label: "Monthly" },
  { key: "hourly", label: "Hourly" },
  { key: "night", label: "Night" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function HomeFormSwitcher() {
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setActiveTab((prev) => (prev === tab.key ? null : tab.key))
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "monthly" ? (
        <VehicleRegistrationForm />
      ) : activeTab === "hourly" ? (
        <HourlyParkingForm />
      ) : activeTab === "night" ? (
        <NightParkingForm />
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a plan to open the relevant form.
        </p>
      )}
    </div>
  );
}

