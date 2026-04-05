import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google-icon";

/**
 * Google OAuth sign-in button.
 * Currently a placeholder (no provider configured yet).
 */
export function GoogleOAuthButton() {
  return (
    <Button variant="outline" className="w-full gap-3" type="button">
      <GoogleIcon />
      Continue with Google
    </Button>
  );
}
