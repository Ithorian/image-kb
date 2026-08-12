import { notFound } from "next/navigation";
import { MapPin, Layers, Tag } from "lucide-react";
import { getListingBySlug, getAllListings } from "@/lib/listings";
import { Badge } from "@/components/ui/badge";
import { EmbeddedGallery } from "@/components/EmbeddedGallery";
import { ListingsChrome } from "@/components/ListingsChrome";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllListings().map((l) => ({ slug: l.slug }));
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ListingsChrome crumbs={[listing.title]} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl space-y-8">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {listing.title}
          </h1>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {listing.category && (
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {listing.category}
              </span>
            )}
            {listing.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {listing.location}
              </span>
            )}
            {listing.type && (
              <Badge variant="outline" className="text-[10px] h-5">
                <Tag className="h-3 w-3 mr-1" />
                {listing.type}
              </Badge>
            )}
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Gallery
          </h2>
          <EmbeddedGallery
            itemId={listing.itemId}
            itemName={listing.itemName || listing.title}
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Listing notes
          </h2>
          <article className="prose dark:prose-invert prose-sm max-w-none rounded-lg border bg-card text-card-foreground p-5 whitespace-pre-wrap">
            {listing.body}
          </article>
        </section>
      </main>
    </div>
  );
}