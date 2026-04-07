import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubcategoryFormDialog } from "./subcategory-form-dialog";

const createSubcategoryMock = vi.fn();
const updateSubcategoryMock = vi.fn();

vi.mock("@convex-dev/react-query", () => ({
  useConvexMutation: vi.fn((mutation: unknown) => mutation),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(({ mutationFn }: { mutationFn: unknown }) => {
    if (mutationFn === "createSubcategoryMutation") {
      return { mutateAsync: createSubcategoryMock, isPending: false };
    }

    if (mutationFn === "updateSubcategoryMutation") {
      return { mutateAsync: updateSubcategoryMock, isPending: false };
    }

    throw new Error("Unexpected mutation");
  }),
}));

vi.mock("@mpf/backend/convex/_generated/api", () => ({
  api: {
    categories: {
      createSubcategory: "createSubcategoryMutation",
      updateSubcategory: "updateSubcategoryMutation",
    },
  },
}));

const parentCategory = {
  _id: "cat_1",
  _creationTime: 0,
  userId: "user_1",
  name: "Food",
  type: "expense",
  icon: "utensils",
  color: "#F97316",
  archived: false,
  isDefault: false,
  sortOrder: 0,
};

const subcategory = {
  _id: "sub_1",
  _creationTime: 0,
  userId: "user_1",
  categoryId: "cat_1",
  name: "Groceries",
  archived: false,
  sortOrder: 0,
};

describe("SubcategoryFormDialog", () => {
  beforeEach(() => {
    createSubcategoryMock.mockReset();
    updateSubcategoryMock.mockReset();
    createSubcategoryMock.mockResolvedValue(undefined);
    updateSubcategoryMock.mockResolvedValue(undefined);
  });

  it("creates a subcategory in create mode", async () => {
    const onOpenChange = vi.fn();

    render(
      <SubcategoryFormDialog
        open
        onOpenChange={onOpenChange}
        parentCategory={parentCategory as never}
      />,
    );

    expect(screen.getByRole("heading", { name: "Add subcategory" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Subcategory name"), {
      target: { value: "  Dining Out  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add subcategory" }));

    await waitFor(() => {
      expect(createSubcategoryMock).toHaveBeenCalledWith({
        categoryId: "cat_1",
        name: "Dining Out",
      });
    });
    expect(updateSubcategoryMock).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("prefills and updates a subcategory name in edit mode", async () => {
    const onOpenChange = vi.fn();

    render(
      <SubcategoryFormDialog
        open
        onOpenChange={onOpenChange}
        parentCategory={parentCategory as never}
        subcategory={subcategory as never}
      />,
    );

    expect(screen.getByRole("heading", { name: "Edit subcategory" })).toBeTruthy();
    expect(screen.getByDisplayValue("Groceries")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save & new" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Subcategory name"), {
      target: { value: "  Weekly groceries  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateSubcategoryMock).toHaveBeenCalledWith({
        id: "sub_1",
        name: "Weekly groceries",
      });
    });
    expect(createSubcategoryMock).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps create actions disabled for blank names", () => {
    render(
      <SubcategoryFormDialog
        open
        onOpenChange={vi.fn()}
        parentCategory={parentCategory as never}
      />,
    );

    fireEvent.change(screen.getByLabelText("Subcategory name"), {
      target: { value: "   " },
    });

    expect(
      screen.getByRole("button", { name: "Add subcategory" }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", { name: "Save & new" }),
    ).toHaveProperty("disabled", true);
    expect(createSubcategoryMock).not.toHaveBeenCalled();
    expect(updateSubcategoryMock).not.toHaveBeenCalled();
  });
});
