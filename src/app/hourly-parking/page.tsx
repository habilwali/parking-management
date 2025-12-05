import { cookies } from "next/headers";
import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import type { Db } from "mongodb";
import { Button } from "@/components/ui/button";
import { PaymentStatusWithButton } from "@/components/payment-status-with-button";
import { PaymentFilter } from "@/components/payment-filter";
import { VehicleSearch } from "@/components/vehicle-search";
import { Pagination } from "@/components/pagination";
import { getDictionary, resolveLanguage } from "@/lib/i18n";

type HourlySession = {
  _id: string;
  vehicleNumber: string;
  hourlyRate?: number;
  startTime: Date | string;
  endTime?: Date | string;
  elapsedMinutes: number;
  billableMinutes: number;
  billableHours: number;
  totalPrice: number;
  bufferApplied?: boolean;
  paid?: boolean;
  paidAmount?: number;
  createdBy?: string;
  createdAt?: Date | string;
};

async function getHourlySessions(
  db: Db,
  page: number = 1,
  pageSize: number = 20,
  paymentFilter?: "paid" | "unpaid",
  search?: string,
): Promise<{ sessions: HourlySession[]; total: number }> {
  const skip = (page - 1) * pageSize;

  // Build query based on payment filter and search
  const query: any = {};
  
  // Payment filter
  if (paymentFilter === "paid") {
    // Show records where paidAmount >= totalPrice (fully paid)
    query.$expr = {
      $gte: [{ $ifNull: ["$paidAmount", 0] }, "$totalPrice"],
    };
  } else if (paymentFilter === "unpaid") {
    // Show records where paidAmount < totalPrice or paidAmount doesn't exist
    query.$expr = {
      $lt: [{ $ifNull: ["$paidAmount", 0] }, "$totalPrice"],
    };
  }
  
  // Vehicle number search (case-insensitive)
  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    if (query.$expr) {
      // Combine with existing $expr using $and
      query.$and = [
        { $expr: query.$expr },
        { vehicleNumber: searchRegex },
      ];
      delete query.$expr;
    } else {
      query.vehicleNumber = searchRegex;
    }
  }

  const [sessions, total] = await Promise.all([
    db
      .collection("hourly_sessions")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    db.collection("hourly_sessions").countDocuments(query),
  ]);

  return {
    sessions: sessions.map((entry) => ({
      _id: entry._id.toString(),
      vehicleNumber: entry.vehicleNumber,
      hourlyRate: entry.hourlyRate ?? 5,
      startTime: entry.startTime,
      endTime: entry.endTime,
      elapsedMinutes: entry.elapsedMinutes ?? 0,
      billableMinutes: entry.billableMinutes ?? 0,
      billableHours: entry.billableHours ?? 0,
      totalPrice: entry.totalPrice ?? 0,
      bufferApplied: entry.bufferApplied ?? false,
      paid: entry.paid ?? false,
      paidAmount: entry.paidAmount ?? 0,
      createdBy: entry.createdBy ?? "unknown",
      createdAt: entry.createdAt,
    })),
    total,
  };
}

export default async function HourlyParkingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; filter?: string | string[]; search?: string | string[] }>;
}) {
  const cookieStore = await cookies();
  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dict = getDictionary(language);

  const params = await searchParams;
  const pageValue = params?.page;
  const filterValue = params?.filter;
  const searchValue = params?.search;
  
  let pageParam: string | undefined;
  if (pageValue) {
    if (Array.isArray(pageValue)) {
      pageParam = pageValue[0];
    } else if (typeof pageValue === "string") {
      pageParam = pageValue;
    }
  }
  
  let paymentFilter: "paid" | "unpaid" | undefined;
  if (filterValue) {
    if (Array.isArray(filterValue)) {
      paymentFilter = filterValue[0] === "paid" || filterValue[0] === "unpaid" ? filterValue[0] : undefined;
    } else if (filterValue === "paid" || filterValue === "unpaid") {
      paymentFilter = filterValue;
    }
  }
  
  let searchQuery: string | undefined;
  if (searchValue) {
    if (Array.isArray(searchValue)) {
      searchQuery = searchValue[0];
    } else if (typeof searchValue === "string") {
      searchQuery = searchValue;
    }
  }
  
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const pageSize = 20;

  const client = await clientPromise;
  const db = client.db();
  const { sessions, total } = await getHourlySessions(db, currentPage, pageSize, paymentFilter, searchQuery);
  const totalPages = Math.ceil(total / pageSize);

  // Calculate totals from filtered results
  const totalAmount = sessions.reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);
  const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalPrice ?? 0), 0);

  return (
    <div className="bg-muted/20 px-4 py-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Hourly Parking
            </p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              All Hourly Parking Records
            </h1>
            <p className="text-sm text-muted-foreground">
              Complete list of all hourly parking sessions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/parking-sessions">Back to Sessions</Link>
            </Button>
          </div>
        </header>


        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40 p-4 shadow-sm dark:border-amber-900/50 dark:from-amber-950/50 dark:to-amber-900/30 sm:p-5">
          <p className="text-2xs uppercase text-amber-700 dark:text-amber-400">
            {paymentFilter === "paid" 
              ? "Total Paid Revenue" 
              : paymentFilter === "unpaid"
              ? "Total Unpaid Revenue"
              : "Total Paid Revenue"}
          </p>
          <p className="mt-1 text-xl font-semibold text-amber-900 dark:text-amber-300 sm:text-2xl">
            AED {totalAmount.toFixed(2)}
          </p>
          <p className="text-2xs text-amber-700/80 dark:text-amber-400/70 sm:text-xs">
            {total} {total === 1 ? "session" : "sessions"}
            {paymentFilter && ` (${paymentFilter})`}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 mb-2">
          <VehicleSearch baseUrl="/hourly-parking" />
          <PaymentFilter currentFilter={paymentFilter} baseUrl="/hourly-parking" />
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
            No hourly parking sessions found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border bg-background">
              <table className="w-full min-w-[800px] text-left text-xs sm:text-sm">
                <thead className="bg-muted/50 text-2xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Vehicle</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Start Time</th>
                    <th className="px-3 py-2">End Time</th>
                    <th className="px-3 py-2">Elapsed</th>
                    <th className="px-3 py-2">Billed</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
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
                        {session.endTime
                          ? new Date(session.endTime).toLocaleString()
                          : "-"}
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

            <div className="mt-6 rounded-xl border bg-background p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="/hourly-parking"
                searchParams={{
                  ...(paymentFilter ? { filter: paymentFilter } : {}),
                  ...(searchQuery ? { search: searchQuery } : {}),
                  ...(language === "ps" ? { lang: "ps" } : {}),
                }}
                showing={`Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(
                  currentPage * pageSize,
                  total,
                )} of ${total} sessions`}
                previousLabel="Previous"
                nextLabel="Next"
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

