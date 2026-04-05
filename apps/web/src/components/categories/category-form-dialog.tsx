import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCategoryIcon,
  AVAILABLE_ICONS,
  CATEGORY_COLORS,
  CATEGORY_ICON_MAP,
} from "@/lib/category-icons";
import { cn } from "@/lib/utils";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  category: Doc<"categories"> | null;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  type,
  category,
}: CategoryFormDialogProps) {
  const isEdit = category !== null;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("wallet");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);

  // Sync form state when dialog opens with a category to edit
  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon ?? "circle");
      setColor(category.color ?? CATEGORY_COLORS[0]);
    } else {
      setName("");
      setIcon(type === "income" ? "banknote" : "wallet");
      setColor(CATEGORY_COLORS[0]);
    }
  }, [category, type, open]);

  const { mutateAsync: createCategory, isPending: isCreating } = useMutation({
    mutationFn: useConvexMutation(api.categories.createCategory),
  });
  const { mutateAsync: updateCategory, isPending: isUpdating } = useMutation({
    mutationFn: useConvexMutation(api.categories.updateCategory),
  });

  const isPending = isCreating || isUpdating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEdit && category) {
      await updateCategory({ id: category._id, name: name.trim(), icon, color });
    } else {
      await createCategory({ name: name.trim(), type, icon, color });
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit category" : `New ${type} category`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "income" ? "e.g. Dividends" : "e.g. Groceries"}
              autoFocus
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform hover:scale-110",
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto rounded-lg border border-border p-2">
              {AVAILABLE_ICONS.map((iconName) => {
                const IconComp = CATEGORY_ICON_MAP[iconName];
                if (!IconComp) return null;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg transition-colors",
                      icon === iconName
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    )}
                    title={iconName}
                  >
                    <IconComp className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: color + "20" }}
            >
              {(() => {
                const PreviewIcon = getCategoryIcon(icon);
                return <PreviewIcon className="size-4" style={{ color }} />;
              })()}
            </div>
            <span className="text-sm font-medium">
              {name || "Category name"}
            </span>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={isPending || !name.trim()}
            >
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Create category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
