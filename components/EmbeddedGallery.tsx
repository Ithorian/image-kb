"use client";

import { useEffect, useMemo, useState } from "react";
import { Maximize2, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllImages } from "@/lib/storage";
import { getRelatedImages } from "@/lib/filter";
import { cn } from "@/lib/utils";
import type { KnowledgeImage } from "@/types";
import { ImageDetail } from "@/components/ImageDetail";

interface EmbeddedGalleryProps {
  itemId?: string;
  itemName?: string;
  allTags?: string[];
  onUpdate?: (image: KnowledgeImage) => void;
  onDelete?: (id: string) => void;
}

export function EmbeddedGallery({
  itemId,
  itemName,
  allTags = [],
  onUpdate,
  onDelete,
}: EmbeddedGalleryProps) {
  const [images, setImages] = useState<KnowledgeImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KnowledgeImage | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const refresh = async () => {
    try {
      const all = await getAllImages();
      setImages(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const related = useMemo(() => {
    if (itemId) {
      const byId = getRelatedImages(images, itemId);
      if (byId.length) return byId;
    }
    if (itemName) {
      const name = itemName.trim().toLowerCase();
      return images
        .filter((i) => (i.itemName || "").trim().toLowerCase() === name)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return [];
  }, [images, itemId, itemName]);

  const cover = related.find((i) => i.isCover) || related[0] || null;

  const openExpand = (img?: KnowledgeImage) => {
    const target = img || cover;
    if (!target) return;
    setSelected(target);
    setDetailOpen(true);
  };

  const handleUpdate = async (image: KnowledgeImage) => {
    if (onUpdate) onUpdate(image);
    else {
      const { saveImage } = await import("@/lib/storage");
      await saveImage(image);
    }
    await refresh();
    setSelected(image);
  };

  const handleDelete = async (id: string) => {
    if (onDelete) onDelete(id);
    else {
      const { deleteImage } = await import("@/lib/storage");
      await deleteImage(id);
    }
    await refresh();
    setDetailOpen(false);
    setSelected(null);
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground">
        Loading gallery…
      </div>
    );
  }

  if (related.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 mb-1">
          <Images className="h-4 w-4" />
          <span className="font-medium text-foreground">No gallery linked</span>
        </div>
        <p>
          No images found for this listing
          {itemId ? " (itemId)" : itemName ? " (item name)" : ""}. Upload or
          attach photos in ImageKB, then refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Images className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium truncate">Gallery</span>
          <Badge variant="secondary" className="text-[10px]">
            {related.length} photo{related.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5 shrink-0"
          onClick={() => openExpand()}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Expand
        </Button>
      </div>

      <button
        type="button"
        onClick={() => openExpand(cover!)}
        className="relative w-full aspect-[16/10] max-h-64 rounded-lg overflow-hidden border bg-muted group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover!.dataUrl}
          alt={cover!.role || cover!.itemName || cover!.recommendedName}
          className="h-full w-full object-contain bg-black/40"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-xs font-medium text-white bg-black/60 px-2 py-1 rounded">
            Expand gallery
          </span>
        </div>
      </button>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {related.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => openExpand(img)}
            className={cn(
              "relative shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 transition-all",
              img.id === cover?.id
                ? "border-primary ring-2 ring-primary/30"
                : "border-transparent hover:border-muted-foreground/40"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.dataUrl}
              alt={img.role || img.recommendedName}
              className="w-full h-full object-cover"
            />
            {img.isCover && (
              <span className="absolute top-0.5 left-0.5 bg-amber-500 text-black text-[8px] font-medium px-1 rounded">
                Cover
              </span>
            )}
            {img.role && (
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center truncate px-0.5">
                {img.role}
              </span>
            )}
          </button>
        ))}
      </div>

      <ImageDetail
        image={selected}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        allTags={allTags}
        allImages={images}
      />
    </div>
  );
}