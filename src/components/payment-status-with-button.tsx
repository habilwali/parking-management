"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/components/payment-dialog";

type PaymentStatusWithButtonProps = {
  sessionType: "hourly" | "night" | "monthly";
  sessionId: string;
  totalAmount: number;
  paidAmount: number;
  paid: boolean;
};

export function PaymentStatusWithButton({
  sessionType,
  sessionId,
  totalAmount,
  paidAmount,
  paid,
}: PaymentStatusWithButtonProps) {
  const router = useRouter();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const remaining = totalAmount - paidAmount;
  const isFullyPaid = paid && remaining <= 0;

  if (isFullyPaid) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
        ✓ Paid
      </span>
    );
  }

  if (paidAmount > 0) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="space-y-1">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Partial
          </span>
          <p className="text-xs text-muted-foreground">
            {paidAmount.toFixed(2)} / {totalAmount.toFixed(2)}
          </p>
        </div>
        <Button
          size="sm"
          variant="default"
          onClick={() => setShowPaymentDialog(true)}
          className="h-7 px-3 text-xs font-medium shadow-sm"
        >
          Pay
        </Button>
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          sessionType={sessionType}
          sessionId={sessionId}
          totalAmount={totalAmount}
          paidAmount={paidAmount}
          onPaymentSuccess={() => router.refresh()}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
        Unpaid
      </span>
      <Button
        size="sm"
        variant="default"
        onClick={() => setShowPaymentDialog(true)}
        className="h-7 px-3 text-xs font-medium shadow-sm"
      >
        Pay
      </Button>
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        sessionType={sessionType}
        sessionId={sessionId}
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        onPaymentSuccess={() => router.refresh()}
      />
    </div>
  );
}

