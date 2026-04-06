import { Plus } from "lucide-react";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryRow } from "./category-row";

interface CategoryGroupProps {
  title: string;
  type: "income" | "expense";
  categories: Doc<"categories">[];
  subcategoriesByParent: Map<string, Doc<"subcategories">[]>;
  onCreateCategory: () => void;
  onEditCategory: (category: Doc<"categories">) => void;
  onAddSubcategory: (category: Doc<"categories">) => void;
}

export function CategoryGroup({
  title,
  type,
  categories,
  subcategoriesByParent,
  onCreateCategory,
  onEditCategory,
  onAddSubcategory,
}: CategoryGroupProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
          <Badge
            variant="secondary"
            className="ml-2 text-[10px] font-normal"
          >
            {categories.length}
          </Badge>
        </h3>
        <Button
          variant="accent"
          size="default"
          onClick={onCreateCategory}
          className="shrink-0"
        >
          <Plus className="mr-1.5 size-4" />
          Add {type === "income" ? "income" : "expense"} category
        </Button>
      </div>

      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No {type} categories yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateCategory}
              className="mt-3 gap-1.5"
            >
              <Plus className="size-3.5" />
              Create one
            </Button>
          </div>
        ) : (
          categories.map((category) => (
            <CategoryRow
              key={category._id}
              category={category}
              subcategories={subcategoriesByParent.get(category._id) ?? []}
              onEdit={() => onEditCategory(category)}
              onAddSubcategory={() => onAddSubcategory(category)}
            />
          ))
        )}
      </div>
    </div>
  );
}
