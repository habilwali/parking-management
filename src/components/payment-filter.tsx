"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PaymentFilterProps = {
  currentFilter?: "paid" | "unpaid";
  baseUrl: string;
};

export function PaymentFilter({ currentFilter, baseUrl }: PaymentFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getUrlWithSearch = (filter?: string) => {
    const params = new URLSearchParams();
    if (filter && filter !== "all") {
      params.set("filter", filter);
    }
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    const queryString = params.toString();
    return `${baseUrl}${queryString ? `?${queryString}` : ""}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    router.push(getUrlWithSearch(value));
  };

  return (
    <div className="flex items-center gap-2">
      <select
        id="payment-filter"
        value={currentFilter || "all"}
        onChange={handleChange}
        className="h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="all">All Records</option>
        <option value="paid">Paid Only</option>
        <option value="unpaid">Unpaid Only</option>
      </select>
      {currentFilter && (
        <Button
          type="button"
          asChild
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
        >
          <Link href={getUrlWithSearch()}>Clear</Link>
        </Button>
      )}
    </div>
  );
}

