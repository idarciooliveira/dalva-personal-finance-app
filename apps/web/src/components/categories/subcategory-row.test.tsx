import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SubcategoryRow } from "./subcategory-row";

vi.mock("@convex-dev/react-query", () => ({
  useConvexMutation: vi.fn((mutation: unknown) => mutation),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

vi.mock("@mpf/backend/convex/_generated/api", () => ({
  api: {
    categories: {
      archiveSubcategory: "archiveSubcategoryMutation",
      restoreSubcategory: "restoreSubcategoryMutation",
      deleteSubcategory: "deleteSubcategoryMutation",
    },
  },
}));

const subcategory = {
  _id: "sub_1",
  _creationTime: 0,
  userId: "user_1",
  categoryId: "cat_1",
  name: "Groceries",
  archived: false,
  sortOrder: 0,
};

describe("SubcategoryRow", () => {
  it("opens the edit action from the dropdown", async () => {
    const onEdit = vi.fn();

    render(
      <SubcategoryRow
        subcategory={subcategory as never}
        parentColor="#F97316"
        onEdit={onEdit}
      />,
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Open Groceries actions" }),
    );
    fireEvent.click(await screen.findByText("Edit"));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
