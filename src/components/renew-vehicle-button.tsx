"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/components/payment-dialog";

type RenewVehicleButtonProps = {
  vehicleId: string;
  totalAmount: number;
  paidAmount: number;
};

export function RenewVehicleButton({ 
  vehicleId, 
  totalAmount, 
  paidAmount 
}: RenewVehicleButtonProps) {
  const router = useRouter();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  return (
    <>
      <Button 
        size="sm" 
        onClick={() => setShowPaymentDialog(true)}
      >
        Renew
      </Button>
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        sessionType="monthly"
        sessionId={vehicleId}
        totalAmount={totalAmount}
        paidAmount={0}
        onPaymentSuccess={() => router.refresh()}
        allowAnyAmount={true}
      />
    </>
  );
}

