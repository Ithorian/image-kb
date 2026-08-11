"use client";

import * as React from "react";
import {
  Upload,
  X,
  FileImage,
  Check,
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/TagInput";
import { ExtensibleSelect } from "@/components/ExtensibleSelect";
import { recommendFilename } from "@/lib/filename-recommender";
import { fileToDataUrl, loadImageDimensions, formatBytes, cn } from "@/lib/utils";
import type { KnowledgeImage } from "@/types";

interface PendingFile {
  id: string;
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  recommendedName: string;
  tags: string[];
  role: string;
  status: "pending" | "ready" | "error";
  error?: string;
  sortOrder: number;
}

interface ImageUploaderProps {
  onUpload: (images: KnowledgeImage[]) => Promise<void> | void;
  allTags?: string[];
  className?: string;
}

export function ImageUploader({ onUpload, allTags = [], className }: ImageUploaderProps) {
  const [pending, setPending] = React.useState<PendingFile[]>([]);
  const [itemName, setItemName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [itemType, setItemType] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [itemId] = React.useState(() => uuidv4());
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const addAnotherInputRef = React.useRef<HTMLInputElement>(null);

  const selected =
    pending.find((p) => p.id === selectedId) || pending[pending.length - 1] || null;

  const processFiles = async (files: FileList | File[], prefillFrom?: PendingFile) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      toast.error("Please select image files only");
      return;
    }

    const newPending: PendingFile[] = [];
    const baseOrder = pending.length;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const dataUrl = await fileToDataUrl(file);
        const { width, height } = await loadImageDimensions(dataUrl);
        const tags = prefillFrom ? [...prefillFrom.tags] : [];
        const recommendedName = recommendFilename({
          originalName: file.name,
          tags,
          width,
          height,
          mimeType: file.type,
          itemName: itemName.trim() || undefined,
          category: category.trim() || undefined,
          location: location.trim() || undefined,
          itemType: itemType.trim() || undefined,
        });

        newPending.push({
          id: uuidv4(),
          file,
          dataUrl,
          width,
          height,
          recommendedName,
          tags,
          role: "",
          status: "ready",
          sortOrder: baseOrder + i,
        });
      } catch (err) {
        console.error(err);
        newPending.push({
          id: uuidv4(),
          file,
          dataUrl: "",
          width: 0,
          height: 0,
          recommendedName: file.name,
          tags: prefillFrom ? [...prefillFrom.tags] : [],
          role: "",
          status: "error",
          error: "Failed to read image",
          sortOrder: baseOrder + i,
        });
      }
    }

    setPending((prev) => {
      const next = [...prev, ...newPending];
      if (!selectedId && next.length > 0) {
        setSelectedId(next[next.length - 1].id);
      }
      return next;
    });

    if (newPending.length > 0) {
      setSelectedId(newPending[0].id);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const buildFilename = (p: PendingFile, overrides?: Partial<PendingFile>) => {
    const tags = overrides?.tags ?? p.tags;
    const role = overrides?.role ?? p.role;
    return recommendFilename({
      originalName: p.file.name,
      tags,
      width: p.width,
      height: p.height,
      mimeType: p.file.type,
      itemName: itemName.trim() || undefined,
      category: category.trim() || undefined,
      location: location.trim() || undefined,
      itemType: itemType.trim() || undefined,
      role: role || undefined,
    });
  };

  const updatePending = (id: string, updates: Partial<PendingFile>) => {
    setPending((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...updates };
        if (updates.tags !== undefined || updates.role !== undefined) {
          next.recommendedName = buildFilename(p, updates);
        }
        return next;
      })
    );
  };

  const refreshAllFilenames = React.useCallback(() => {
    setPending((prev) =>
      prev.map((p) => ({
        ...p,
        recommendedName: recommendFilename({
          originalName: p.file.name,
          tags: p.tags,
          width: p.width,
          height: p.height,
          mimeType: p.file.type,
          itemName: itemName.trim() || undefined,
          category: category.trim() || undefined,
          location: location.trim() || undefined,
          itemType: itemType.trim() || undefined,
          role: p.role || undefined,
        }),
      }))
    );
  }, [itemName, category, location, itemType]);

  React.useEffect(() => {
    if (pending.length > 0) {
      refreshAllFilenames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemName, category, location, itemType]);

  const removePending = (id: string) => {
    setPending((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (selectedId === id) {
        setSelectedId(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next.map((p, i) => ({ ...p, sortOrder: i }));
    });
  };

  const movePending = (id: string, direction: "left" | "right") => {
    setPending((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const target = direction === "left" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((p, i) => ({ ...p, sortOrder: i }));
    });
  };

  const handleCommit = async () => {
    const ready = pending.filter((p) => p.status === "ready");
    if (ready.length === 0) return;

    setIsUploading(true);
    try {
      const now = new Date().toISOString();
      const classTags = [category, location, itemType, itemName]
        .map((s) => s.trim())
        .filter(Boolean);

      const images: KnowledgeImage[] = ready.map((p, index) => {
        const mergedTags = Array.from(
          new Set([...p.tags, ...classTags].map((t) => t.trim()).filter(Boolean))
        );
        return {
          id: uuidv4(),
          originalName: p.file.name,
          recommendedName: p.recommendedName,
          dataUrl: p.dataUrl,
          mimeType: p.file.type,
          size: p.file.size,
          width: p.width,
          height: p.height,
          tags: mergedTags,
          annotations: [],
          notes: undefined,
          createdAt: now,
          updatedAt: now,
          itemId,
          itemName: itemName.trim() || undefined,
          role: p.role || undefined,
          isCover: index === 0,
          sortOrder: p.sortOrder,
          category: category.trim() || undefined,
          location: location.trim() || undefined,
          itemType: itemType.trim() || undefined,
        };
      });

      await onUpload(images);
      toast.success(
        ready.length === 1
          ? "Image added to Knowledge Base"
          : `${ready.length} images added as one item`
      );
      setPending([]);
      setItemName("");
      setCategory("");
      setLocation("");
      setItemType("");
      setSelectedId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save images");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="item-name">Item name (optional)</Label>
          <Input
            id="item-name"
            placeholder="e.g. Kitchen Dishwasher, DeWalt Drill, Honda Civic…"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            disabled={isUploading}
          />
          <p className="text-xs text-muted-foreground">
            All photos below will be grouped under this item.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ExtensibleSelect
            kind="category"
            label="Category"
            value={category}
            onChange={setCategory}
            placeholder="Home, Tool, Vehicle…"
            disabled={isUploading}
          />
          <ExtensibleSelect
            kind="location"
            label="Location / Room"
            value={location}
            onChange={setLocation}
            placeholder="Kitchen, Garage…"
            disabled={isUploading}
          />
          <ExtensibleSelect
            kind="itemType"
            label="Type"
            value={itemType}
            onChange={setItemType}
            placeholder="Appliance, HVAC…"
            disabled={isUploading}
          />
        </div>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Photos in this item ({pending.length})</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => addAnotherInputRef.current?.click()}
              disabled={isUploading}
            >
              <Plus className="h-4 w-4" />
              Add another photo
            </Button>
          </div>
          <div className="grid gap-3 pb-2 grid-cols-[repeat(auto-fill,minmax(6.5rem,7rem))]">
            {pending.map((p, idx) => (
              <div
                key={p.id}
                className={cn(
                  "relative w-full rounded-lg border-2 overflow-hidden cursor-pointer transition-all",
                  selectedId === p.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="aspect-square bg-muted">
                  {p.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.dataUrl}
                      alt={p.role || p.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileImage className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-1.5 text-[10px] truncate text-center bg-background">
                  {p.role || `Photo ${idx + 1}`}
                </div>
                {idx === 0 && (
                  <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0">
                    Cover
                  </Badge>
                )}
                <button
                  type="button"
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-90 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePending(p.id);
                  }}
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div className="rounded-full bg-muted p-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              Drag & drop images here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Start with the main photo, then add more views / labels
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={addAnotherInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            const source = selected || pending[pending.length - 1];
            processFiles(e.target.files, source);
          }
          e.target.value = "";
        }}
      />

      {selected && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-4">
              <div className="w-32 shrink-0 aspect-square rounded-lg overflow-hidden bg-muted border">
                {selected.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.dataUrl}
                    alt={selected.file.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileImage className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Original</Label>
                  <p className="text-xs truncate font-mono">{selected.file.name}</p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="role">Photo Description</Label>
                  <Input
                    id="role"
                    placeholder="e.g. Front View, Side View, Manufacturer Placard, Label…"
                    value={selected.role}
                    onChange={(e) =>
                      updatePending(selected.id, { role: e.target.value })
                    }
                    disabled={isUploading}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rec-name">Recommended filename</Label>
                  <Input
                    id="rec-name"
                    value={selected.recommendedName}
                    onChange={(e) =>
                      updatePending(selected.id, {
                        recommendedName: e.target.value,
                      })
                    }
                    className="font-mono text-xs"
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Tags (shared for all photos in this upload)</Label>
              <TagInput
                tags={tags}
                onChange={(next) => {
                  setTags(next);
                  setPending((prev) =>
                    prev.map((p) => ({
                      ...p,
                      tags: next,
                      recommendedName: recommendFilename({
                        originalName: p.file.name,
                        tags: next,
                        width: p.width,
                        height: p.height,
                        mimeType: p.file.type,
                        itemName: itemName.trim() || undefined,
                        category: category.trim() || undefined,
                        location: location.trim() || undefined,
                        itemType: itemType.trim() || undefined,
                        role: p.role || undefined,
                      }),
                    }))
                  );
                }}
                allTags={allTags}
                disabled={isUploading}
                placeholder="Add tags…"
              />
              <p className="text-xs text-muted-foreground">
                Tags stick across every photo in this batch.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {selected.width}×{selected.height}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {formatBytes(selected.file.size)}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {selected.file.type.split("/")[1]?.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => movePending(selected.id, "left")}
                disabled={
                  isUploading ||
                  pending.findIndex((p) => p.id === selected.id) === 0
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Move left
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => movePending(selected.id, "right")}
                disabled={
                  isUploading ||
                  pending.findIndex((p) => p.id === selected.id) ===
                    pending.length - 1
                }
              >
                Move right
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">
                Position{" "}
                {pending.findIndex((p) => p.id === selected.id) + 1} of{" "}
                {pending.length}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setPending([]);
              setItemName("");
              setCategory("");
              setLocation("");
              setItemType("");
              setTags([]);
              setSelectedId(null);
            }}
            disabled={isUploading}
          >
            Clear all
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => addAnotherInputRef.current?.click()}
              disabled={isUploading}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add another photo
            </Button>
            <Button
              onClick={handleCommit}
              disabled={
                isUploading || pending.every((p) => p.status !== "ready")
              }
              className="gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Add{" "}
                  {pending.filter((p) => p.status === "ready").length} to
                  Knowledge Base
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}