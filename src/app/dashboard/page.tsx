import { cookies } from "next/headers";
import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import type { Db } from "mongodb";
import { Button } from "@/components/ui/button";
import { RenewVehicleButton } from "@/components/renew-vehicle-button";
import { VehiclePaymentButton } from "@/components/vehicle-payment-button";
import { Pagination } from "@/components/pagination";
import { VehicleSearch } from "@/components/vehicle-search";
import { PaymentFilter } from "@/components/payment-filter";
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
          {paidAmount.toFixed(2)} / {totalAmount.toFixed(2)}
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

type VehicleRecord = {
  _id: string;
  name: string;
  vehicleNumber: string;
  phone: string;
  registerDate: string | Date;
  expiresAt: string | Date;
  planType: string;
  price: number;
  paid?: boolean;
  paidAmount?: number;
  notes?: string;
  createdBy?: string;
  renewedBy?: string;
};

async function getVehicles(
  db: Db,
  monthStart: Date,
  monthEnd: Date,
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  paymentFilter?: "paid" | "unpaid",
): Promise<{ vehicles: VehicleRecord[]; total: number }> {
  const skip = (page - 1) * pageSize;

  // Base query: Include vehicles that were registered in the month OR expire in the month
  const conditions: any[] = [
    {
      $or: [
        {
          registerDate: {
            $gte: monthStart,
            $lt: monthEnd,
          },
        },
        {
          expiresAt: {
            $gte: monthStart,
            $lt: monthEnd,
          },
        },
      ],
    },
  ];

  // Add vehicle number search filter
  if (search && search.trim()) {
    conditions.push({
      vehicleNumber: {
        $regex: search.trim(),
        $options: "i", // case-insensitive
      },
    });
  }

  // Add payment status filter
  if (paymentFilter === "paid") {
    conditions.push({
      $expr: {
        $gte: [{ $ifNull: ["$paidAmount", 0] }, "$price"],
      },
    });
  } else if (paymentFilter === "unpaid") {
    conditions.push({
      $expr: {
        $lt: [{ $ifNull: ["$paidAmount", 0] }, "$price"],
      },
    });
  }

  const baseQuery = conditions.length > 1 ? { $and: conditions } : conditions[0];

  const [vehicles, total] = await Promise.all([
    db
      .collection("vehicles")
      .find(baseQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    db.collection("vehicles").countDocuments(baseQuery),
  ]);

  return {
    vehicles: vehicles.map((vehicle) => ({
      _id: vehicle._id.toString(),
      name: vehicle.name ?? "",
      vehicleNumber: vehicle.vehicleNumber ?? "",
      phone: vehicle.phone ?? "",
      registerDate: vehicle.registerDate ?? new Date(),
      expiresAt: vehicle.expiresAt ?? new Date(),
      planType: vehicle.planType ?? "",
      price: vehicle.price ?? 0,
      paid: vehicle.paid ?? false,
      paidAmount: vehicle.paidAmount ?? 0,
      notes: vehicle.notes,
      createdBy: vehicle.createdBy,
      renewedBy: vehicle.renewedBy,
    })),
    total,
  };
}

async function getMonthlyStats(db: Db, monthStart: Date, monthEnd: Date) {
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
        totalAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
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

  return { totals, grandTotal, grandCount };
}

async function getHourlySummary(
  db: Db,
  monthStart: Date,
  monthEnd: Date,
): Promise<{ totalAmount: number; count: number }> {
  const pipeline = [
    {
      $match: {
        startTime: {
          $gte: monthStart,
          $lt: monthEnd,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
        count: { $sum: 1 },
      },
    },
  ];

  const [result] = await db.collection("hourly_sessions").aggregate(pipeline).toArray();

  return {
    totalAmount: result?.totalAmount ?? 0,
    count: result?.count ?? 0,
  };
}

async function getNightSummary(
  db: Db,
  monthStart: Date,
  monthEnd: Date,
): Promise<{ totalAmount: number; count: number }> {
  const pipeline = [
    {
      $match: {
        timestamp: {
          $gte: monthStart,
          $lt: monthEnd,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
        count: { $sum: 1 },
      },
    },
  ];

  const [result] = await db.collection("night_sessions").aggregate(pipeline).toArray();

  return {
    totalAmount: result?.totalAmount ?? 0,
    count: result?.count ?? 0,
  };
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ 
    month?: string | string[]; 
    page?: string | string[];
    search?: string | string[];
    filter?: string | string[];
  }>;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";
  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dict = getDictionary(language);
  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Await searchParams in Next.js 16
  const params = await searchParams;

  let selectedYear = currentYear;
  let selectedMonth = currentMonth;

  // Safely extract month parameter
  let monthParam: string | undefined;
  const monthValue = params?.month;
  if (monthValue) {
    if (Array.isArray(monthValue)) {
      monthParam = monthValue[0];
    } else if (typeof monthValue === "string") {
      monthParam = monthValue;
    }
  }

  if (monthParam && monthParam.length > 0) {
    const parts = monthParam.split("-");
    if (parts.length === 2) {
      const [yearStr, monthStr] = parts;
      const parsedYear = Number(yearStr);
      const parsedMonthIndex = Number(monthStr) - 1;
      if (
        Number.isFinite(parsedYear) &&
        Number.isFinite(parsedMonthIndex) &&
        parsedMonthIndex >= 0 &&
        parsedMonthIndex <= 11
      ) {
        selectedYear = parsedYear;
        selectedMonth = parsedMonthIndex;
      }
    }
  }

  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd = new Date(selectedYear, selectedMonth + 1, 1);
  const selectedValue = `${selectedYear}-${(selectedMonth + 1)
    .toString()
    .padStart(2, "0")}`;

  const pageSize = 10;
  // Safely extract page parameter
  let pageParam: string | undefined;
  const pageValue = params?.page;
  if (pageValue) {
    if (Array.isArray(pageValue)) {
      pageParam = pageValue[0];
    } else if (typeof pageValue === "string") {
      pageParam = pageValue;
    }
  }
  const currentPage = Math.max(1, Number(pageParam) || 1);

  // Extract search parameter
  let searchParam: string | undefined;
  const searchValue = params?.search;
  if (searchValue) {
    if (Array.isArray(searchValue)) {
      searchParam = searchValue[0];
    } else if (typeof searchValue === "string") {
      searchParam = searchValue;
    }
  }

  // Extract filter parameter
  let filterParam: "paid" | "unpaid" | undefined;
  const filterValue = params?.filter;
  if (filterValue) {
    const filterStr = Array.isArray(filterValue) ? filterValue[0] : filterValue;
    if (filterStr === "paid" || filterStr === "unpaid") {
      filterParam = filterStr;
    }
  }

  const monthOptions = Array.from({ length: 12 }).map((_, index) => {
    const optionDate = new Date(currentYear, currentMonth - index, 1);
    const value = `${optionDate.getFullYear()}-${(optionDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    const label = optionDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    return { value, label };
  });

  const [vehiclesData, monthlyStats, hourlySummary, nightSummary] =
    await Promise.all([
      getVehicles(db, monthStart, monthEnd, currentPage, pageSize, searchParam, filterParam),
      getMonthlyStats(db, monthStart, monthEnd),
      getHourlySummary(db, monthStart, monthEnd),
      getNightSummary(db, monthStart, monthEnd),
    ]);

  const { vehicles, total: totalVehicles } = vehiclesData;
  const totalPages = Math.ceil(totalVehicles / pageSize);

  const { totals, grandTotal, grandCount } = monthlyStats;
  const combinedTotal =
    grandTotal + hourlySummary.totalAmount + nightSummary.totalAmount;
  const combinedCount =
    grandCount + hourlySummary.count + nightSummary.count;

  return (
    <div className="bg-muted/20 px-4 py-6 sm:py-10">
      <main className="mx-auto w-full max-w-5xl space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:space-y-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {dict.dashboard.tagline}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {dict.dashboard.title}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {dict.dashboard.viewingAs(role)}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/">{dict.dashboard.backToRegistration}</Link>
          </Button>
        </div>

        <form
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-2xl border bg-background p-4 sm:p-5"
        >
          <div className="flex flex-1 flex-col gap-2 min-w-[200px]">
            <label
              htmlFor="month-select"
              className="text-xs font-medium tracking-wide text-muted-foreground"
            >
              {dict.dashboard.selectMonth}
            </label>
            <select
              id="month-select"
              name="month"
              defaultValue={selectedValue}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input type="hidden" name="page" value="1" />
          </div>
          <Button type="submit" size="sm" className="w-full sm:w-auto">
            {dict.dashboard.viewMonth}
          </Button>
        </form>

        <div className="grid gap-3 text-center sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40 p-4 shadow-sm dark:border-amber-900/50 dark:from-amber-950/50 dark:to-amber-900/30 sm:p-5">
            <p className="text-2xs uppercase text-amber-700 dark:text-amber-400">
              {dict.dashboard.allParkingRevenue}
            </p>
            <p className="mt-1 text-xl font-semibold text-amber-900 dark:text-amber-300 sm:text-2xl">
              AED&nbsp;
              {combinedTotal.toFixed(2)}
            </p>
            <p className="text-2xs text-amber-700/80 dark:text-amber-400/70 sm:text-xs">
              {monthStart.toLocaleString("default", {
                month: "long",
              })}{" "}
              ({combinedCount} {dict.dashboard.entries})
            </p>
          </div>
          {[
            {
              key: "monthly",
              label: dict.dashboard.monthly,
              classes:
                "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-900 dark:border-emerald-900/50 dark:from-emerald-950/50 dark:to-emerald-900/30 dark:text-emerald-300",
            },
            {
              key: "weekly",
              label: dict.dashboard.weekly,
              classes:
                "border-sky-200 bg-gradient-to-br from-sky-50 to-sky-100/50 text-sky-900 dark:border-sky-900/50 dark:from-sky-950/50 dark:to-sky-900/30 dark:text-sky-300",
            },
            {
              key: "bi-weekly",
              label: dict.dashboard.twoWeek,
              classes:
                "border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-900 dark:border-purple-900/50 dark:from-purple-950/50 dark:to-purple-900/30 dark:text-purple-300",
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
                  {planData.count} {dict.dashboard.vehicles}
                </p>
              </div>
            );
          })}
          <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 text-rose-900 shadow-sm dark:border-rose-900/50 dark:from-rose-950/50 dark:to-rose-900/30 dark:text-rose-300 sm:p-5">
            <p className="text-2xs uppercase opacity-80 dark:opacity-90">{dict.dashboard.hourlySessions}</p>
            <p className="mt-1 text-xl font-semibold sm:text-2xl">
              AED&nbsp;
              {hourlySummary.totalAmount.toFixed(2)}
            </p>
            <p className="text-2xs opacity-80 dark:opacity-70 sm:text-xs">
              {hourlySummary.count} {dict.dashboard.activeSessionsLogged}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/60 p-4 text-slate-900 shadow-sm dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-800/30 dark:text-slate-300 sm:p-5">
            <p className="text-2xs uppercase opacity-80 dark:opacity-90">{dict.dashboard.nightParking}</p>
            <p className="mt-1 text-xl font-semibold sm:text-2xl">
              AED&nbsp;
              {nightSummary.totalAmount.toFixed(2)}
            </p>
            <p className="text-2xs opacity-80 dark:opacity-70 sm:text-xs">
              {nightSummary.count} {dict.dashboard.staysRecorded}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <VehicleSearch 
            baseUrl="/dashboard" 
            preserveParams={monthParam ? ["month"] : []}
          />
          <PaymentFilter 
            currentFilter={filterParam} 
            baseUrl="/dashboard"
            preserveParams={monthParam ? ["month"] : []}
          />
        </div>

        {vehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
            {dict.dashboard.noVehicles}
          </div>
        ) : (
              <div 
                className="overflow-x-auto rounded-2xl border bg-background -mx-4 sm:mx-0 px-4 sm:px-0" 
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-x',
                  overflowX: 'auto',
                  overflowY: 'visible',
                  scrollbarWidth: 'thin'
                }}
              >
                <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
                  <thead className="bg-muted/50 text-2xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">{dict.dashboard.driver}</th>
                  <th className="px-3 py-3">{dict.dashboard.vehicle}</th>
                  <th className="px-3 py-3">{dict.dashboard.registered}</th>
                  <th className="px-3 py-3">{dict.dashboard.expires}</th>
                  <th className="px-3 py-3">{dict.dashboard.status}</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3 hidden sm:table-cell">{dict.dashboard.plan}</th>
                  <th className="px-3 py-3 hidden md:table-cell">{dict.dashboard.price}</th>
                      <th className="px-3 py-3 hidden md:table-cell">{dict.dashboard.details}</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => {
                  const registerDate = vehicle.registerDate ? new Date(vehicle.registerDate) : new Date();
                  const expiresAt = vehicle.expiresAt ? new Date(vehicle.expiresAt) : new Date();
                  const isExpired = expiresAt < new Date();
                  
                  return (
                  <tr key={vehicle._id} className="border-t">
                    <td className="px-3 py-3 font-semibold text-foreground">
                      {vehicle.name || "-"}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/vehicles/${vehicle._id}`}
                        className="text-blue-600 dark:text-blue-400 underline decoration-2 underline-offset-2 font-medium hover:text-blue-800 dark:hover:text-blue-300 active:text-blue-700 transition-colors cursor-pointer"
                        style={{ textDecorationColor: 'rgb(37, 99, 235)', textDecorationThickness: '2px' }}
                      >
                        {vehicle.vehicleNumber || "-"}
                      </Link>
                    </td>
                    <td className={`px-3 py-3 ${isExpired ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                      {registerDate.toLocaleDateString()}
                    </td>
                    <td className={`px-3 py-3 ${isExpired ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                      {expiresAt.toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {isExpired ? (
                        <div className="flex items-center gap-2 text-red-500">
                          <span>{dict.dashboard.expired}</span>
                          <RenewVehicleButton 
                            vehicleId={vehicle._id}
                            totalAmount={vehicle.price || 0}
                            paidAmount={vehicle.paidAmount ?? 0}
                          />
                        </div>
                      ) : (
                        <span className="text-emerald-600">{dict.dashboard.active}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PaymentStatusCell
                          totalAmount={vehicle.price || 0}
                          paidAmount={vehicle.paidAmount ?? 0}
                          paid={vehicle.paid ?? false}
                        />
                        <VehiclePaymentButton
                          vehicleId={vehicle._id}
                          totalAmount={vehicle.price || 0}
                          paidAmount={vehicle.paidAmount ?? 0}
                        />
                        <Link
                          href={`/vehicles/${vehicle._id}`}
                          className="md:hidden text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">
                      {vehicle.planType || "-"}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">
                      AED&nbsp;
                      {(vehicle.price || 0).toFixed(2)}
                    </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <Link
                            href={`/vehicles/${vehicle._id}`}
                            className="text-xs font-medium text-primary underline underline-offset-2"
                          >
                            {dict.dashboard.details}
                          </Link>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}

        {vehicles.length > 0 && (
          <div className="mt-6 rounded-xl border bg-background p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/dashboard"
              searchParams={{
                ...(monthParam ? { month: monthParam } : {}),
                ...(searchParam ? { search: searchParam } : {}),
                ...(filterParam ? { filter: filterParam } : {}),
                ...(language === "ps" ? { lang: "ps" } : {}),
              }}
              showing={dict.dashboard.pagination.showing(
                (currentPage - 1) * pageSize + 1,
                Math.min(currentPage * pageSize, totalVehicles),
                totalVehicles,
              )}
              previousLabel={dict.dashboard.pagination.previous}
              nextLabel={dict.dashboard.pagination.next}
            />
          </div>
        )}
      </main>
    </div>
  );
}

