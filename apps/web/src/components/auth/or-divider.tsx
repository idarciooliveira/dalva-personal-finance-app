import { Separator } from "@/components/ui/separator";

/**
 * Horizontal divider with an "or" label between the form and OAuth buttons.
 */
export function OrDivider() {
  return (
    <div className="relative my-6 flex items-center gap-4">
      <Separator className="flex-1" />
      <span className="text-xs font-medium text-muted-foreground">or</span>
      <Separator className="flex-1" />
    </div>
  );
}
