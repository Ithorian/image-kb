"use client";

import * as React from "react";
import { Check, Copy, Sparkles, Tags } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CategoryCombobox } from "@/components/filename-builder/CategoryCombobox";
import { itemKey } from "@/lib/categories";
import { useCategories } from "@/lib/use-categories";

export interface FilenameParts {
  topCategory: string;
  subCategory: string;
  item: string;
  view: string;
}

interface FilenameBuilderProps {
  parts: FilenameParts;
  onPartsChange: (parts: FilenameParts) => void;
  recommendedName: string;
}

export function FilenameBuilder({
  parts,
  onPartsChange,
  recommendedName,
}: FilenameBuilderProps) {
  const { tree, views, custom } = useCategories();
  const [copied, setCopied] = React.useState(false);

  const { topCategory, subCategory, item, view } = parts;

  const topOptions = React.useMemo(() => Object.keys(tree), [tree]);
  const subOptions = React.useMemo(
    () => (topCategory ? Object.keys(tree[topCategory] ?? {}) : []),
    [tree, topCategory]
  );
  const itemOptions = React.useMemo(
    () =>
      topCategory && subCategory ? tree[topCategory]?.[subCategory] ?? [] : [],
    [tree, topCategory, subCategory]
  );

  const activeParts = [topCategory, subCategory, item, view].filter(Boolean);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recommendedName);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Clipboard is not available in this browser");
    }
  };

  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tags className="h-4 w-4 text-muted-foreground" />
              Filename Builder
            </CardTitle>
            <CardDescription>
              Pick a path, or type a new name in any dropdown to add it for next
              time.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {activeParts.length}/4
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5 pt-0">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs">
              Category
            </Label>
            <CategoryCombobox
              id="category"
              level="top"
              values={topOptions}
              custom={custom}
              value={topCategory}
              onValueChange={(next) =>
                onPartsChange({
                  ...parts,
                  topCategory: next,
                  subCategory: "",
                  item: "",
                })
              }
              placeholder="Select category…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subcategory" className="text-xs">
              Sub-category
            </Label>
            <CategoryCombobox
              id="subcategory"
              level="sub"
              parentKey={topCategory}
              values={subOptions}
              custom={custom}
              value={subCategory}
              onValueChange={(next) =>
                onPartsChange({ ...parts, subCategory: next, item: "" })
              }
              placeholder={
                topCategory ? "Select sub-category…" : "Pick a category first"
              }
              disabled={!topCategory}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item" className="text-xs">
              Item
            </Label>
            <CategoryCombobox
              id="item"
              level="item"
              parentKey={
                topCategory && subCategory
                  ? itemKey(topCategory, subCategory)
                  : ""
              }
              values={itemOptions}
              custom={custom}
              value={item}
              onValueChange={(next) => onPartsChange({ ...parts, item: next })}
              placeholder={
                subCategory ? "Select or add item…" : "Pick a sub-category first"
              }
              disabled={!topCategory || !subCategory}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="view" className="text-xs">
              View / Detail{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <CategoryCombobox
              id="view"
              level="view"
              values={views}
              custom={custom}
              value={view}
              onValueChange={(next) => onPartsChange({ ...parts, view: next })}
              placeholder="Select or add a view…"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Recommended filename
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1 pl-3">
            <code className="flex-1 break-all font-mono text-sm">
              {recommendedName}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy filename"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
