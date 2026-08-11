"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Trash2,
  Save,
  FileImage,
  Calendar,
  HardDrive,
  Maximize2,
  Plus,
  Star,
} from "lucide-react";
import { TagInput } from "@/components/TagInput";
import { ExtensibleSelect } from "@/components/ExtensibleSelect";
import { AnnotationCanvas } from "@/components/AnnotationCanvas";
import { formatBytes, formatDate, downloadDataUrl, cn } from "@/lib/utils";
import { exportAnnotatedImage } from "@/lib/annotation-utils";
import { recommendFilename } from "@/lib/filename-recommender";
import { getRelatedImages } from "@/lib/filter";
import type { KnowledgeImage, Annotation } from "@/types";
import { toast } from "sonner";

interface ImageDetailProps {
  image: KnowledgeImage | null;
  allImages: KnowledgeImage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (image: KnowledgeImage) => void;
  onDelete: (id: string) => void;
  onRequestAddPhoto?: () => void;
  allTags: string[];
}

export function ImageDetail({
  image,
  allImages,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onRequestAddPhoto,
  allTags,
}: ImageDetailProps) {
  const [local, setLocal] = useState<KnowledgeImage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (image) {
      setLocal({ ...image });
    } else {
      setLocal(null);
    }
  }, [image]);

  const related = useMemo(() => {
    if (!local?.itemId) return local ? [local] : [];
    return getRelatedImages(allImages, local.itemId);
  }, [allImages, local]);

  if (!local) return null;

  const handleSelectRelated = (img: KnowledgeImage) => {
    setLocal({ ...img });
  };

  const handleAnnotationsChange = (annotations: Annotation[]) => {
    setLocal((prev) =>
      prev
        ? {
            ...prev,
            annotations,
            updatedAt: new Date().toISOString(),
          }
        : null
    );
  };

  const handleTagsChange = (tags: string[]) => {
    setLocal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tags,
        recommendedName: recommendFilename({
          originalName: prev.originalName,
          tags,
          width: prev.width,
          height: prev.height,
          mimeType: prev.mimeType,
          itemName: prev.itemName,
          category: prev.category,
          location: prev.location,
          itemType: prev.itemType,
          role: prev.role,
        }),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleNameChange = (name: string) => {
    setLocal((prev) =>
      prev
        ? { ...prev, recommendedName: name, updatedAt: new Date().toISOString() }
        : null
    );
  };

  const handleRoleChange = (role: string) => {
    setLocal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        role,
        recommendedName: recommendFilename({
          originalName: prev.originalName,
          tags: prev.tags,
          width: prev.width,
          height: prev.height,
          mimeType: prev.mimeType,
          itemName: prev.itemName,
          category: prev.category,
          location: prev.location,
          itemType: prev.itemType,
          role,
        }),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleItemNameChange = (itemName: string) => {
    setLocal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        itemName,
        recommendedName: recommendFilename({
          originalName: prev.originalName,
          tags: prev.tags,
          width: prev.width,
          height: prev.height,
          mimeType: prev.mimeType,
          itemName,
          category: prev.category,
          location: prev.location,
          itemType: prev.itemType,
          role: prev.role,
        }),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleFieldChange = (
    field: "category" | "location" | "itemType" | "notes",
    value: string
  ) => {
    setLocal((prev) => {
      if (!prev) return null;
      const next = {
        ...prev,
        [field]: value,
        updatedAt: new Date().toISOString(),
      };
      if (field !== "notes") {
        next.recommendedName = recommendFilename({
          originalName: prev.originalName,
          tags: prev.tags,
          width: prev.width,
          height: prev.height,
          mimeType: prev.mimeType,
          itemName: prev.itemName,
          category: field === "category" ? value : prev.category,
          location: field === "location" ? value : prev.location,
          itemType: field === "itemType" ? value : prev.itemType,
          role: prev.role,
        });
      }
      return next;
    });
  };

  const handleNotesChange = (notes: string) => {
    handleFieldChange("notes", notes);
  };

  const handleSave = async () => {
    if (!local) return;
    setSaving(true);
    try {
      onUpdate(local);
      toast.success("Image updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!local) return;
    if (confirm("Delete this image from the Knowledge Base?")) {
      onDelete(local.id);
      onOpenChange(false);
      toast.success("Image deleted");
    }
  };

  const handleDownloadOriginal = () => {
    downloadDataUrl(local.dataUrl, local.recommendedName || local.originalName);
  };

  const handleDownloadAnnotated = async () => {
    try {
      toast.loading("Exporting annotated image...");
      const dataUrl = await exportAnnotatedImage(
        local.dataUrl,
        local.annotations,
        local.width,
        local.height,
        local.mimeType
      );
      const name = local.recommendedName.replace(/(\.\w+)$/, "-annotated$1");
      downloadDataUrl(dataUrl, name);
      toast.dismiss();
      toast.success("Annotated image downloaded");
    } catch {
      toast.dismiss();
      toast.error("Failed to export annotated image");
    }
  };

  const handleSetCover = () => {
    if (!local) return;
    for (const img of related) {
      if (img.id === local.id) {
        const updated = {
          ...local,
          isCover: true,
          updatedAt: new Date().toISOString(),
        };
        onUpdate(updated);
        setLocal(updated);
      } else if (img.isCover) {
        onUpdate({
          ...img,
          isCover: false,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    toast.success("Cover image updated");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate pr-8">
                {local.itemName || local.recommendedName}
              </DialogTitle>
              <DialogDescription className="truncate">
                {local.role
                  ? `${local.role} · ${local.originalName}`
                  : local.originalName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Main visual area */}
          <div className="flex-1 min-h-[300px] lg:min-h-0 bg-muted/30 relative flex flex-col">
            <div className="flex-1 relative min-h-0 overflow-hidden">
              <AnnotationCanvas
                className="h-full"
                image={local}
                annotations={local.annotations}
                onAnnotationsChange={handleAnnotationsChange}
                isEditable={true}
              />
            </div>

            {/* Related images + Add photo — z-10 so canvas can't cover clicks */}
            <div className="relative z-10 shrink-0 border-t bg-background/95 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {related.length} photo{related.length !== 1 ? "s" : ""} in this
                  item
                </p>
                <label
                  htmlFor="image-kb-detail-add-photo"
                  className="inline-flex items-center justify-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(
                      "image-kb-detail-add-photo"
                    ) as HTMLInputElement | null;
                    if (!el) {
                      toast.error("File input not found in page");
                      return;
                    }
                    toast.message("Opening file picker…");
                    el.click();
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add photo
                </label>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {related.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleSelectRelated(img)}
                    className={cn(
                      "relative shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 transition-all",
                      img.id === local.id
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
            </div>
          </div>

          {/* Sidebar — Item name, Category, Location, Type, etc. */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l flex flex-col bg-background shrink-0">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                {local.itemId && (
                  <div className="space-y-2">
                    <Label htmlFor="itemName">Item name</Label>
                    <Input
                      id="itemName"
                      value={local.itemName || ""}
                      onChange={(e) => handleItemNameChange(e.target.value)}
                      placeholder="e.g. Kitchen Dishwasher"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <ExtensibleSelect
                    kind="category"
                    label="Category"
                    value={local.category || ""}
                    onChange={(v) => handleFieldChange("category", v)}
                    placeholder="Home, Tool, Vehicle…"
                  />
                  <ExtensibleSelect
                    kind="location"
                    label="Location / Room"
                    value={local.location || ""}
                    onChange={(v) => handleFieldChange("location", v)}
                    placeholder="Kitchen, Garage…"
                  />
                  <ExtensibleSelect
                    kind="itemType"
                    label="Type"
                    value={local.itemType || ""}
                    onChange={(v) => handleFieldChange("itemType", v)}
                    placeholder="Appliance, HVAC…"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Photo Description</Label>
                  <Input
                    id="role"
                    value={local.role || ""}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    placeholder="e.g. Front View, Side View, Manufacturer Placard"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filename">Recommended filename</Label>
                  <Input
                    id="filename"
                    value={local.recommendedName}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Auto-updates when category / location / type / role change
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagInput
                    tags={local.tags || []}
                    onChange={handleTagsChange}
                    allTags={allTags}
                    placeholder="Add tags..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={local.notes || ""}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Optional notes about this image..."
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Metadata</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>
                        {local.width} × {local.height}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5" />
                      <span>{formatBytes(local.size)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileImage className="h-3.5 w-3.5" />
                      <span className="truncate">{local.mimeType}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(local.createdAt)}</span>
                    </div>
                  </div>
                  {local.annotations.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {local.annotations.length} annotation
                      {local.annotations.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {local.isCover && (
                    <Badge variant="outline" className="text-xs">
                      Cover image
                    </Badge>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="p-4 border-t space-y-2 shrink-0">
              <Button
                className="w-full gap-2"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save changes"}
              </Button>

              {!local.isCover && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={handleSetCover}
                >
                  <Star className="h-3.5 w-3.5" />
                  Set as cover image
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDownloadOriginal}
                >
                  <Download className="h-3.5 w-3.5" />
                  Original
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDownloadAnnotated}
                  disabled={local.annotations.length === 0}
                >
                  <Download className="h-3.5 w-3.5" />
                  Annotated
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-1.5"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete from KB
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}