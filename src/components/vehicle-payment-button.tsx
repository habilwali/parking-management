"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/components/payment-dialog";

type VehiclePaymentButtonProps = {
  vehicleId: string;
  totalAmount: number;
  paidAmount: number;
};

export function VehiclePaymentButton({
  vehicleId,
  totalAmount,
  paidAmount,
}: VehiclePaymentButtonProps) {
  const router = useRouter();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const isFullyPaid = paidAmount >= totalAmount;

  if (isFullyPaid) {
    return null;
  }

  return (
    <>
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
        sessionType="monthly"
        sessionId={vehicleId}
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        onPaymentSuccess={() => router.refresh()}
      />
    </>
  );
}

