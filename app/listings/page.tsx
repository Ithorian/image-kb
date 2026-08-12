import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { getAllListings } from "@/lib/listings";
import { Badge } from "@/components/ui/badge";
import { ListingsChrome } from "@/components/ListingsChrome";

export default function ListingsIndexPage() {
  const listings = getAllListings();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ListingsChrome />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Listings</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          MD listings composed with ImageKB galleries. Expand opens the full
          annotated viewer.
        </p>

        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No listings yet. Add markdown under{" "}
            <code className="text-xs">content/listings/</code>.
          </p>
        ) : (
          <ul className="space-y-2">
            {listings.map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/listings/${l.slug}`}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card text-card-foreground p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[l.category, l.location, l.type]
                        .filter(Boolean)
                        .join(" · ") || l.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {l.itemId ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Gallery linked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        No itemId
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}