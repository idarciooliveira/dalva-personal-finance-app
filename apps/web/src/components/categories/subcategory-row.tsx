import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { MoreVertical, Archive, ArchiveRestore, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { cn } from "@/lib/utils";

interface SubcategoryRowProps {
  subcategory: Doc<"subcategories">;
  parentColor: string;
}

export function SubcategoryRow({ subcategory, parentColor }: SubcategoryRowProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { mutate: archiveSub } = useMutation({
    mutationFn: useConvexMutation(api.categories.archiveSubcategory),
  });
  const { mutate: restoreSub } = useMutation({
    mutationFn: useConvexMutation(api.categories.restoreSubcategory),
  });
  const { mutate: deleteSub } = useMutation({
    mutationFn: useConvexMutation(api.categories.deleteSubcategory),
  });

  return (
    <div
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 pl-10 hover:bg-muted/50",
        subcategory.archived && "opacity-60",
      )}
    >
      {/* Small dot with parent color */}
      <div
        className="size-2 rounded-full"
        style={{ backgroundColor: parentColor }}
      />
      <span className="flex-1 text-sm font-medium text-foreground">
        {subcategory.name}
      </span>
      {subcategory.archived && (
        <Badge variant="secondary" className="text-[10px]">
          Archived
        </Badge>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" className="text-muted-foreground">
            <MoreVertical className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {subcategory.archived ? (
            <DropdownMenuItem onClick={() => restoreSub({ id: subcategory._id })}>
              <ArchiveRestore className="mr-2 size-4" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => archiveSub({ id: subcategory._id })}>
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
        title="Delete subcategory"
        description="Delete this subcategory? This cannot be undone."
        onConfirm={() => deleteSub({ id: subcategory._id })}
      />
    </div>
  );
}
