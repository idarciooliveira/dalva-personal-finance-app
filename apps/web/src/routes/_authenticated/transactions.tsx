import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc, Id } from "@mpf/backend/convex/_generated/dataModel";
import { useState } from "react";
import { Plus, ArrowLeftRight } from "lucide-react";

import { TransactionRow } from "@/components/transactions/transaction-row";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import {
  TransferFormDialog,
  type TransferData,
} from "@/components/transactions/transfer-form-dialog";
import {
  TransactionFilterButton,
  TransactionFiltersSheet,
  defaultFilters,
  type TransactionFilters,
} from "@/components/transactions/transaction-filters";
import { TransactionsListSkeleton } from "@/components/transactions/transactions-list-skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function TransactionsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-200 px-4 py-6 lg:px-8">
        <TransactionsContent />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Transactions content                                                      */
/* -------------------------------------------------------------------------- */

function TransactionsContent() {
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTransaction, setEditTransaction] =
    useState<Doc<"transactions"> | null>(null);

  // Transfer edit state
  const [editTransferId, setEditTransferId] =
    useState<Id<"transactions"> | null>(null);

  // Fetch transfer data when editing a transfer
  const { data: transferData } = useQuery(
    convexQuery(
      api.transfers.getTransfer,
      editTransferId ? { id: editTransferId } : "skip",
    ),
  );

  // Build query args from filters
  const queryArgs: Record<string, unknown> = {};
  if (filters.dateFrom) queryArgs.dateFrom = filters.dateFrom;
  if (filters.dateTo) queryArgs.dateTo = filters.dateTo;
  if (filters.accountId)
    queryArgs.accountId = filters.accountId as Id<"accounts">;
  if (filters.categoryId)
    queryArgs.categoryId = filters.categoryId as Id<"categories">;
  if (filters.type) queryArgs.type = filters.type;

  const { data, isLoading } = useQuery(
    convexQuery(api.transactions.listTransactions, queryArgs),
  );

  const transactions = data?.page ?? [];

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Transactions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Record and manage your income and expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TransactionFilterButton
            filters={filters}
            onClick={() => setFiltersOpen(true)}
          />
          <Button variant="accent" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            Add transaction
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <TransactionsListSkeleton />
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <ArrowLeftRight className="mb-3 size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            No transactions yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your first transaction to start tracking your finances.
          </p>
          <Button
            variant="accent"
            size="sm"
            className="mt-4"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-1.5 size-4" />
            Add transaction
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <TransactionRow
              key={tx._id}
              transaction={tx}
              onEdit={() => {
                if (tx.type === "transfer") {
                  setEditTransferId(tx._id);
                } else {
                  setEditTransaction(tx);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Filters Sheet */}
      <TransactionFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
      />

      {/* Create Dialog */}
      <TransactionFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        transaction={null}
      />

      {/* Edit Dialog (non-transfer) */}
      <TransactionFormDialog
        open={editTransaction !== null}
        onOpenChange={(open) => {
          if (!open) setEditTransaction(null);
        }}
        transaction={editTransaction}
      />

      {/* Edit Transfer Dialog */}
      <TransferFormDialog
        open={editTransferId !== null && transferData !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditTransferId(null);
        }}
        transfer={transferData ? (transferData as TransferData) : null}
      />
    </>
  );
}
