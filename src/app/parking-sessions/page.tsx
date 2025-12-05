import { cookies } from "next/headers";
import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import type { Db } from "mongodb";
import { Button } from "@/components/ui/button";
import { PaymentStatusWithButton } from "@/components/payment-status-with-button";
import { getDictionary, resolveLanguage } from "@/lib/i18n";

function PaymentStatusCell({
  totalAmount,
  paidAmount,
  paid,
}: {
  totalAmount: number;
  paidAmount: number;
  paid: boolean;
}) {
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
      <div className="space-y-1">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          Partial
        </span>
        <p className="text-xs text-muted-foreground">
          Paid: {paidAmount.toFixed(2)} / {totalAmount.toFixed(2)}
        </p>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
      Unpaid
    </span>
  );
}

type ActiveHourlyVehicle = {
  _id: string;
  vehicleNumber: string;
  hourlyRate: number;
  startTime: Date | string;
  createdBy?: string;
};

type HourlySession = {
  _id: string;
  vehicleNumber: string;
  hourlyRate?: number;
  startTime: Date | string;
  elapsedMinutes: number;
  billableMinutes: number;
  billableHours: number;
  totalPrice: number;
  bufferApplied?: boolean;
  paid?: boolean;
  paidAmount?: number;
  createdBy?: string;
};

type NightSession = {
  _id: string;
  vehicleNumber: string;
  timestamp: Date | string;
  price: number;
  paid?: boolean;
  paidAmount?: number;
  createdBy?: string;
};

async function getActiveHourlyVehicles(db: Db): Promise<ActiveHourlyVehicle[]> {
  const entries = await db
    .collection("active_hourly_vehicles")
    .find({})
    .sort({ startTime: -1 })
    .toArray();

  return entries.map((entry) => ({
    _id: entry._id.toString(),
    vehicleNumber: entry.vehicleNumber,
    hourlyRate: entry.hourlyRate ?? 5,
    startTime: entry.startTime,
    createdBy: entry.createdBy ?? "unknown",
  }));
}

async function getTodayHourlySessions(db: Db): Promise<HourlySession[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const entries = await db
    .collection("hourly_sessions")
    .find({
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    })
    .sort({ createdAt: -1 })
    .toArray();

  return entries.map((entry) => ({
    _id: entry._id.toString(),
    vehicleNumber: entry.vehicleNumber,
    hourlyRate: entry.hourlyRate ?? 5,
    startTime: entry.startTime,
    elapsedMinutes: entry.elapsedMinutes ?? 0,
    billableMinutes: entry.billableMinutes ?? 0,
    billableHours: entry.billableHours ?? 0,
    totalPrice: entry.totalPrice ?? 0,
    bufferApplied: entry.bufferApplied ?? false,
    paid: entry.paid ?? false,
    paidAmount: entry.paidAmount ?? 0,
    createdBy: entry.createdBy ?? "unknown",
  }));
}

async function getTodayNightSessions(db: Db): Promise<NightSession[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const entries = await db
    .collection("night_sessions")
    .find({
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    })
    .sort({ createdAt: -1 })
    .toArray();

  return entries.map((entry) => ({
    _id: entry._id.toString(),
    vehicleNumber: entry.vehicleNumber,
    timestamp: entry.timestamp,
    price: entry.price ?? 0,
    paid: entry.paid ?? false,
    paidAmount: entry.paidAmount ?? 0,
    createdBy: entry.createdBy ?? "unknown",
  }));
}

function calculateElapsedTime(startTime: Date | string): number {
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const diffMs = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}

function calculateBillableHours(elapsedMinutes: number): number {
  const BUFFER_MINUTES = 10;
  const billable = elapsedMinutes > 60 ? elapsedMinutes + BUFFER_MINUTES : Math.max(1, elapsedMinutes || 1);
  return Math.max(1, Math.ceil(billable / 60));
}

