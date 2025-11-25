import { cookies } from "next/headers";
import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import type { Db } from "mongodb";
import { Button } from "@/components/ui/button";
import { RenewVehicleButton } from "@/components/renew-vehicle-button";

type VehicleRecord = {
  _id: string;
  name: string;
  vehicleNumber: string;
  phone: string;
  registerDate: string | Date;
  expiresAt: string | Date;
  planType: string;
  price: number;
  notes?: string;
  createdBy?: string;
  renewedBy?: string;
};

async function getVehicles(db: Db): Promise<VehicleRecord[]> {
  const vehicles = await db
    .collection("vehicles")
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return vehicles.map((vehicle) => ({
    _id: vehicle._id.toString(),
    name: vehicle.name,
    vehicleNumber: vehicle.vehicleNumber,
    phone: vehicle.phone,
    registerDate: vehicle.registerDate,
    expiresAt: vehicle.expiresAt,
    planType: vehicle.planType,
    price: vehicle.price,
    notes: vehicle.notes,
    createdBy: vehicle.createdBy,
    renewedBy: vehicle.renewedBy,
  }));
}

async function getMonthlyStats(db: Db) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const pipeline = [
    {
      $match: {
        registerDate: {
          $gte: monthStart,
          $lt: monthEnd,
        },
      },
    },
    {
      $group: {
        _id: "$planType",
        totalAmount: { $sum: "$price" },
        count: { $sum: 1 },
      },
    },
  ];

  const results = await db.collection("vehicles").aggregate(pipeline).toArray();

  const totals = results.reduce<
    Record<string, { amount: number; count: number }>
  >((acc, result) => {
    const key = typeof result._id === "string" ? result._id : "unknown";
    acc[key] = {
      amount: result.totalAmount ?? 0,
      count: result.count ?? 0,
    };
    return acc;
  }, {});

  const grandTotal = Object.values(totals).reduce(
    (sum, value) => sum + value.amount,
    0,
  );
  const grandCount = Object.values(totals).reduce(
    (sum, value) => sum + value.count,
    0,
  );

  return { totals, grandTotal, grandCount, monthStart };
}

export default async function Dashboard() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";
  const client = await clientPromise;
  const db = client.db();
  const vehicles = await getVehicles(db);
  const { totals, grandTotal, grandCount, monthStart } = await getMonthlyStats(
    db,
  );

  return (
    <div className="bg-muted/20 px-4 py-6 sm:py-10">
      <main className="mx-auto w-full max-w-5xl space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:space-y-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Dashboard
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Recent vehicle registrations
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Viewing as{" "}
              <span className="font-semibold text-foreground">{role}</span>.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/">Back to registration</Link>
          </Button>
        </div>

        <div className="grid gap-3 text-center sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-amber-100/40 p-4 shadow-sm sm:p-5">
            <p className="text-2xs uppercase text-amber-700">
              Current month
            </p>
            <p className="mt-1 text-xl font-semibold text-amber-900 sm:text-2xl">
              AED&nbsp;
              {grandTotal.toFixed(2)}
            </p>
            <p className="text-2xs text-amber-700/80 sm:text-xs">
              {monthStart.toLocaleString("default", {
                month: "long",
              })}{" "}
              revenue ({grandCount} vehicles)
            </p>
          </div>
          {[
            {
              key: "monthly",
              label: "Monthly",
              classes:
                "border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-900",
            },
            {
              key: "weekly",
              label: "Weekly",
              classes:
                "border-sky-100 bg-gradient-to-br from-sky-50 to-sky-100/50 text-sky-900",
            },
            {
              key: "bi-weekly",
              label: "2 Week",
              classes:
                "border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-900",
            },
          ].map((plan) => {
            const planData = totals[plan.key] ?? { amount: 0, count: 0 };
            return (
              <div
                key={plan.key}
                className={`rounded-xl border p-4 shadow-sm sm:p-5 ${plan.classes}`}
              >
                <p className="text-2xs uppercase opacity-80">{plan.label}</p>
                <p className="mt-1 text-xl font-semibold sm:text-2xl">
                  AED&nbsp;
                  {planData.amount.toFixed(2)}
                </p>
                <p className="text-2xs opacity-80 sm:text-xs">
                  {planData.count} vehicles
                </p>
              </div>
            );
          })}
        </div>

        {vehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
            No vehicles registered yet. Submit one from the home page to see it
            here.
          </div>
        ) : (
              <div className="overflow-x-auto rounded-2xl border bg-background">
                <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
                  <thead className="bg-muted/50 text-2xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3">Vehicle</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Registered</th>
                  <th className="px-3 py-3">Expires</th>
                  <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="border-t">
                    <td className="px-3 py-3 font-semibold text-foreground">
                      {vehicle.name}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {vehicle.vehicleNumber}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {vehicle.planType}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      AED&nbsp;
                      {vehicle.price.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {new Date(vehicle.registerDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {new Date(vehicle.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {new Date(vehicle.expiresAt) < new Date() ? (
                        <div className="flex items-center gap-2 text-red-500">
                          <span>Expired</span>
                          <RenewVehicleButton vehicleId={vehicle._id} />
                        </div>
                      ) : (
                        <span className="text-emerald-600">Active</span>
                      )}
                    </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/vehicles/${vehicle._id}`}
                            className="text-xs font-medium text-primary underline underline-offset-2"
                          >
                            View
                          </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

