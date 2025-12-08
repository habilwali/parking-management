"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string>;
  showing: string;
  previousLabel: string;
  nextLabel: string;
};

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
  showing,
  previousLabel,
  nextLabel,
}: PaginationProps) {
  const router = useRouter();
  
  const buildUrl = (page: number) => {
    const params = new URLSearchParams({
      ...searchParams,
      page: page.toString(),
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    // Preserve scroll position
    const scrollY = window.scrollY;
    
    const newUrl = buildUrl(page);
    
    // Use window.history to update URL without scrolling
    window.history.pushState({}, "", newUrl);
    router.refresh();
    
    // Restore scroll position after a brief delay
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;
  const showNavigation = totalPages > 1;

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      // Show first 5 pages
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      // Show last 5 pages
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground">{showing}</p>
      {showNavigation && (
        <div className="flex items-center gap-2">
          {prevPage ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handlePageChange(prevPage)}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{previousLabel}</span>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{previousLabel}</span>
            </Button>
          )}

          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum) => (
              <Button
                key={pageNum}
                size="sm"
                variant={currentPage === pageNum ? "default" : "outline"}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            ))}
          </div>

          {nextPage ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handlePageChange(nextPage)}
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">{nextLabel}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <span className="hidden sm:inline">{nextLabel}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

