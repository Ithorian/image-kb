"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Upload, Download, Trash2, BookImage, Plus } from "lucide-react";
import { KnowledgeImage } from "@/types";
import {
  getAllImages,
  saveImage,
  deleteImage,
  getAllTags,
  exportKB,
  importKB,
  clearAllImages,
} from "@/lib/storage";
import { ImageGallery } from "@/components/ImageGallery";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageDetail } from "@/components/ImageDetail";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { fileToDataUrl, loadImageDimensions } from "@/lib/utils";
import { recommendFilename } from "@/lib/filename-recommender";

export default function HomePage() {
  const [images, setImages] = useState<KnowledgeImage[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<KnowledgeImage | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const detailAddRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [imgs, tags] = await Promise.all([getAllImages(), getAllTags()]);
      setImages(imgs);
      setAllTags(tags);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Knowledge Base");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpload = async (newImages: KnowledgeImage[]) => {
    try {
      for (const img of newImages) {
        await saveImage(img);
      }
      toast.success(
        `Added ${newImages.length} image${newImages.length > 1 ? "s" : ""} to KB`
      );
      setUploadOpen(false);
      await refresh();
    } catch {
      toast.error("Failed to save images");
    }
  };

  const handleUpdate = async (image: KnowledgeImage) => {
    await saveImage(image);
    setImages((prev) => prev.map((i) => (i.id === image.id ? image : i)));
    const tags = await getAllTags();
    setAllTags(tags);
    if (selected?.id === image.id) {
      setSelected(image);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteImage(id);
    setImages((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) {
      setSelected(null);
      setDetailOpen(false);
    }
    toast.success("Image deleted");
    const tags = await getAllTags();
    setAllTags(tags);
  };

  const handleView = (image: KnowledgeImage) => {
    setSelected(image);
    setDetailOpen(true);
  };

  const handleExport = async () => {
    try {
      const json = await exportKB();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-kb-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Knowledge Base exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const count = await importKB(text);
        await refresh();
        toast.success(`Imported ${count} image${count !== 1 ? "s" : ""}`);
      } catch {
        toast.error("Invalid or corrupt KB export file");
      }
    };
    input.click();
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "This will permanently delete ALL images from your Knowledge Base. Are you sure?"
      )
    )
      return;
    await clearAllImages();
    setImages([]);
    setAllTags([]);
    setSelected(null);
    setDetailOpen(false);
    toast.success("Knowledge Base cleared");
  };

  /** Add photos to the currently selected item (from detail view). */
  const handleDetailAddFiles = async (files: FileList | null) => {
    if (!files?.length || !selected) return;
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (fileArray.length === 0) {
      toast.error("Please select image files only");
      return;
    }

    try {
      const now = new Date().toISOString();
      const groupId = selected.itemId || uuidv4();
      const related = images.filter(
        (i) => i.itemId && i.itemId === selected.itemId
      );
      const maxOrder = related.reduce(
        (m, img) => Math.max(m, img.sortOrder ?? 0),
        -1
      );

      if (!selected.itemId) {
        const promoted = {
          ...selected,
          itemId: groupId,
          itemName: selected.itemName || selected.recommendedName,
          isCover: true,
          sortOrder: 0,
          updatedAt: now,
        };
        await saveImage(promoted);
        setSelected(promoted);
      }

      const newImages: KnowledgeImage[] = [];
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const dataUrl = await fileToDataUrl(file);
        const { width, height } = await loadImageDimensions(dataUrl);
        const tags = [...(selected.tags || [])];
        newImages.push({
          id: uuidv4(),
          originalName: file.name,
          recommendedName: recommendFilename({
            originalName: file.name,
            tags,
            width,
            height,
            mimeType: file.type,
            itemName: selected.itemName,
            category: selected.category,
            location: selected.location,
            itemType: selected.itemType,
          }),
          dataUrl,
          mimeType: file.type,
          size: file.size,
          width,
          height,
          tags,
          annotations: [],
          createdAt: now,
          updatedAt: now,
          itemId: groupId,
          itemName: selected.itemName || selected.recommendedName,
          role: undefined,
          isCover: false,
          sortOrder: maxOrder + 1 + i,
          category: selected.category,
          location: selected.location,
          itemType: selected.itemType,
        });
      }

      for (const img of newImages) {
        await saveImage(img);
      }
      await refresh();
      toast.success(
        newImages.length === 1
          ? "Photo added to this item"
          : `${newImages.length} photos added to this item`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to add photos");
    }
  };

  const handleRequestAddPhoto = () => {
    toast.message("Opening file picker…");
    detailAddRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BookImage className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-none">ImageKB</h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Knowledge Base
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="gap-1.5" asChild>
              <Link href="/listings">Listings</Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setUploadOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={images.length === 0}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleImport}
              className="gap-1.5"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            {images.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-32 text-muted-foreground">
            Loading Knowledge Base…
          </div>
        ) : (
          <ImageGallery
            images={images}
            onView={handleView}
            onDelete={handleDelete}
            onUploadClick={() => setUploadOpen(true)}
          />
        )}
      </main>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload images to Knowledge Base
            </DialogTitle>
            <DialogDescription>
              Drag & drop or select images. Fill classification fields, then add
              more photos. Close only with the X when done or after saving.
            </DialogDescription>
          </DialogHeader>
          <ImageUploader allTags={allTags} onUpload={handleUpload} />
        </DialogContent>
      </Dialog>

      <ImageDetail
        image={selected}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRequestAddPhoto={handleRequestAddPhoto}
        allTags={allTags}
        allImages={images}
      />

      {/* File input OUTSIDE dialogs — avoids Radix blocking the picker */}
      <input
        id="image-kb-detail-add-photo"
        ref={detailAddRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          handleDetailAddFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}