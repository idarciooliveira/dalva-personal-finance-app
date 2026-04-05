import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@mpf/backend/convex/_generated/api";
import type { Doc } from "@mpf/backend/convex/_generated/dataModel";
import {
  MoreVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Scale,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_TYPES, ACCOUNT_THEMES } from "@/lib/accounts";

interface AccountRowProps {
  account: Doc<"accounts">;
  onEdit: () => void;
  onAdjustBalance: () => void;
}

export function AccountRow({ account, onEdit, onAdjustBalance }: AccountRowProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const accountType = ACCOUNT_TYPES.find((t) => t.value === account.type);
  const Icon = accountType?.icon;
  const theme = ACCOUNT_THEMES.find((t) => t.id === (account.theme ?? "default")) ?? ACCOUNT_THEMES[0];

  const { mutate: archiveAccount } = useMutation({
    mutationFn: useConvexMutation(api.accounts.archiveAccount),
  });
  const { mutate: restoreAccount } = useMutation({
    mutationFn: useConvexMutation(api.accounts.restoreAccount),
  });
  const { mutate: deleteAccount } = useMutation({
    mutationFn: useConvexMutation(api.accounts.deleteAccount),
  });

  const isNegative = account.balance < 0;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 transition-colors",
        account.archived && "opacity-60",
      )}
    >
      {/* Icon with theme color */}
      <div
        className="flex size-10 items-center justify-center rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
        }}
      >
        {Icon && <Icon className="size-5 text-white" />}
      </div>

      {/* Name + type */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {account.name}
          </span>
          {account.archived && (
            <Badge variant="secondary" className="text-[10px]">
              Archived
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {accountType?.label ?? account.type} · {account.currency}
        </span>
      </div>

      {/* Balance */}
      <div className="text-right">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isNegative ? "text-destructive" : "text-foreground",
          )}
        >
          {formatCurrency(Math.abs(account.balance), account.currency)}
        </span>
        {isNegative && (
          <span className="ml-1 text-xs text-destructive">owing</span>
        )}
      </div>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAdjustBalance}>
            <Scale className="mr-2 size-4" />
            Adjust balance
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {account.archived ? (
            <DropdownMenuItem
              onClick={() => restoreAccount({ id: account._id })}
            >
              <ArchiveRestore className="mr-2 size-4" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => archiveAccount({ id: account._id })}
            >
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
        title="Delete account"
        description="Delete this account? This cannot be undone."
        onConfirm={() => deleteAccount({ id: account._id })}
      />
    </div>
  );
}
