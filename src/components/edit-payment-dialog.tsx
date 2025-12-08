"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type EditPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionType: "hourly" | "night" | "monthly";
  sessionId: string;
  totalAmount: number;
  currentPaidAmount: number;
  onPaymentSuccess: () => void;
};

export function EditPaymentDialog({
  open,
  onOpenChange,
  sessionType,
  sessionId,
  totalAmount,
  currentPaidAmount,
  onPaymentSuccess,
}: EditPaymentDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isPending, setIsPending] = useState(false);

  // Initialize with current paid amount when dialog opens
  useEffect(() => {
    if (open) {
      setPaymentAmount(currentPaidAmount.toFixed(2));
    }
  }, [open, currentPaidAmount]);

  const handleUpdate = async () => {
    const amount = Number(paymentAmount);
    
    if (!paymentAmount.trim()) {
      toast.error("Please enter a payment amount");
      return;
    }
    
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    
    // If the new amount is the same as current, no need to update
    if (amount === currentPaidAmount) {
      toast.info("No changes to update");
      onOpenChange(false);
      return;
    }

    setIsPending(true);
    try {
      const endpoint = sessionType === "monthly" 
        ? `/api/vehicles/${sessionId}/payment`
        : `/api/${sessionType}/${sessionId}/payment`;
      
      // Calculate the difference to add/subtract
      const difference = amount - currentPaidAmount;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: difference }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to update payment.");
      }
      
      toast.success(`Payment updated to AED ${amount.toFixed(2)} successfully`);
      setPaymentAmount("");
      onOpenChange(false);
      // Call onPaymentSuccess to refresh the page and update the table
      // Use a small delay to ensure the database update is complete
      setTimeout(() => {
        onPaymentSuccess();
      }, 200);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update payment.",
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription asChild>
            <div className="text-left space-y-1 pt-2 text-muted-foreground text-sm">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-semibold text-foreground">
                  AED {totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current Paid:</span>
                <span className="font-medium text-foreground">
                  AED {currentPaidAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Remaining:</span>
                <span className="font-semibold text-foreground">
                  AED {(totalAmount - currentPaidAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="edit-payment-amount"
              className="text-sm font-medium text-foreground"
            >
              New Paid Amount (AED)
            </label>
            <input
              id="edit-payment-amount"
              type="number"
              min="0"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Enter the total paid amount. The difference will be added or subtracted automatically.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setPaymentAmount("");
            }}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isPending || !paymentAmount || Number.isNaN(Number(paymentAmount)) || Number(paymentAmount) < 0}
            className="w-full sm:w-auto"
          >
            {isPending ? "Updating..." : "Update Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

