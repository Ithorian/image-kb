"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label?: string;
  /** Marks a user-created entry, which can be removed from the list. */
  custom?: boolean;
}

export interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  /**
   * Called when the user submits a value that is not in the list. Return the
   * canonical stored value (which may differ after normalization), or `null`
   * to reject it.
   */
  onCreate?: (rawValue: string) => string | null;
  onRemove?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

type Row =
  | { kind: "option"; option: ComboboxOption }
  | { kind: "create"; value: string };

export function Combobox({
  value,
  onValueChange,
  options,
  onCreate,
  onRemove,
  placeholder = "Select…",
  searchPlaceholder = "Search or type to add…",
  emptyText = "No matches yet.",
  disabled,
  id,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rowRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const rows = React.useMemo<Row[]>(() => {
    const needle = query.trim().toLowerCase();
    const matches = options.filter(
      (option) =>
        !needle || (option.label ?? option.value).toLowerCase().includes(needle)
    );

    const result: Row[] = matches.map((option) => ({ kind: "option", option }));

    const isExact = options.some(
      (option) => option.value.toLowerCase() === needle
    );
    if (onCreate && needle && !isExact) {
      result.push({ kind: "create", value: query.trim() });
    }

    return result;
  }, [options, query, onCreate]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  React.useEffect(() => {
    if (!open) return;
    rowRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, rows.length]);

  const commitRow = (row: Row | undefined) => {
    if (!row) return;

    if (row.kind === "create") {
      const created = onCreate?.(row.value);
      if (!created) return;
      onValueChange(created);
    } else {
      onValueChange(row.option.value === value ? "" : row.option.value);
    }

    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (rows.length === 0) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((prev) => (prev + delta + rows.length) % rows.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commitRow(rows[activeIndex]);
    }
  };

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {value ? selectedOption?.label ?? value : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[14rem] p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="custom-scrollbar max-h-60 overflow-y-auto p-1">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            rows.map((row, index) => {
              const isActive = index === activeIndex;

              if (row.kind === "create") {
                return (
                  <div
                    key="__create__"
                    ref={(node) => {
                      rowRefs.current[index] = node;
                    }}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commitRow(row)}
                    className={cn(
                      "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary",
                      isActive && "bg-accent"
                    )}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      Add &ldquo;{row.value}&rdquo;
                    </span>
                  </div>
                );
              }

              const { option } = row;
              const isSelected = option.value === value;

              return (
                <div
                  key={option.value}
                  ref={(node) => {
                    rowRefs.current[index] = node;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commitRow(row)}
                  className={cn(
                    "group flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label ?? option.value}</span>

                  {option.custom && onRemove && (
                    <button
                      type="button"
                      aria-label={`Remove ${option.value}`}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove(option.value);
                      }}
                      className="ml-auto rounded-sm p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus:opacity-100 focus:outline-none group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {onCreate && (
          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            Type a new name and press{" "}
            <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd>{" "}
            to add it permanently.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
