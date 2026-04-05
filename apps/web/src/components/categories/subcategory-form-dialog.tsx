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

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const { mutateAsync: createSubcategory, isPending } = useMutation({
    mutationFn: useConvexMutation(api.categories.createSubcategory),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !parentCategory) return;

    await createSubcategory({
      categoryId: parentCategory._id,
      name: name.trim(),
    });

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Add subcategory
            {parentCategory && (
              <span className="ml-1 font-normal text-muted-foreground">
                under {parentCategory.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subcategory-name">Name</Label>
            <Input
              id="subcategory-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
              autoFocus
            />
          </div>
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
              {isPending ? "Adding..." : "Add subcategory"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
