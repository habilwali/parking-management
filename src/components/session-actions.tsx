"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { InputDialog } from "@/components/input-dialog";

type SessionActionsProps = {
  sessionType: "hourly" | "night";
  sessionId: string;
  canManage: boolean;
};

export function SessionActions({
  sessionType,
  sessionId,
  canManage,
}: SessionActionsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!canManage) {
    return null;
  }

  const handleEdit = async (value: string) => {
    const price = Number(value);
    setIsPending(true);
    try {
      const res = await fetch(`/api/${sessionType}/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          sessionType === "hourly"
            ? { totalPrice: price }
            : { price, timestamp: new Date() },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to update.");
      }
      toast.success("Session updated successfully");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update session.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const res = await fetch(`/api/${sessionType}/${sessionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to delete.");
      }
      toast.success("Session deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete session.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const validatePrice = (value: string): string | null => {
    const price = Number(value);
    if (!value.trim()) {
      return "Price is required";
    }
    if (Number.isNaN(price) || price < 0) {
      return "Please enter a valid price (must be a positive number)";
    }
    return null;
  };

  const fieldLabel =
    sessionType === "hourly" ? "New total price (AED)" : "New price (AED)";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          size="xs"
          variant="outline"
          onClick={() => setShowEditDialog(true)}
          disabled={isPending}
          className="text-xs"
        >
          Edit
        </Button>
        <Button
          size="xs"
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isPending}
          className="text-xs"
        >
          Delete
        </Button>
      </div>

      <InputDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Session"
        description={`Enter the ${fieldLabel.toLowerCase()} for this session.`}
        label={fieldLabel}
        type="number"
        placeholder="0.00"
        onConfirm={handleEdit}
        validate={validatePrice}
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Session"
        description="Are you sure you want to delete this session? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
