"use client";

import { Eye, Trash2, Pencil, Images } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatBytes, formatDate, cn } from "@/lib/utils";
import type { KnowledgeImage } from "@/types";

interface ImageCardProps {
  image: KnowledgeImage;
  relatedCount?: number;
  onView: (image: KnowledgeImage) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function ImageCard({
  image,
  relatedCount = 1,
  onView,
  onDelete,
  className,
}: ImageCardProps) {
  const visibleTags = image.tags.slice(0, 3);
  const extraTags = image.tags.length - 3;
  const title = image.itemName || image.recommendedName;
  const subtitle = image.role
    ? image.role
    : image.itemName
    ? image.recommendedName
    : image.originalName;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:shadow-md hover:border-primary/30 cursor-pointer",
        className
      )}
      onClick={() => onView(image)}
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={image.dataUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(image);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View & Annotate</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className="h-9 w-9"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(image.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>

        {relatedCount > 1 && (
          <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0 text-[10px] gap-1">
            <Images className="h-3 w-3" />
            {relatedCount}
          </Badge>
        )}

        {image.annotations.length > 0 && (
          <Badge className="absolute top-2 left-2 bg-black/70 text-white border-0 text-[10px]">
            <Pencil className="h-3 w-3 mr-1" />
            {image.annotations.length}
          </Badge>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        <div>
          <p className="text-sm font-medium truncate" title={title}>
            {title}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {subtitle}
          </p>
        </div>

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {extraTags > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{extraTags}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span>
            {image.width}×{image.height}
          </span>
          <span>{formatBytes(image.size)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {formatDate(image.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}