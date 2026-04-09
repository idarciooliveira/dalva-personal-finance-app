import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { useState } from "react";
import { Archive } from "lucide-react";

import { CategoryGroup } from "@/components/categories/category-group";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { SubcategoryFormDialog } from "@/components/categories/subcategory-form-dialog";
import { CategoriesListSkeleton } from "@/components/categories/categories-list-skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
});

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function CategoriesPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-200 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        <CategoriesContent />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Categories content                                                        */
/* -------------------------------------------------------------------------- */

function CategoriesContent() {
  const [showArchived, setShowArchived] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState<Doc<"categories"> | null>(
    null,
  );
  const [addSubcategoryFor, setAddSubcategoryFor] =
    useState<Doc<"categories"> | null>(null);
  const [editSubcategory, setEditSubcategory] =
    useState<Doc<"subcategories"> | null>(null);

  const { data: categories, isLoading } = useQuery(
    convexQuery(api.categories.listCategories, {
      includeArchived: showArchived,
    }),
  );

  const { data: allSubcategories } = useQuery(
    convexQuery(api.categories.listAllSubcategories, {
      includeArchived: showArchived,
    }),
  );

  if (isLoading) {
    return <CategoriesListSkeleton />;
  }

  const incomeCategories = (categories ?? [])
    .filter((c) => c.type === "income")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const expenseCategories = (categories ?? [])
    .filter((c) => c.type === "expense")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const subcategoriesByParent = new Map<string, Doc<"subcategories">[]>();
  for (const sub of allSubcategories ?? []) {
    const existing = subcategoriesByParent.get(sub.categoryId) ?? [];
    existing.push(sub);
    subcategoriesByParent.set(sub.categoryId, existing);
  }

  function handleCreateCategory(type: "income" | "expense") {
    setCreateType(type);
    setCreateDialogOpen(true);
  }

  function handleAddSubcategory(category: Doc<"categories">) {
    setEditSubcategory(null);
    setAddSubcategoryFor(category);
  }

  function handleEditSubcategory(subcategory: Doc<"subcategories">) {
    setAddSubcategoryFor(null);
    setEditSubcategory(subcategory);
  }

  const activeSubcategoryParent =
    addSubcategoryFor ??
    (editSubcategory
      ? (categories ?? []).find((category) => category._id === editSubcategory.categoryId) ??
        null
      : null);

  return (
    <>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
            Categories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your transactions with custom categories and subcategories.
          </p>
        </div>
        <Button
          variant={showArchived ? "secondary" : "outline"}
          size="default"
          onClick={() => setShowArchived(!showArchived)}
          className="relative w-full sm:w-auto"
        >
          <Archive className="mr-1.5 size-4" />
          Archived
          {showArchived && (
            <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
              1
            </span>
          )}
        </Button>
      </div>

      {/* Expense Categories */}
      <CategoryGroup
        title="Expenses"
        type="expense"
        categories={expenseCategories}
        subcategoriesByParent={subcategoriesByParent}
        onCreateCategory={() => handleCreateCategory("expense")}
        onEditCategory={setEditCategory}
        onAddSubcategory={handleAddSubcategory}
        onEditSubcategory={handleEditSubcategory}
      />

      {/* Income Categories */}
      <div className="mt-6 sm:mt-8">
        <CategoryGroup
          title="Income"
          type="income"
          categories={incomeCategories}
          subcategoriesByParent={subcategoriesByParent}
          onCreateCategory={() => handleCreateCategory("income")}
          onEditCategory={setEditCategory}
          onAddSubcategory={handleAddSubcategory}
          onEditSubcategory={handleEditSubcategory}
        />
      </div>

      {/* Create Category Dialog */}
      <CategoryFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        type={createType}
        category={null}
      />

      {/* Edit Category Dialog */}
      <CategoryFormDialog
        open={editCategory !== null}
        onOpenChange={(open) => {
          if (!open) setEditCategory(null);
        }}
        type={editCategory?.type ?? "expense"}
        category={editCategory}
      />

      {/* Add Subcategory Dialog */}
      <SubcategoryFormDialog
        open={addSubcategoryFor !== null || editSubcategory !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddSubcategoryFor(null);
            setEditSubcategory(null);
          }
        }}
        parentCategory={activeSubcategoryParent}
        subcategory={editSubcategory}
      />
    </>
  );
}
