"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const sendOtpAction = async (formData: FormData) => {
  const phoneNumber = formData.get("phone_number")?.toString();
  const supabase = await createClient();

  if (!phoneNumber) {
    return { error: "Phone number is required" };
  }

  // Validate phone number format (basic validation)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return { error: "Please enter a valid phone number" };
  }

  try {
    const { error } = await supabase.functions.invoke(
      "supabase-functions-send-otp",
      {
        body: { phoneNumber },
      },
    );

    if (error) {
      console.error("OTP sending error:", error);
      return { error: "Failed to send OTP. Please try again." };
    }

    // Return success state instead of redirecting
    return { 
      success: true, 
      message: "OTP sent successfully! Please check your phone.",
      redirectUrl: `/auth?step=verify&phone=${encodeURIComponent(phoneNumber)}`
    };
  } catch (err) {
    console.error("Error sending OTP:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
};

export const verifyOtpAction = async (formData: FormData) => {
  const phoneNumber = formData.get("phone_number")?.toString();
  const otpCode = formData.get("otp_code")?.toString();
  
  if (!phoneNumber || !otpCode) {
    return encodedRedirect(
      "error",
      "/auth?step=verify&phone=" + encodeURIComponent(phoneNumber || ""),
      "Phone number and OTP code are required"
    );
  }

  try {
    const supabase = await createClient();
    
    // Verify the OTP with the server
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
        data?.error || "Invalid or expired OTP. Please try again."
      );
    }

    // If we have a valid session from the OTP verification
    if (data.session) {
      // Set the session in the client
      const { error: authError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (authError) {
        console.error("Error setting session:", authError);
        return encodedRedirect(
          "error",
          "/auth?step=verify&phone=" + encodeURIComponent(phoneNumber),
          "Failed to authenticate. Please try again."
        );
      }

      // Redirect to the dashboard on successful verification
      return redirect("/dashboard");
    }

    // If we get here, the verification was successful but no session was returned
    return encodedRedirect(
      "error",
      "/auth?step=verify&phone=" + encodeURIComponent(phoneNumber),
      "Verification successful but unable to create session. Please try again."
    );
  } catch (err) {
    console.error("Error in verifyOtpAction:", err);
    return encodedRedirect(
      "error",
      "/auth?step=verify&phone=" + encodeURIComponent(phoneNumber || ""),
      "An unexpected error occurred. Please try again."
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
