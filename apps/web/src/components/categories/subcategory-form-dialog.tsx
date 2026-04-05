import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { FileText, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCategoryIcon } from "@/lib/category-icons";

interface SubcategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentCategory: Doc<"categories"> | null;
}

export function SubcategoryFormDialog({
  open,
  onOpenChange,
  parentCategory,
}: SubcategoryFormDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  const { mutateAsync: createSubcategory, isPending } = useMutation({
    mutationFn: useConvexMutation(api.categories.createSubcategory),
  });

  async function handleSubmit(andCreateNew = false) {
    setError("");

    if (!name.trim()) {
      setError("Subcategory name is required");
      return;
    }
    if (!parentCategory) return;

    await createSubcategory({
      categoryId: parentCategory._id,
      name: name.trim(),
    });

    if (andCreateNew) {
      setName("");
      setError("");
    } else {
      onOpenChange(false);
    }
  }

  const ParentIcon = parentCategory
    ? getCategoryIcon(parentCategory.icon ?? "wallet")
    : null;
  const parentColor = parentCategory?.color ?? "#6B7280";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold">
            Add subcategory
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pt-4 pb-0">
          {/* ── Parent category indicator (icon-led row) ── */}
          {parentCategory && (
            <div className="flex items-center gap-3 border-b border-border py-3">
              <FolderOpen className="size-5 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-2">
                {ParentIcon && (
                  <div
                    className="flex size-6 items-center justify-center rounded-md"
                    style={{ backgroundColor: parentColor + "20" }}
                  >
                    <ParentIcon
                      className="size-3.5"
                      style={{ color: parentColor }}
                    />
                  </div>
                )}
                <span className="text-sm font-medium">
                  {parentCategory.name}
                </span>
              </div>
            </div>
          )}

          {/* ── Name field (icon-led row with bottom border) ── */}
          <div className="flex items-center gap-3 border-b border-border py-3">
            <FileText className="size-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
              autoFocus
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Subcategory name"
            />
          </div>

          {/* ── Error ── */}
          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* ── Footer with actions ── */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 mt-2">
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={isPending || !name.trim()}
            onClick={() => void handleSubmit(true)}
          >
            {isPending ? "Adding..." : "Save & new"}
          </Button>
          <Button
            type="button"
            variant="accent"
            size="default"
            disabled={isPending || !name.trim()}
            onClick={() => void handleSubmit(false)}
          >
            {isPending ? "Adding..." : "Add subcategory"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
