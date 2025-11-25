import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import type { Db } from "mongodb";
import { SessionActions } from "@/components/session-actions";

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
  createdBy?: string;
};

type NightSession = {
  _id: string;
  vehicleNumber: string;
  timestamp: Date | string;
  price: number;
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

async function getHourlySessions(db: Db): Promise<HourlySession[]> {
  const entries = await db
    .collection("hourly_sessions")
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
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
    createdBy: entry.createdBy ?? "unknown",
  }));
}

async function getNightSessions(db: Db): Promise<NightSession[]> {
  const entries = await db
    .collection("night_sessions")
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return entries.map((entry) => ({
    _id: entry._id.toString(),
    vehicleNumber: entry.vehicleNumber,
    timestamp: entry.timestamp,
    price: entry.price ?? 0,
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
  const role = cookieStore.get("role")?.value ?? "guest";
  const canManage = role === "super-admin";

  const client = await clientPromise;
  const db = client.db();
  const [activeVehicles, hourly, night] = await Promise.all([
    getActiveHourlyVehicles(db),
    getHourlySessions(db),
    getNightSessions(db),
  ]);

  const hourlyTotal = hourly.reduce((sum, s) => sum + (s.totalPrice ?? 0), 0);
  const nightTotal = night.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const grandTotal = hourlyTotal + nightTotal;

  return (
    <div className="bg-muted/20 px-4 py-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Parking Sessions
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Hourly &amp; night bookings
          </h1>
          <p className="text-sm text-muted-foreground">
            Track ad-hoc parking sessions. Edit/delete actions are limited to
            super admins.
          </p>
        </header>

        {(hourlyTotal > 0 || nightTotal > 0) && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100 p-3 text-center shadow-sm dark:from-amber-950/30 dark:to-amber-900/20">
              <p className="text-2xs uppercase text-muted-foreground">Hourly total</p>
              <p className="text-lg font-semibold text-foreground sm:text-xl">
                AED {hourlyTotal.toFixed(2)}
              </p>
              <p className="text-2xs text-muted-foreground">
                {hourly.length} session{hourly.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 p-3 text-center shadow-sm dark:from-blue-950/30 dark:to-blue-900/20">
              <p className="text-2xs uppercase text-muted-foreground">Night total</p>
              <p className="text-lg font-semibold text-foreground sm:text-xl">
                AED {nightTotal.toFixed(2)}
              </p>
              <p className="text-2xs text-muted-foreground">
                {night.length} session{night.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 text-center shadow-sm dark:from-emerald-950/30 dark:to-emerald-900/20">
              <p className="text-2xs uppercase text-muted-foreground">Grand total</p>
              <p className="text-lg font-semibold text-foreground sm:text-xl">
                AED {grandTotal.toFixed(2)}
              </p>
              <p className="text-2xs text-muted-foreground">All sessions</p>
            </div>
          </div>
        )}

        <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Active hourly vehicles
          </h2>
          {activeVehicles.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No active hourly vehicles.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
                <thead className="bg-muted/50 text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Vehicle</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Started</th>
                    <th className="px-3 py-2">Elapsed</th>
                    <th className="px-3 py-2">Estimated</th>
                    <th className="px-3 py-2">Created by</th>
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
          <h2 className="text-lg font-semibold text-foreground">
            Completed hourly sessions
          </h2>
          {hourly.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No hourly sessions recorded yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
                <thead className="bg-muted/50 text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Vehicle</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Started</th>
                    <th className="px-3 py-2">Elapsed</th>
                    <th className="px-3 py-2">Billed</th>
                    <th className="px-3 py-2">Total (AED)</th>
                    <th className="px-3 py-2">Created by</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hourly.map((session) => (
                    <tr key={session._id} className="border-t">
                      <td className="px-3 py-2 font-semibold text-foreground">
                        {session.vehicleNumber}
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
                        {session.totalPrice?.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {session.createdBy}
                      </td>
                      <td className="px-3 py-2">
                        <SessionActions
                          sessionType="hourly"
                          sessionId={session._id}
                          canManage={canManage}
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
          <h2 className="text-lg font-semibold text-foreground">
            Night sessions
          </h2>
          {night.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No night sessions recorded yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
                <thead className="bg-muted/50 text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Vehicle</th>
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2">Price (AED)</th>
                    <th className="px-3 py-2">Created by</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {night.map((session) => (
                    <tr key={session._id} className="border-t">
                      <td className="px-3 py-2 font-semibold text-foreground">
                        {session.vehicleNumber}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(session.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {session.price?.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {session.createdBy}
                      </td>
                      <td className="px-3 py-2">
                        <SessionActions
                          sessionType="night"
                          sessionId={session._id}
                          canManage={canManage}
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

