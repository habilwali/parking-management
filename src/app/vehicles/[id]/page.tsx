import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import { Button } from "@/components/ui/button";
import { RenewVehicleButton } from "@/components/renew-vehicle-button";
import { getDictionary, resolveLanguage } from "@/lib/i18n";

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
  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dict = getDictionary(language);

  const registerDate = new Date(vehicle.registerDate).toLocaleDateString();
  const expiresAt = new Date(vehicle.expiresAt).toLocaleDateString();
  const isExpired = new Date(vehicle.expiresAt) < new Date();

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
              <RenewVehicleButton vehicleId={vehicle._id} />
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">{dict.vehicleDetail.backToDashboard}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-2xs uppercase text-muted-foreground">{dict.vehicleDetail.contact}</p>
            <p className="text-sm font-semibold text-foreground">
              {vehicle.phone}
            </p>
            <p className="text-xs text-muted-foreground">
              {dict.vehicleDetail.createdBy} {vehicle.createdBy ?? "unknown"}
            </p>
          </div>
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-2xs uppercase text-muted-foreground">
              {dict.vehicleDetail.billing}
            </p>
            <p className="text-sm font-semibold text-foreground">
              AED&nbsp;{vehicle.price.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {vehicle.planType} {dict.vehicleDetail.subscription}
            </p>
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

