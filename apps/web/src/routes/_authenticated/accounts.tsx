import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import { useState } from "react";
import { Plus, Wallet } from "lucide-react";

import { AccountRow } from "@/components/accounts/account-row";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { AdjustBalanceDialog } from "@/components/accounts/adjust-balance-dialog";
import { AccountsListSkeleton } from "@/components/accounts/accounts-list-skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/accounts")({
  component: AccountsPage,
});

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function AccountsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-200 px-4 py-6 lg:px-8">
        <AccountsContent />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Accounts content                                                          */
/* -------------------------------------------------------------------------- */

function AccountsContent() {
  const [showArchived, setShowArchived] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Doc<"accounts"> | null>(null);
  const [adjustAccount, setAdjustAccount] = useState<Doc<"accounts"> | null>(
    null,
  );

  const { data: accounts, isLoading } = useQuery(
    convexQuery(api.accounts.listAccounts, {
      includeArchived: showArchived,
    }),
  );

  if (isLoading) {
    return <AccountsListSkeleton />;
  }

  const sortedAccounts = [...(accounts ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              Accounts
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your financial accounts, balances, and settings.
            </p>
          </div>
          <Button
            variant="accent"
            size="default"
            className="shrink-0"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-1.5 size-4" />
            Add account
          </Button>
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

      {/* List */}
      {sortedAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Wallet className="mb-3 size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            No accounts yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your first account to start tracking your finances.
          </p>
          <Button
            variant="accent"
            size="default"
            className="mt-4"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-1.5 size-4" />
            Add account
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAccounts.map((account) => (
            <AccountRow
              key={account._id}
              account={account}
              onEdit={() => setEditAccount(account)}
              onAdjustBalance={() => setAdjustAccount(account)}
            />
          ))}
        </div>
      )}

      {/* Create Account Dialog */}
      <AccountFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        account={null}
      />

      {/* Edit Account Dialog */}
      <AccountFormDialog
        open={editAccount !== null}
        onOpenChange={(open) => {
          if (!open) setEditAccount(null);
        }}
        account={editAccount}
      />

      {/* Adjust Balance Dialog */}
      <AdjustBalanceDialog
        open={adjustAccount !== null}
        onOpenChange={(open) => {
          if (!open) setAdjustAccount(null);
        }}
        account={adjustAccount}
      />
    </>
  );
}
