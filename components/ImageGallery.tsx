"use client";

import { useMemo, useState } from "react";
import { Search, Upload, ImageIcon, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageCard } from "@/components/ImageCard";
import {
  filterAndSortImages,
  getUniqueTags,
  getCoverImages,
  getRelatedImages,
} from "@/lib/filter";
import type { KnowledgeImage, SortOption } from "@/types";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: KnowledgeImage[];
  onView: (image: KnowledgeImage) => void;
  onDelete: (id: string) => void;
  onUploadClick: () => void;
  className?: string;
}

export function ImageGallery({
  images,
  onView,
  onDelete,
  onUploadClick,
  className,
}: ImageGalleryProps) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("newest");

  const allTags = useMemo(() => getUniqueTags(images), [images]);

  const filtered = useMemo(() => {
    const covers = getCoverImages(images);
    return filterAndSortImages(covers, {
      search,
      selectedTags,
      sort,
    });
  }, [images, search, selectedTags, sort]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedTags([]);
    setSort("newest");
  };

  const hasFilters = search || selectedTags.length > 0 || sort !== "newest";

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex flex-col gap-3 p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search names, tags, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onUploadClick} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={active ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors text-xs",
                    active && "hover:bg-primary/90"
                  )}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              );
            })}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {filtered.length} of {images.length} image{images.length !== 1 ? "s" : ""}
          {selectedTags.length > 0 &&
            ` · filtered by ${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4">
            <div className="rounded-full bg-muted p-6">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Your Knowledge Base is empty</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Upload images, add tags, and annotate them to build your personal image library.
              </p>
            </div>
            <Button onClick={onUploadClick} size="lg" className="gap-2 mt-2">
              <Upload className="h-4 w-4" />
              Upload your first images
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-3">
            <p className="text-muted-foreground">No images match your filters.</p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((img) => {
              const related = img.itemId
                ? getRelatedImages(images, img.itemId)
                : [img];
              return (
                <ImageCard
                  key={img.id}
                  image={img}
                  relatedCount={related.length}
                  onView={onView}
                  onDelete={onDelete}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}