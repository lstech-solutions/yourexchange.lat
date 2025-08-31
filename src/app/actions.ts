"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const sendOtpAction = async (formData: FormData) => {
  const phoneNumber = formData.get("phone_number")?.toString();
  const supabase = await createClient();

  if (!phoneNumber) {
    return encodedRedirect("error", "/auth", "Phone number is required");
  }

  // Validate phone number format (basic validation)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return encodedRedirect(
      "error",
      "/auth",
      "Please enter a valid phone number",
    );
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-send-otp",
      {
        body: { phoneNumber },
      },
    );

    if (error) {
      console.error("OTP sending error:", error);
      return encodedRedirect(
        "error",
        "/auth",
        "Failed to send OTP. Please try again.",
      );
    }

    return encodedRedirect(
      "success",
      "/auth?step=verify&phone=" + encodeURIComponent(phoneNumber),
      "OTP sent successfully! Please check your phone.",
    );
  } catch (err) {
    console.error("Error sending OTP:", err);
    return encodedRedirect(
      "error",
      "/auth",
      "Failed to send OTP. Please try again.",
    );
  }
};

export const verifyOtpAction = async (formData: FormData) => {
  const phoneNumber = formData.get("phone_number")?.toString();
  const otpCode = formData.get("otp_code")?.toString();
  const supabase = await createClient();

  if (!phoneNumber || !otpCode) {
    return encodedRedirect(
      "error",
      "/auth?step=verify&phone=" + encodeURIComponent(phoneNumber || ""),
      "Phone number and OTP code are required",
    );
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-verify-otp",
      {
        body: { phoneNumber, otpCode },
      },
    );

    if (error || !data?.success) {
      console.error("OTP verification error:", error);
      return encodedRedirect(
        "error",
        "/auth?step=verify&phone=" + encodeURIComponent(phoneNumber),
        data?.error || "Invalid or expired OTP. Please try again.",
      );
    }

    // If verification successful, sign in the user using the magic link
    if (data.session?.properties?.action_link) {
      // Extract the tokens from the action link
      const url = new URL(data.session.properties.action_link);
      const accessToken = url.searchParams.get("access_token");
      const refreshToken = url.searchParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error("Session error:", sessionError);
          return encodedRedirect(
            "error",
            "/auth",
            "Failed to create session. Please try again.",
          );
        }
      }
    }

    return redirect("/dashboard");
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return encodedRedirect(
      "error",
      "/auth?step=verify&phone=" + encodeURIComponent(phoneNumber),
      "Failed to verify OTP. Please try again.",
    );
  }
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/auth");
};

// Legacy actions for backward compatibility
export const signUpAction = async (formData: FormData) => {
  return redirect("/auth");
};

export const signInAction = async (formData: FormData) => {
  return redirect("/auth");
};

export const forgotPasswordAction = async (formData: FormData) => {
  return redirect("/auth");
};

export const resetPasswordAction = async (formData: FormData) => {
  return redirect("/auth");
};
