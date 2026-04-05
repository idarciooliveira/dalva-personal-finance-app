import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthErrorAlert } from "@/components/auth-error-alert";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { OrDivider } from "@/components/auth/or-divider";
import { parseConvexAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/login")({ component: LoginPage });

/* -------------------------------------------------------------------------- */
/*  Schema                                                                    */
/* -------------------------------------------------------------------------- */

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function LoginPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  // Navigate to dashboard reactively once the auth handshake completes.
  // This also handles the case where an already-authenticated user visits /login.
  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginValues) {
    setAuthError(null);
    try {
      await signIn("password", {
        email: data.email,
        password: data.password,
        flow: "signIn",
      });
    } catch (error) {
      setAuthError(parseConvexAuthError(error, "signIn"));
    }
  }

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle={
        <>
          New to DALVA?{" "}
          <Link
            to="/register"
            className="font-medium text-primary underline-offset-4 hover:underline dark:text-primary"
          >
            Sign up
          </Link>
        </>
      }
    >
      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        noValidate
      >
        {/* Auth error */}
        <AuthErrorAlert
          message={authError}
          onDismiss={() => setAuthError(null)}
        />
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-12 rounded-xl px-4"
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="h-12 rounded-xl px-4"
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="accent"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </form>

      {/* Forgot password */}
      <div className="mt-4 text-center">
        <Link
          to="/forgot-password"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Divider + Google OAuth */}
      <OrDivider />
      <GoogleOAuthButton />
    </AuthPageLayout>
  );
}
