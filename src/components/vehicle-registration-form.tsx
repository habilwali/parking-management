"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type FormState = {
  name: string;
  vehicleNumber: string;
  phone: string;
  registerDate: string;
  planType: string;
  price: string;
  notes: string;
  paid: boolean;
};

const initialState: FormState = {
  name: "",
  vehicleNumber: "",
  phone: "",
  registerDate: new Date().toISOString().split("T")[0],
  planType: "monthly",
  price: "",
  notes: "",
  paid: false,
};

export function VehicleRegistrationForm() {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [isPending, startTransition] = useTransition();

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Vehicle registered successfully");
        setFormState(initialState);
      } else {
        toast.error(data.message ?? "Failed to register vehicle.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="name">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          value={formState.name}
          onChange={handleChange}
          required
          placeholder="Jane Doe"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="vehicleNumber"
        >
          Vehicle Number
        </label>
        <input
          id="vehicleNumber"
          name="vehicleNumber"
          value={formState.vehicleNumber}
          onChange={handleChange}
          required
          placeholder="KA 09 AB 1234"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="phone"
          >
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            value={formState.phone}
            onChange={handleChange}
            required
            placeholder="+1 555 010 0200"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="registerDate"
          >
            Registration Date
          </label>
          <input
            id="registerDate"
            type="date"
            name="registerDate"
            value={formState.registerDate}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="planType"
          >
            Monthly Plan
          </label>
          <select
            id="planType"
            name="planType"
            value={formState.planType}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">2 Week</option>
          </select>
        </div>
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="price"
          >
            Price (in local currency)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formState.price}
            onChange={handleChange}
            required
            placeholder="2500"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formState.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Any additional requirements or remarks..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center space-x-2 rounded-md border border-input bg-background p-3">
        <input
          id="paid"
          name="paid"
          type="checkbox"
          checked={formState.paid}
          onChange={handleChange}
          className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
        />
        <label
          htmlFor="paid"
          className="text-sm font-medium text-foreground cursor-pointer"
        >
          Payment received
        </label>
        <span className="text-xs text-muted-foreground ml-auto">
          {formState.paid
            ? "✓ Will be included in totals"
            : "⚠ Not included in totals until paid"}
        </span>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : "Register Vehicle"}
      </Button>
    </form>
  );
}

