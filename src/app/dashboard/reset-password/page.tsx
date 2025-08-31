"use client";

import { resetPasswordAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (formData: FormData) => {
    const result = await resetPasswordAction(formData);
    if ('error' in result && result.error) {
      router.push(`/dashboard/reset-password?error=${encodeURIComponent(result.error)}`);
    } else if ('success' in result && result.success) {
      router.push(`/dashboard/reset-password?success=${encodeURIComponent(result.success)}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form action={handleSubmit} className="flex flex-col space-y-6" method="POST">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
              <p className="text-sm text-muted-foreground">
                Please enter your new password below.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="New password"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  required
                  className="w-full"
                />
              </div>
            </div>

            <SubmitButton className="w-full">Reset password</SubmitButton>
            {searchParams?.get('error') && (
              <FormMessage message={{ error: searchParams.get('error') || '' }} />
            )}
            {searchParams?.get('success') && (
              <FormMessage message={{ success: searchParams.get('success') || '' }} />
            )}
          </form>
        </div>
      </div>
    </>
  );
}
