'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/app/actions";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');

  const handleSubmit = async (formData: FormData) => {
    const result = await resetPasswordAction(formData);
    
    if ('error' in result && result.error) {
      router.push(`/dashboard/reset-password?error=${encodeURIComponent(result.error)}`);
    } else if ('success' in result && result.success) {
      router.push(`/dashboard/reset-password?success=${encodeURIComponent(result.success)}`);
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
      <form action={handleSubmit} className="flex flex-col space-y-6" method="POST">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Please enter your new password below.
          </p>
        </div>

        <div className="space-y-4">
          {error && <FormMessage message={{ error }} />}
          {success && <FormMessage message={{ success }} />}
          
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
        </div>

        <SubmitButton className="w-full">Reset Password</SubmitButton>
      </form>
    </div>
  );
}
