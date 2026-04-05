import { Wallet, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { getCategoryIcon } from "#/lib/category-icons";

interface DefaultCategory {
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
}

export function CategoriesStep({
  defaultCategories,
  selectedCategories,
  onSelectedChange,
  onFinish,
  onBack,
  isSubmitting,
}: {
  defaultCategories: DefaultCategory[];
  selectedCategories: string[];
  onSelectedChange: (names: string[]) => void;
  onFinish: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const incomeCategories = defaultCategories.filter((c) => c.type === "income");
  const expenseCategories = defaultCategories.filter(
    (c) => c.type === "expense",
  );

  function toggleCategory(name: string) {
    if (selectedCategories.includes(name)) {
      onSelectedChange(selectedCategories.filter((n) => n !== name));
    } else {
      onSelectedChange([...selectedCategories, name]);
    }
  }

  function selectAll() {
    onSelectedChange(defaultCategories.map((c) => c.name));
  }

  function deselectAll() {
    onSelectedChange([]);
  }

  const allSelected = selectedCategories.length === defaultCategories.length;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex justify-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-wise-bright-green/15 text-wise-forest-green dark:text-wise-bright-green">
            <Wallet className="size-7" />
          </div>
        </div>
        <h1 className="text-center font-heading text-2xl font-semibold text-foreground">
          Choose your categories
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          We'll start you with these defaults. You can customize later.
        </p>
      </div>

      {/* Select all / deselect all */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={allSelected ? deselectAll : selectAll}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline dark:text-primary"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* Income */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Income
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {incomeCategories.map((c) => (
            <CategoryCheckbox
              key={c.name}
              name={c.name}
              icon={c.icon}
              color={c.color}
              checked={selectedCategories.includes(c.name)}
              onToggle={() => toggleCategory(c.name)}
            />
          ))}
        </div>
      </div>

      {/* Expense */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Expenses
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {expenseCategories.map((c) => (
            <CategoryCheckbox
              key={c.name}
              name={c.name}
              icon={c.icon}
              color={c.color}
              checked={selectedCategories.includes(c.name)}
              onToggle={() => toggleCategory(c.name)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          variant="accent"
          className="flex-1"
          onClick={onFinish}
          disabled={isSubmitting || selectedCategories.length === 0}
        >
          {isSubmitting ? "Setting up..." : "Get started"}
          {!isSubmitting && <ArrowRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Category checkbox                                                         */
/* -------------------------------------------------------------------------- */

function CategoryCheckbox({
  name,
  icon,
  color,
  checked,
  onToggle,
}: {
  name: string;
  icon: string;
  color: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const Icon = getCategoryIcon(icon);

  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary/30 has-[[data-state=checked]]:bg-primary/5">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <div
        className="flex size-6 items-center justify-center rounded-md"
        style={{ backgroundColor: color + "20" }}
      >
        <Icon className="size-3.5" style={{ color }} />
      </div>
      <span className="text-sm font-medium text-foreground">{name}</span>
    </label>
  );
}
