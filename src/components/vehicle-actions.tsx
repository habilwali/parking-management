"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { VehicleEditDialog } from "@/components/vehicle-edit-dialog";

type VehicleActionsProps = {
  vehicleId: string;
  vehicle: {
    name: string;
    vehicleNumber: string;
    phone: string;
    registerDate: string | Date;
    planType: string;
    price: number;
    notes?: string;
  };
  canManage: boolean;
};

export function VehicleActions({
  vehicleId,
  vehicle,
  canManage,
}: VehicleActionsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Only super-admin can see Edit and Delete buttons
  if (!canManage) {
    return null;
  }

  const handleEdit = async (updates: {
    name?: string;
    vehicleNumber?: string;
    phone?: string;
    registerDate?: string;
    planType?: string;
    price?: number;
    notes?: string;
  }) => {
    setIsPending(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to update.");
      }
      toast.success("Vehicle updated successfully");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update vehicle.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to delete.");
      }
      toast.success("Vehicle deleted successfully");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete vehicle.",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowEditDialog(true)}
          disabled={isPending}
          className="h-8 px-3 text-xs font-medium"
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isPending}
          className="h-8 px-3 text-xs font-medium"
        >
          Delete
        </Button>
      </div>

      <VehicleEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        vehicle={vehicle}
        onConfirm={handleEdit}
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Vehicle"
        description="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}