export default async function ParkingSessionsPage() {
  const cookieStore = await cookies();
  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dict = getDictionary(language);

  const client = await clientPromise;
  const db = client.db();
  const [activeVehicles, hourly, night] = await Promise.all([
    getActiveHourlyVehicles(db),
    getTodayHourlySessions(db),
    getTodayNightSessions(db),
  ]);

  const hourlyTotal = hourly.reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);
  const nightTotal = night.reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);
  const grandTotal = hourlyTotal + nightTotal;

  return (
    <div className="bg-muted/20 px-4 py-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {dict.sessions.tagline}
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {dict.sessions.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dict.sessions.description}
          </p>
        </header>

        {(hourlyTotal > 0 || nightTotal > 0) && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100 p-3 text-center shadow-sm dark:from-amber-950/30 dark:to-amber-900/20">
              <p className="text-2xs uppercase text-muted-foreground">{dict.sessions.hourlyTotal}</p>
              <p className="text-lg font-semibold text-foreground sm:text-xl">
                AED {hourlyTotal.toFixed(2)}
              </p>
              <p className="text-2xs text-muted-foreground">
                {hourly.length} {dict.sessions.sessions}{hourly.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-3 text-center shadow-sm dark:from-blue-950/30 dark:to-blue-900/20">
              <p className="text-2xs uppercase text-muted-foreground">{dict.sessions.nightTotal}</p>
              <p className="text-lg font-semibold text-foreground sm:text-xl">
                AED {nightTotal.toFixed(2)}
              </p>
              <p className="text-2xs text-muted-foreground">
                {night.length} {dict.sessions.sessions}{night.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 text-center shadow-sm dark:from-emerald-950/30 dark:to-emerald-900/20">
              <p className="text-2xs uppercase text-muted-foreground">{dict.sessions.grandTotal}</p>
              <p className="text-lg font-semibold text-foreground sm:text-xl">
                AED {grandTotal.toFixed(2)}
              </p>
              <p className="text-2xs text-muted-foreground">{dict.sessions.allSessions}</p>
            </div>
          </div>
        )}

        <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">
            {dict.sessions.activeHourlyVehicles}
          </h2>
          {activeVehicles.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {dict.sessions.noActiveVehicles}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
                <thead className="bg-muted/50 text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.vehicle}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.rate}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.started}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.elapsed}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.estimated}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.createdBy}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeVehicles.map((vehicle) => {
                    const elapsed = calculateElapsedTime(vehicle.startTime);
                    const billableHours = calculateBillableHours(elapsed);
                    const estimated = billableHours * vehicle.hourlyRate;
                    return (
                      <tr key={vehicle._id} className="border-t">
                        <td className="px-3 py-2 font-semibold text-foreground">
                          {vehicle.vehicleNumber}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          AED {vehicle.hourlyRate.toFixed(2)}/hr
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(vehicle.startTime).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {elapsed}m
                        </td>
                        <td className="px-3 py-2 font-medium text-amber-600 dark:text-amber-500">
                          ~AED {estimated.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {vehicle.createdBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {dict.sessions.completedHourlySessions}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Today's completed sessions
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/hourly-parking">View All Records</Link>
            </Button>
          </div>
          {hourly.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {dict.sessions.noHourlySessions}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
                <thead className="bg-muted/50 text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.vehicle}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.rate}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.started}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.elapsed}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.billed}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.total}</th>
                    <th className="px-3 py-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {hourly.map((session) => (
                    <tr key={session._id} className="border-t">
                      <td className="px-3 py-2 font-semibold text-foreground">
                        <Link
                          href={`/hourly-parking/${session._id}`}
                          className="text-primary hover:underline"
                        >
                          {session.vehicleNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        AED {session.hourlyRate?.toFixed(2) ?? "5.00"}/hr
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(session.startTime).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {session.elapsedMinutes}m
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {session.billableHours}h
                        {session.bufferApplied ? " (+buf)" : ""}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        AED {session.totalPrice?.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <PaymentStatusWithButton
                          sessionType="hourly"
                          sessionId={session._id}
                          totalAmount={session.totalPrice ?? 0}
                          paidAmount={session.paidAmount ?? 0}
                          paid={session.paid ?? false}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {dict.sessions.nightSessions}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Today's night parking sessions
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/night-parking">View All Records</Link>
            </Button>
          </div>
          {night.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {dict.sessions.noNightSessions}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
                <thead className="bg-muted/50 text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.vehicle}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.timestamp}</th>
                    <th className="px-3 py-2">{dict.sessions.tableHeaders.price}</th>
                    <th className="px-3 py-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {night.map((session) => (
                    <tr key={session._id} className="border-t">
                      <td className="px-3 py-2 font-semibold text-foreground">
                        <Link
                          href={`/night-parking/${session._id}`}
                          className="text-primary hover:underline"
                        >
                          {session.vehicleNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(session.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        AED {session.price?.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <PaymentStatusWithButton
                          sessionType="night"
                          sessionId={session._id}
                          totalAmount={session.price ?? 0}
                          paidAmount={session.paidAmount ?? 0}
                          paid={session.paid ?? false}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

