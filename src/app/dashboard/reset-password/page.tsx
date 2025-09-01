import { Suspense } from 'react';
import Navbar from "@/components/navbar";
import { ResetPasswordForm } from './reset-password-form';

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <Suspense fallback={
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center">
            Loading...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </>
  );
}
