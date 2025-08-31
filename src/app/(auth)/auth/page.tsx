"use client";

import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { sendOtpAction, verifyOtpAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Smartphone, ArrowLeft } from "lucide-react";

function AuthForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    const phoneParam = searchParams.get("phone");

    if (stepParam === "verify" && phoneParam) {
      setStep("verify");
      setPhoneNumber(phoneParam);
      setCountdown(60); // Start 60 second countdown
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const message: Message = {
    success: searchParams.get("success") || "",
    error: searchParams.get("error") || "",
    message: searchParams.get("message") || "",
  } as Message;

  const handleBackToPhone = () => {
    setStep("phone");
    setPhoneNumber("");
    window.history.replaceState({}, "", "/auth");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const result = await sendOtpAction(formData);
      
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      if (result?.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    try {
      setError("");
      const formData = new FormData();
      formData.append("phone_number", phoneNumber);
      const result = await sendOtpAction(formData);
      
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      if (result?.success) {
        setCountdown(60);
      }
    } catch (err) {
      console.error('Failed to resend OTP:', err);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          {step === "phone" ? (
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              <div className="space-y-2 text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Welcome to YourExchange
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your phone number to get started. We'll send you a
                  verification code.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +57 for Colombia)
                  </p>
                </div>
              </div>

              <SubmitButton
                type="submit"
                pendingText="Sending code..."
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Verification Code'}
              </SubmitButton>

              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <FormMessage message={message} />
            </form>
          ) : (
            <form className="flex flex-col space-y-6">
              <div className="space-y-2 text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-green-600" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Verify Your Phone
                </h1>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium">{phoneNumber}</span>
                </p>
              </div>

              <div className="space-y-4">
                <input type="hidden" name="phone_number" value={phoneNumber} />
                <div className="space-y-2">
                  <Label htmlFor="otp_code" className="text-sm font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="otp_code"
                    name="otp_code"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    className="w-full text-center text-2xl tracking-widest"
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              <SubmitButton
                formAction={verifyOtpAction}
                pendingText="Verifying..."
                className="w-full"
              >
                Verify Code
              </SubmitButton>

              <div className="flex flex-col space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className="w-full"
                >
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : "Resend code"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToPhone}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change phone number
                </Button>
              </div>

              <FormMessage message={message} />
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
