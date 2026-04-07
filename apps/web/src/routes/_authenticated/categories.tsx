import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { useState } from "react";

import { CategoryGroup } from "@/components/categories/category-group";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { SubcategoryFormDialog } from "@/components/categories/subcategory-form-dialog";
import { CategoriesListSkeleton } from "@/components/categories/categories-list-skeleton";

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
});

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function CategoriesPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-200 px-4 py-6 lg:px-8">
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
      <div className="mb-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Categories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your transactions with custom categories and subcategories.
          </p>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="size-4 rounded border-border accent-primary"
          />
          Show archived
        </label>
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
      <div className="mt-8">
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
