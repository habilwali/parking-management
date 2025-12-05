"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

type VehicleSearchProps = {
  baseUrl: string;
};

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function VehicleSearch({ baseUrl }: VehicleSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(searchValue, 500); // 500ms debounce

  // Update URL when debounced search value changes
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    const trimmedDebounced = debouncedSearch.trim();
    
    // Only update if the search value actually changed
    if (currentSearch === trimmedDebounced) {
      return;
    }
    
    const params = new URLSearchParams();
    
    if (trimmedDebounced) {
      params.set("search", trimmedDebounced);
    }
    
    // Preserve filter if exists
    const filter = searchParams.get("filter");
    if (filter) {
      params.set("filter", filter);
    }
    
    // Reset to page 1 when searching
    if (trimmedDebounced) {
      params.set("page", "1");
    } else {
      const page = searchParams.get("page");
      if (page) {
        params.set("page", page);
      }
    }
    
    const queryString = params.toString();
    router.push(`${baseUrl}${queryString ? `?${queryString}` : ""}`);
  }, [debouncedSearch, baseUrl, router, searchParams]);

  // Sync with URL params when they change externally (e.g., from browser back button)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    // Only update if URL search differs from current value and debounced value
    // This prevents loops
    if (urlSearch !== searchValue && urlSearch !== debouncedSearch.trim()) {
      setSearchValue(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleClear = () => {
    setSearchValue("");
    const params = new URLSearchParams();
    // Preserve filter if exists
    const filter = searchParams.get("filter");
    if (filter) {
      params.set("filter", filter);
    }
    
    const queryString = params.toString();
    router.push(`${baseUrl}${queryString ? `?${queryString}` : ""}`);
  };

  const handleRefresh = () => {
    setSearchValue("");
    router.push(baseUrl);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // The debounced effect will handle the search
    // This just prevents form submission from reloading the page
  };

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            name="search"
            placeholder="Search by vehicle number..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-8 w-[200px] pl-8 pr-8 text-xs"
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>
      <Button
        type="button"
        onClick={handleRefresh}
        size="sm"
        variant="outline"
        className="h-8 px-2 text-xs"
        title="Refresh and clear all filters"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

