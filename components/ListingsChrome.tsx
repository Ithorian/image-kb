"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ListingsChromeProps {
  crumbs?: string[];
}

export function ListingsChrome({ crumbs = [] }: ListingsChromeProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <nav className="flex items-center gap-2 text-sm min-w-0">
          <Link href="/" className="text-muted-foreground hover:text-foreground shrink-0">
            ImageKB
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Link
            href="/listings"
            className={
              crumbs.length
                ? "text-muted-foreground hover:text-foreground shrink-0"
                : "font-medium text-foreground shrink-0"
            }
          >
            Listings
          </Link>
          {crumbs.map((c) => (
            <span key={c} className="contents">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium truncate text-foreground">{c}</span>
            </span>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}