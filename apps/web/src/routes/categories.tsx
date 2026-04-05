import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import { type Doc } from "@mpf/backend/convex/_generated/dataModel";
import { useEffect, useState } from "react";
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

import { TooltipProvider } from "#/components/ui/tooltip";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "#/components/ui/sidebar";
import { Button } from "#/components/ui/button";
import { AppSidebar } from "#/components/dashboard/app-sidebar";
import { DashboardSkeleton } from "#/components/skeleton/dashboard-skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Badge } from "#/components/ui/badge";
import {
  getCategoryIcon,
  AVAILABLE_ICONS,
  CATEGORY_COLORS,
  CATEGORY_ICON_MAP,
} from "#/lib/category-icons";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
});

/* -------------------------------------------------------------------------- */
/*  Dark mode toggle (shared pattern)                                         */
/* -------------------------------------------------------------------------- */

function useDarkMode() {
  const toggle = () => {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return { isDark, toggle };
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function CategoriesPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { data: profile, isLoading: profileLoading } = useQuery({
    ...convexQuery(api.userProfiles.getProfile, {}),
    enabled: isAuthenticated,
  });

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (isAuthenticated && !profileLoading && !profile?.onboardingCompleted) {
      router.navigate({ to: "/onboarding" });
    }
  }, [isAuthenticated, profileLoading, profile, router]);

  if (isLoading || profileLoading || !isAuthenticated || !profile?.onboardingCompleted) {
    return <DashboardSkeleton />;
  }

  async function handleSignOut() {
    await signOut();
    router.navigate({ to: "/" });
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          onSignOut={() => void handleSignOut()}
          onToggleDark={toggleDark}
          isDark={isDark}
          userName={profile?.name ?? undefined}
        />
        <SidebarInset>
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
            <SidebarTrigger />
            <h1 className="font-heading text-base font-semibold text-foreground">
              Categories
            </h1>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="mx-auto max-w-[800px] px-4 py-6 lg:px-8">
              <CategoriesContent />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Categories content                                                        */
/* -------------------------------------------------------------------------- */

function CategoriesContent() {
  const [showArchived, setShowArchived] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState<Doc<"categories"> | null>(null);

  // Subcategory dialog state
  const [addSubcategoryFor, setAddSubcategoryFor] = useState<Doc<"categories"> | null>(null);

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
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const expenseCategories = (categories ?? [])
    .filter((c) => c.type === "expense")
    .sort((a, b) => a.sortOrder - b.sortOrder);

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

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Categories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your transactions with custom categories and subcategories.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
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
        onAddSubcategory={setAddSubcategoryFor}
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
          onAddSubcategory={setAddSubcategoryFor}
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
        open={addSubcategoryFor !== null}
        onOpenChange={(open) => {
          if (!open) setAddSubcategoryFor(null);
        }}
        parentCategory={addSubcategoryFor}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Category Group                                                            */
/* -------------------------------------------------------------------------- */

function CategoryGroup({
  title,
  type,
  categories,
  subcategoriesByParent,
  onCreateCategory,
  onEditCategory,
  onAddSubcategory,
}: {
  title: string;
  type: "income" | "expense";
  categories: Doc<"categories">[];
  subcategoriesByParent: Map<string, Doc<"subcategories">[]>;
  onCreateCategory: () => void;
  onEditCategory: (category: Doc<"categories">) => void;
  onAddSubcategory: (category: Doc<"categories">) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
          <Badge
            variant="secondary"
            className="ml-2 text-[10px] font-normal"
          >
            {categories.length}
          </Badge>
        </h3>
        <Button variant="ghost" size="sm" onClick={onCreateCategory} className="gap-1.5">
          <Plus className="size-3.5" />
          Add {type === "income" ? "income" : "expense"} category
        </Button>
      </div>

      <div className="space-y-1">
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

/* -------------------------------------------------------------------------- */
/*  Category Row                                                              */
/* -------------------------------------------------------------------------- */

function CategoryRow({
  category,
  subcategories,
  onEdit,
  onAddSubcategory,
}: {
  category: Doc<"categories">;
  subcategories: Doc<"subcategories">[];
  onEdit: () => void;
  onAddSubcategory: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getCategoryIcon(category.icon);

  const { mutate: archiveCategory } = useMutation({
    mutationFn: useConvexMutation(api.categories.archiveCategory),
  });
  const { mutate: restoreCategory } = useMutation({
    mutationFn: useConvexMutation(api.categories.restoreCategory),
  });
  const { mutate: deleteCategory } = useMutation({
    mutationFn: useConvexMutation(api.categories.deleteCategory),
  });

  const sortedSubs = [...subcategories].sort((a, b) => a.sortOrder - b.sortOrder);
  const hasSubcategories = sortedSubs.length > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card transition-colors",
        category.archived && "opacity-60",
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex size-5 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        {/* Icon */}
        <div
          className="flex size-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: category.color + "20" }}
        >
          <Icon className="size-4" style={{ color: category.color }} />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground">
            {category.name}
          </span>
          {category.archived && (
            <Badge variant="secondary" className="ml-2 text-[10px]">
              Archived
            </Badge>
          )}
          {hasSubcategories && (
            <span className="ml-2 text-xs text-muted-foreground">
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
          <DropdownMenuContent align="end">
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
              onClick={() => {
                if (confirm("Delete this category and all its subcategories? This cannot be undone.")) {
                  deleteCategory({ id: category._id });
                }
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Subcategories (expanded) */}
      {expanded && (
        <div className="border-t border-border/40 px-4 pb-3 pt-2">
          {sortedSubs.length === 0 ? (
            <p className="py-2 pl-8 text-xs text-muted-foreground">
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
            <div className="space-y-0.5">
              {sortedSubs.map((sub) => (
                <SubcategoryRow key={sub._id} subcategory={sub} parentColor={category.color} />
              ))}
            </div>
          )}
          <button
            type="button"
            className="mt-2 flex items-center gap-1.5 pl-8 text-xs font-medium text-primary hover:underline underline-offset-4"
            onClick={onAddSubcategory}
          >
            <Plus className="size-3" />
            Add subcategory
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Subcategory Row                                                           */
/* -------------------------------------------------------------------------- */

function SubcategoryRow({
  subcategory,
  parentColor,
}: {
  subcategory: Doc<"subcategories">;
  parentColor: string;
}) {
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
        "flex items-center gap-3 rounded-md px-3 py-2 pl-8 hover:bg-muted/50",
        subcategory.archived && "opacity-60",
      )}
    >
      {/* Small dot with parent color */}
      <div
        className="size-2 rounded-full"
        style={{ backgroundColor: parentColor }}
      />
      <span className="flex-1 text-sm text-foreground">
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
            onClick={() => {
              if (confirm("Delete this subcategory? This cannot be undone.")) {
                deleteSub({ id: subcategory._id });
              }
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Category Form Dialog (Create / Edit)                                      */
/* -------------------------------------------------------------------------- */

function CategoryFormDialog({
  open,
  onOpenChange,
  type,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  category: Doc<"categories"> | null;
}) {
  const isEdit = category !== null;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("wallet");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);

  // Sync form state when dialog opens with a category to edit
  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
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

/* -------------------------------------------------------------------------- */
/*  Subcategory Form Dialog                                                   */
/* -------------------------------------------------------------------------- */

function SubcategoryFormDialog({
  open,
  onOpenChange,
  parentCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentCategory: Doc<"categories"> | null;
}) {
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

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                  */
/* -------------------------------------------------------------------------- */

function CategoriesListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-lg bg-muted/50"
        />
      ))}
    </div>
  );
}
