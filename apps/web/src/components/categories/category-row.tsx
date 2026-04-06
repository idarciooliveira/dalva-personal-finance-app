import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import {
  Plus,
  MoreVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { SubcategoryRow } from "./subcategory-row";

interface CategoryRowProps {
  category: Doc<"categories">;
  subcategories: Doc<"subcategories">[];
  onEdit: () => void;
  onAddSubcategory: () => void;
}

export function CategoryRow({
  category,
  subcategories,
  onEdit,
  onAddSubcategory,
}: CategoryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const Icon = getCategoryIcon(category.icon ?? "circle");

  const { mutate: archiveCategory } = useMutation({
    mutationFn: useConvexMutation(api.categories.archiveCategory),
  });
  const { mutate: restoreCategory } = useMutation({
    mutationFn: useConvexMutation(api.categories.restoreCategory),
  });
  const { mutate: deleteCategory } = useMutation({
    mutationFn: useConvexMutation(api.categories.deleteCategory),
  });

  const sortedSubs = [...subcategories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const hasSubcategories = sortedSubs.length > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card transition-colors",
        category.archived && "opacity-60",
      )}
    >
      {/* Main row */}
      <div className="flex min-h-22 items-center gap-5 px-5 py-4">
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        {/* Icon */}
        <div
          className="flex size-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: (category.color ?? "#6B7280") + "20" }}
        >
          <Icon className="size-5" style={{ color: category.color ?? "#6B7280" }} />
        </div>

        {/* Name */}
        <div className="min-w-0 flex-1">
          <span className="text-base font-medium text-foreground">
            {category.name}
          </span>
          {category.archived && (
            <Badge variant="secondary" className="ml-2 text-[10px]">
              Archived
            </Badge>
          )}
          {hasSubcategories && (
            <span className="ml-2 text-sm text-muted-foreground">
              {sortedSubs.length} subcategor{sortedSubs.length === 1 ? "y" : "ies"}
            </span>
          )}
        </div>

        {/* Default badge */}
        {category.isDefault && (
          <Badge variant="outline" className="text-[10px] font-normal">
            Default
          </Badge>
        )}

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddSubcategory}>
              <Plus className="mr-2 size-4" />
              Add subcategory
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {category.archived ? (
              <DropdownMenuItem
                onClick={() => restoreCategory({ id: category._id })}
              >
                <ArchiveRestore className="mr-2 size-4" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => archiveCategory({ id: category._id })}
              >
                <Archive className="mr-2 size-4" />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete category"
          description="Delete this category and all its subcategories? This cannot be undone."
          onConfirm={() => deleteCategory({ id: category._id })}
        />
      </div>

      {/* Subcategories (expanded) */}
      {expanded && (
        <div className="border-t border-border/40 px-5 pb-4 pt-3">
          {sortedSubs.length === 0 ? (
            <p className="py-2 pl-10 text-sm text-muted-foreground">
              No subcategories.{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={onAddSubcategory}
              >
                Add one
              </button>
            </p>
          ) : (
            <div className="space-y-1">
              {sortedSubs.map((sub) => (
                <SubcategoryRow key={sub._id} subcategory={sub} parentColor={category.color ?? "#6B7280"} />
              ))}
            </div>
          )}
          <button
            type="button"
            className="mt-3 flex items-center gap-1.5 pl-10 text-sm font-medium text-primary hover:underline underline-offset-4"
            onClick={onAddSubcategory}
          >
            <Plus className="size-3.5" />
            Add subcategory
          </button>
        </div>
      )}
    </div>
  );
}
