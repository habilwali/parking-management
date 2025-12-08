import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import { Button } from "@/components/ui/button";
import { RenewVehicleButton } from "@/components/renew-vehicle-button";
import { VehicleActions } from "@/components/vehicle-actions";
import { PaymentStatusWithButton } from "@/components/payment-status-with-button";
import { getDictionary, resolveLanguage } from "@/lib/i18n";
import { MessageCircle } from "lucide-react";

type Params = {
  id: string;
};

async function getVehicle(id: string) {
  const client = await clientPromise;
  const db = client.db();

  const query = { _id: new ObjectId(id) };
  const vehicle = await db.collection("vehicles").findOne(query) as any;

  if (!vehicle) {
    return null;
  }

  return {
    ...vehicle,
    _id: vehicle._id.toString(),
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";
  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dict = getDictionary(language);
  const canManage = role === "super-admin";

  const registerDate = vehicle.registerDate ? new Date(vehicle.registerDate).toLocaleDateString() : "-";
  const expiresAt = vehicle.expiresAt ? new Date(vehicle.expiresAt).toLocaleDateString() : "-";
  const isExpired = vehicle.expiresAt ? new Date(vehicle.expiresAt) < new Date() : false;
  const totalPrice = vehicle.price ?? 0;
  // If expired and not renewed, show payment as 0 (unpaid for new subscription)
  // Otherwise use the current paidAmount
  const paidAmount = isExpired ? 0 : (vehicle.paidAmount ?? 0);
  const remainingAmount = totalPrice - paidAmount;

  // Format phone number for WhatsApp (remove spaces, dashes, etc.)
  const formatPhoneForWhatsApp = (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, "");
  };

  // Create WhatsApp message
  const createWhatsAppMessage = (vehicleName: string, vehicleNumber: string, expiresAt: string, isExpired: boolean): string => {
    const greeting = "Assalamu Alaikum / Hello";
    const status = isExpired 
      ? "has expired" 
      : "is approaching its expiry date";
    const urgency = isExpired 
      ? "We kindly request you to renew your parking subscription as soon as possible to avoid any service interruption." 
      : "We kindly remind you to renew your parking subscription on time to ensure uninterrupted service.";
    
    return `${greeting},

This is a reminder regarding your monthly car parking subscription.

📋 Vehicle Information:
• Owner Name: ${vehicleName}
• Vehicle Number: ${vehicleNumber}
• Subscription Expiry Date: ${expiresAt}

⚠️ Important Notice:
Your monthly parking subscription ${status}. ${urgency}

💡 To renew your subscription, please visit our parking.

Thank you for your continued patronage and cooperation.

Best regards,
Parking Management Team`;
  };

  // Generate WhatsApp URL
  const getWhatsAppUrl = (phone: string): string => {
    if (!phone || phone === "-") return "#";
    const cleanPhone = formatPhoneForWhatsApp(phone);
    const message = createWhatsAppMessage(
      vehicle.name || "Customer",
      vehicle.vehicleNumber || "N/A",
      expiresAt,
      isExpired
    );
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  };

  return (
    <div className="bg-muted/20 px-4 py-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {dict.vehicleDetail.tagline}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {vehicle.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {dict.vehicleDetail.plate} {vehicle.vehicleNumber} · {dict.vehicleDetail.plan} {vehicle.planType}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isExpired ? (
              <RenewVehicleButton 
                vehicleId={vehicle._id}
                totalAmount={totalPrice}
                paidAmount={paidAmount}
              />
            ) : null}
            <VehicleActions 
              vehicleId={vehicle._id} 
              vehicle={{
                name: vehicle.name || "",
                vehicleNumber: vehicle.vehicleNumber || "",
                phone: vehicle.phone || "",
                registerDate: vehicle.registerDate || new Date(),
                planType: vehicle.planType || "monthly",
                price: totalPrice,
                notes: vehicle.notes,
              }}
              canManage={canManage} 
            />
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">{dict.vehicleDetail.backToDashboard}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-2xs uppercase text-muted-foreground">{dict.vehicleDetail.contact}</p>
            {vehicle.phone && vehicle.phone !== "-" ? (
              <div className="space-y-1">
                <a
                  href={getWhatsAppUrl(vehicle.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors group cursor-pointer"
                >
                  <span className="underline decoration-2 underline-offset-2">{vehicle.phone}</span>
                  <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </a>
                <p className="text-xs text-muted-foreground">
                  Click to send WhatsApp message
                </p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-foreground">
                {vehicle.phone || "-"}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {dict.vehicleDetail.createdBy} {vehicle.createdBy ?? "unknown"}
            </p>
          </div>
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-2xs uppercase text-muted-foreground">
              {dict.vehicleDetail.billing}
            </p>
            <p className="text-sm font-semibold text-foreground">
              AED&nbsp;{totalPrice.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {vehicle.planType || "-"} {dict.vehicleDetail.subscription}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-2xs uppercase text-muted-foreground mb-3">
            Payment Details
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-semibold text-foreground">
                AED {totalPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Paid Amount:</span>
              <span className="font-semibold text-foreground">
                AED {paidAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-t pt-3">
              <span className="text-muted-foreground">Remaining:</span>
              <span className={`font-semibold ${remainingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                AED {remainingAmount.toFixed(2)}
              </span>
            </div>
            <div className="pt-2">
              <PaymentStatusWithButton
                sessionType="monthly"
                sessionId={vehicle._id}
                totalAmount={totalPrice}
                paidAmount={paidAmount}
                paid={vehicle.paid ?? false}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-2xs uppercase text-muted-foreground">
            {dict.vehicleDetail.timeline}
          </p>
          <div className="mt-3 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-foreground/70">
                {dict.vehicleDetail.registered}
              </p>
              <p className="text-base font-semibold text-foreground">
                {registerDate}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-foreground/70">
                {dict.vehicleDetail.expires}
              </p>
              <p
                className={`text-base font-semibold ${
                  isExpired ? "text-red-500" : "text-foreground"
                }`}
              >
                {expiresAt}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-2xs uppercase text-muted-foreground">
            {dict.vehicleDetail.notes}
          </p>
          <p className="mt-3 text-sm text-foreground">
            {vehicle.notes?.length ? vehicle.notes : dict.vehicleDetail.noNotes}
          </p>
        </div>
      </main>
    </div>
  );
}

