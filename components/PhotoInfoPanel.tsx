"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  FileImage,
  Maximize2,
  HardDrive,
  Calendar,
  Tag,
  MapPin,
  Layers,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import type { KnowledgeImage } from "@/types";

interface PhotoInfoPanelProps {
  image: KnowledgeImage;
  listing?: {
    itemName?: string;
    category?: string;
    location?: string;
    itemType?: string;
  };
  photoCount?: number;
  variant?: "auto" | "side" | "band";
  className?: string;
  defaultOpen?: boolean;
}

/**
 * Photo + limited listing metadata.
 * Never overlays the annotation canvas drawable surface.
 * `band` sits between the image stage and the film strip.
 */
export function PhotoInfoPanel({
  image,
  listing,
  photoCount,
  variant = "band",
  className,
  defaultOpen = true,
}: PhotoInfoPanelProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  const itemName = listing?.itemName || image.itemName;
  const category = listing?.category || image.category;
  const location = listing?.location || image.location;
  const itemType = listing?.itemType || image.itemType;

  return (
    <div
      className={cn(
        "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        variant === "side" &&
          "border border-border rounded-lg shadow-lg bg-background/95",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-xs font-medium truncate">
            {image.role || image.recommendedName || "Photo details"}
          </span>
          {photoCount != null && photoCount > 1 && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {photoCount} photos
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {(itemName || category || location || itemType) && (
            <div className="rounded-md border bg-muted/30 p-2.5 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Listing
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {itemName && (
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Home className="h-3 w-3 text-muted-foreground" />
                    {itemName}
                  </span>
                )}
                {category && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    {category}
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {location}
                  </span>
                )}
                {itemType && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    {itemType}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              This photo
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 min-w-0">
                <FileImage className="h-3 w-3 shrink-0" />
                <span className="truncate font-mono text-[11px]">
                  {image.recommendedName || image.originalName}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Maximize2 className="h-3 w-3 shrink-0" />
                <span>
                  {image.width} × {image.height}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="h-3 w-3 shrink-0" />
                <span>{formatBytes(image.size)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{formatDate(image.createdAt)}</span>
              </div>
            </div>

            {image.role && (
              <p className="text-xs">
                <span className="text-muted-foreground">Role: </span>
                {image.role}
              </p>
            )}

            {image.tags && image.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                <Tag className="h-3 w-3 text-muted-foreground mt-0.5" />
                {image.tags.slice(0, 8).map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] h-5">
                    {t}
                  </Badge>
                ))}
                {image.tags.length > 8 && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    +{image.tags.length - 8}
                  </Badge>
                )}
              </div>
            )}

            {image.annotations?.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {image.annotations.length} annotation
                {image.annotations.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}