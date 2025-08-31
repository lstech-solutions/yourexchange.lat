"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const sendOtpAction = async (formData: FormData) => {
  const phoneNumber = formData.get("phone_number")?.toString();
  const supabase = createClient();

  if (!phoneNumber) {
    return { error: "Phone number is required" };
  }

  // Validate phone number format (basic validation)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return { error: "Please enter a valid phone number" };
  }

  try {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    // Store the OTP in the database
    const { error: otpError } = await supabase
      .from('otp_verifications')
      .upsert({
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      return { error: "Failed to initiate verification. Please try again." };
    }

    // Call Brevo to send the OTP via SMS
    const brevoResponse = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
      },
      body: JSON.stringify({
        sender: 'Yourexchange',
        recipient: phoneNumber,
        content: `Yourexchange verification code is: ${otp}. Valid for 10 minutes.`,
        type: 'transactional',
        tag: 'otp',
      }),
    });

    if (!brevoResponse.ok) {
      const error = await brevoResponse.json();
      console.error("Error sending SMS via Brevo:", error);
      return { error: "Failed to send verification code. Please try again." };
    }

    if (otpError) {
      console.error("OTP sending error:", otpError);
      return { error: "Failed to send OTP. Please try again." };
    }

    // Return success state
    return { 
      success: true, 
      message: "OTP sent successfully! Please check your phone.",
      redirectUrl: `/auth?step=verify&phone=${encodeURIComponent(phoneNumber)}`
    };
  } catch (err) {
    console.error("Error in send OTP flow:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
};

export const verifyOtpAction = async (formData: FormData) => {
  const phoneNumber = formData.get("phone_number")?.toString();
  const otpCode = formData.get("otp_code")?.toString();
  
  if (!phoneNumber || !otpCode) {
    return encodedRedirect(
      "error",
      `/auth?step=verify&phone=${encodeURIComponent(phoneNumber || "")}`,
      "Phone number and OTP code are required"
    );
  }

  try {
    const supabase = createClient();
    
    console.log('Verifying OTP for phone:', phoneNumber);
    
    // Check if the OTP is valid and not expired
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('otp_code', otpCode)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpData) {
      console.error("Invalid or expired OTP:", otpError);
      return encodedRedirect(
        "error",
        `/auth?step=verify&phone=${encodeURIComponent(phoneNumber)}`,
        "Invalid or expired verification code. Please request a new one."
      );
    }

    // Mark OTP as used
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', otpData.id);

    // Check if user exists, if not create a new user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is 'not found' error
      console.error("Error checking user:", userError);
      return encodedRedirect(
        "error",
        `/auth?step=verify&phone=${encodeURIComponent(phoneNumber)}`,
        "Error verifying your account. Please try again."
      );
    }

    let userId = userData?.id;
    
    // Create user if doesn't exist
    if (!userId) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (createError || !newUser) {
        console.error("Error creating user:", createError);
        return encodedRedirect(
          "error",
          `/auth?step=verify&phone=${encodeURIComponent(phoneNumber)}`,
          "Error creating your account. Please try again."
        );
      }
      userId = newUser.id;
    }

    console.log('OTP verification successful for phone:', phoneNumber);
    return redirect("/dashboard");
    
  } catch (error) {
    console.error("Error in verifyOtpAction:", error);
    return encodedRedirect(
      "error",
      `/auth?step=verify&phone=${encodeURIComponent(phoneNumber || "")}`,
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
