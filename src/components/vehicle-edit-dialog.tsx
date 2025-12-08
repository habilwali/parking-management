"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type VehicleEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: {
    name: string;
    vehicleNumber: string;
    phone: string;
    registerDate: string | Date;
    planType: string;
    price: number;
    notes?: string;
  };
  onConfirm: (updates: {
    name?: string;
    vehicleNumber?: string;
    phone?: string;
    registerDate?: string;
    planType?: string;
    price?: number;
    notes?: string;
  }) => void;
};

export function VehicleEditDialog({
  open,
  onOpenChange,
  vehicle,
  onConfirm,
}: VehicleEditDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    vehicleNumber: "",
    phone: "",
    registerDate: "",
    planType: "monthly",
    price: "",
    notes: "",
  });

  // Initialize form with current vehicle data when dialog opens
  useEffect(() => {
    if (open && vehicle) {
      const registerDate = vehicle.registerDate
        ? new Date(vehicle.registerDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      setFormData({
        name: vehicle.name || "",
        vehicleNumber: vehicle.vehicleNumber || "",
        phone: vehicle.phone || "",
        registerDate,
        planType: vehicle.planType || "monthly",
        price: vehicle.price?.toString() || "",
        notes: vehicle.notes || "",
      });
    }
  }, [open, vehicle]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Only include fields that have changed
    const updates: {
      name?: string;
      vehicleNumber?: string;
      phone?: string;
      registerDate?: string;
      planType?: string;
      price?: number;
      notes?: string;
    } = {};

    if (formData.name !== (vehicle.name || "")) {
      updates.name = formData.name;
    }
    if (formData.vehicleNumber !== (vehicle.vehicleNumber || "")) {
      updates.vehicleNumber = formData.vehicleNumber;
    }
    if (formData.phone !== (vehicle.phone || "")) {
      updates.phone = formData.phone;
    }
    if (formData.registerDate !== (vehicle.registerDate ? new Date(vehicle.registerDate).toISOString().split("T")[0] : "")) {
      updates.registerDate = formData.registerDate;
    }
    if (formData.planType !== (vehicle.planType || "monthly")) {
      updates.planType = formData.planType;
    }
    const currentPrice = vehicle.price?.toString() || "";
    if (formData.price !== currentPrice) {
      const priceNum = Number(formData.price);
      if (!Number.isNaN(priceNum) && priceNum >= 0) {
        updates.price = priceNum;
      }
    }
    if (formData.notes !== (vehicle.notes || "")) {
      updates.notes = formData.notes;
    }

    // Only submit if there are changes
    if (Object.keys(updates).length > 0) {
      onConfirm(updates);
      onOpenChange(false);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription className="text-left">
            Update the vehicle information. Only changed fields will be updated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <Input
                  id="edit-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-vehicleNumber" className="text-sm font-medium text-foreground">
                  Vehicle Number
                </label>
                <Input
                  id="edit-vehicleNumber"
                  name="vehicleNumber"
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="KA 09 AB 1234"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="edit-phone" className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <Input
                  id="edit-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 555 010 0200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-registerDate" className="text-sm font-medium text-foreground">
                  Registration Date
                </label>
                <Input
                  id="edit-registerDate"
                  name="registerDate"
                  type="date"
                  value={formData.registerDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="edit-planType" className="text-sm font-medium text-foreground">
                  Plan Type
                </label>
                <select
                  id="edit-planType"
                  name="planType"
                  value={formData.planType}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-price" className="text-sm font-medium text-foreground">
                  Price (AED)
                </label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-notes" className="text-sm font-medium text-foreground">
                Notes
              </label>
              <textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              Update Vehicle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

