"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VehicleRegistrationForm } from "@/components/vehicle-registration-form";
import { HourlyParkingForm } from "@/components/hourly-parking-form";
import { NightParkingForm } from "@/components/night-parking-form";

const tabs = ["monthly", "hourly", "night"] as const;

type TabKey = (typeof tabs)[number];

type HomeFormSwitcherProps = {
  labels: {
    prompt: string;
    tabs: Record<TabKey, string>;
  };
};

export function HomeFormSwitcher({ labels }: HomeFormSwitcherProps) {
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setActiveTab((prev) => (prev === tab ? null : tab))
            }
          >
            {labels.tabs[tab]}
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
        <p className="text-sm text-muted-foreground">{labels.prompt}</p>
      )}
    </div>
  );
}

