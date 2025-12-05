"use client";

import { useState } from "react";
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

type PaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionType: "hourly" | "night" | "monthly";
  sessionId: string;
  totalAmount: number;
  paidAmount: number;
  onPaymentSuccess: () => void;
};

export function PaymentDialog({
  open,
  onOpenChange,
  sessionType,
  sessionId,
  totalAmount,
  paidAmount,
  onPaymentSuccess,
}: PaymentDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isPending, setIsPending] = useState(false);

  const remainingAmount = totalAmount - paidAmount;
  const canPayFull = remainingAmount > 0;

  const handlePayment = async () => {
    const amount = Number(paymentAmount);
    
    if (!paymentAmount.trim()) {
      toast.error("Please enter a payment amount");
      return;
    }
    
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    
    if (amount > remainingAmount) {
      toast.error(`Payment amount cannot exceed remaining amount of AED ${remainingAmount.toFixed(2)}`);
      return;
    }

    setIsPending(true);
    try {
      const endpoint = sessionType === "monthly" 
        ? `/api/vehicles/${sessionId}/payment`
        : `/api/${sessionType}/${sessionId}/payment`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to record payment.");
      }
      
      toast.success(`Payment of AED ${amount.toFixed(2)} recorded successfully`);
      setPaymentAmount("");
      onPaymentSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record payment.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const handlePayFull = () => {
    setPaymentAmount(remainingAmount.toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription className="text-left space-y-2">
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold text-foreground">
                  AED {totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Already Paid:</span>
                <span className="font-medium text-foreground">
                  AED {paidAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-semibold text-foreground">
                  AED {remainingAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="payment-amount"
              className="text-sm font-medium text-foreground"
            >
              Payment Amount (AED)
            </label>
            <input
              id="payment-amount"
              type="number"
              min="0"
              step="0.01"
              max={remainingAmount}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {canPayFull && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePayFull}
                className="w-full"
              >
                Pay Full Amount (AED {remainingAmount.toFixed(2)})
              </Button>
            )}
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
            onClick={handlePayment}
            disabled={isPending || !paymentAmount || Number(paymentAmount) <= 0}
            className="w-full sm:w-auto"
          >
            {isPending ? "Processing..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
