"use client";

import * as React from "react";
import { toast } from "sonner";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  addCategoryValue,
  isCustomValue,
  removeCategoryValue,
  type CategoryLevel,
  type CustomCategories,
} from "@/lib/categories";

interface CategoryComboboxProps {
  level: CategoryLevel;
  /** Bucket the created value belongs to, e.g. `Home` or `Home/Kitchen`. */
  parentKey?: string;
  values: string[];
  custom: CustomCategories;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * A dropdown backed by the shared category vocabulary. Anything the user types
 * can be added to the list and is remembered for future selections.
 */
export function CategoryCombobox({
  level,
  parentKey = "",
  values,
  custom,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  disabled,
  id,
}: CategoryComboboxProps) {
  const options = React.useMemo<ComboboxOption[]>(
    () =>
      values.map((entry) => ({
        value: entry,
        custom: isCustomValue(custom, level, parentKey, entry),
      })),
    [values, custom, level, parentKey]
  );

  const handleCreate = (raw: string) => {
    const created = addCategoryValue(level, parentKey, raw);
    if (!created) {
      toast.error("That name can't be used in a filename");
      return null;
    }
    toast.success(`Added “${created}” to the list`);
    return created;
  };

  const handleRemove = (entry: string) => {
    removeCategoryValue(level, parentKey, entry);
    if (entry === value) onValueChange("");
    toast.success(`Removed “${entry}”`);
  };

  return (
    <Combobox
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      onCreate={handleCreate}
      onRemove={handleRemove}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      disabled={disabled}
      emptyText="Nothing here yet — type a name to add one."
    />
  );
}
