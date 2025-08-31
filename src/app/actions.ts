"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient as createClientComponent } from "../../supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { SupabaseClient } from "@supabase/supabase-js";
import twilio from 'twilio';
// Helper function to ensure a user exists in the database
async function ensureUserExists(supabase: SupabaseClient, phoneNumber: string) {
  // Check if user exists
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('phone_number', phoneNumber)
    .single();

  if (userError && userError.code !== 'PGRST116') { // PGRST116 is 'not found' error
    console.error("Error checking user:", userError);
    throw new Error("Error verifying user account");
  }

  // Create user if doesn't exist
  if (!userData) {
    const { error: createError } = await supabase
      .from('users')
      .insert({
        phone_number: phoneNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error("Error creating user account");
    }
  }
}

// Rate limiting configuration (5 requests per 10 minutes per phone number)
const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes



export const sendOtpAction = async (formData: FormData) => {
  const phoneNumber = formData.get("phone_number")?.toString();
  const supabase = createClientComponent();
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS).toISOString();

  if (!phoneNumber) {
    return { error: "Phone number is required" };
  }

  // Validate phone number format (E.164 format)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  
  if (!phoneRegex.test(formattedPhoneNumber)) {
    return { error: "Please enter a valid phone number with country code (e.g., +1234567890)" };
  }

  // Check rate limiting
  const { count: recentAttempts, error: rateLimitError } = await supabase
    .from('otp_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('phone_number', phoneNumber)
    .gt('created_at', tenMinutesAgo);

  if (rateLimitError) {
    console.error("Error checking rate limit:", rateLimitError);
    return { error: "An error occurred. Please try again later." };
  }

  if (recentAttempts && recentAttempts >= RATE_LIMIT_COUNT) {
    return { error: "Too many attempts. Please try again later." };
  }

  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_ID) {
      throw new Error('Twilio credentials not properly configured. Please check your environment variables.');
    }
    
    // Initialize Twilio client with just account SID and auth token
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID.trim(),
      process.env.TWILIO_AUTH_TOKEN.trim()
    );
    
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_ID.trim();

    // Ensure phone number is properly formatted for Twilio
    const decodedPhoneNumber = decodeURIComponent(formattedPhoneNumber);
    console.log('Sending OTP to phone number:', decodedPhoneNumber);
    
    // Send OTP via Twilio Verify with minimal parameters
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications
      .create({
        to: decodedPhoneNumber,
        channel: 'sms'
      });

    console.log('Twilio verification SID:', verification.sid);
    
    // Store verification attempt in the database
    const verificationData: any = {
      phone_number: phoneNumber,
      verification_sid: verification.sid,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
      verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // For backward compatibility with old schema
      otp_code: verification.sid // Using SID as a fallback OTP code
    };

    const { error: otpError } = await supabase
      .from('otp_verifications')
      .insert(verificationData);

    if (otpError) {
      console.error("Error storing verification attempt:", otpError);
      return { error: "Failed to initiate verification. Please try again." };
    }
    
    return { 
      success: true, 
      message: "Verification code sent successfully!" 
    };
    
  } catch (err) {
    console.error("Error in send OTP flow:", err);
    return { 
      error: "Failed to send verification code. Please try again.",
      success: false
    };
  }
};

type VerifyOtpResponse = {
  error?: string;
  success?: boolean;
  message?: string;
  redirectTo?: string;
};

export const verifyOtpAction = async (formData: FormData): Promise<VerifyOtpResponse> => {
  const phoneNumber = formData.get("phone_number")?.toString();
  const otpCode = formData.get("otp_code")?.toString();
  
  if (!phoneNumber || !otpCode) {
    const errorMessage = "Phone number and OTP code are required";
    const decodedPhone = phoneNumber ? decodeURIComponent(phoneNumber) : '';
    const redirectUrl = `/auth?step=verify&phone=${encodeURIComponent(decodedPhone)}&error=true&message=${encodeURIComponent(errorMessage)}`;
    redirect(redirectUrl);
    return { error: errorMessage, success: false };
  }

  try {
    // Create admin client for operations that need to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);
    
    // Regular client for operations that should respect RLS
    const supabase = createClientComponent();
    
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    console.log('Verifying OTP for phone:', phoneNumber);
    
    // Decode and clean the phone number for Twilio
    const decodedPhoneNumber = phoneNumber ? decodeURIComponent(phoneNumber) : '';
    // Ensure phone number is in E.164 format (remove any existing + and add it back)
    const cleanedPhoneNumber = decodedPhoneNumber.replace(/^\+/, '');
    const formattedPhoneNumber = `+${cleanedPhoneNumber}`;
      
    console.log('Formatted phone number for Twilio verification:', formattedPhoneNumber);
    
    // Function to check verification status with retry
    const checkVerification = async (attempt = 1, maxAttempts = 3, delay = 1000): Promise<any> => {
      try {
        const verificationCheck = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_ID || '')
          .verificationChecks
          .create({ to: formattedPhoneNumber, code: otpCode });

        console.log(`Verification check attempt ${attempt}:`, verificationCheck.status);

        if (verificationCheck.status === 'pending' && attempt < maxAttempts) {
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, delay));
          return checkVerification(attempt + 1, maxAttempts, delay * 1.5); // Exponential backoff
        }

        return verificationCheck;
      } catch (error) {
        console.error(`Verification check attempt ${attempt} failed:`, error);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return checkVerification(attempt + 1, maxAttempts, delay * 1.5);
        }
        throw error;
      }
    };

    // Start verification check with retry
    const verificationCheck = await checkVerification();
    
    // Handle verification status
    if (verificationCheck.status !== 'approved') {
      const statusMessages: Record<string, string> = {
        'pending': 'The verification code is still being processed. Please try again in a moment.',
        'canceled': 'The verification was canceled. Please request a new code.',
        'expired': 'The verification code has expired. Please request a new code.',
        'max_attempts_reached': 'Too many incorrect attempts. Please request a new verification code.',
        'denied': 'The verification code was denied. Please try again with a valid code.'
      };

      const errorMessage = statusMessages[verificationCheck.status] || 'Invalid verification code. Please try again.';
      const decodedPhone = phoneNumber ? decodeURIComponent(phoneNumber) : '';
      const redirectUrl = `/auth?step=verify&phone=${encodeURIComponent(decodedPhone)}&error=true&message=${encodeURIComponent(errorMessage)}`;
      // This will throw a special error to handle the redirect
      redirect(redirectUrl);
      // No code after redirect will execute
    }
    
    // Mark verification as used in the database
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ 
        verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error("Error updating verification status:", updateError);
      throw new Error('Failed to update verification status');
    }

    // Verify the OTP with Supabase Auth
    const { error: signInError, data: { session: authSession } } = await supabase.auth.verifyOtp({
      phone: formattedPhoneNumber,
      token: otpCode,
      type: 'sms'
    });
    
    console.log('OTP verification response:', { signInError, hasSession: !!authSession });

    if (signInError || !authSession) {
      console.error('Error verifying OTP:', signInError);
      if (signInError?.code === 'otp_expired') {
        throw new Error('The verification code has expired. Please request a new one.');
      }
      throw new Error('Invalid verification code. Please try again.');
    }

    // Create or update the user in the database after successful verification
    const { data: userResult, error: userError } = await adminClient.rpc('handle_new_user', {
      p_phone_number: formattedPhoneNumber,
      p_last_login: new Date().toISOString()
    });

    if (userError) {
      console.error('Error calling handle_new_user:', userError);
      throw new Error('Failed to create or update user');
    }

    // Check if the function returned an error
    if (!userResult?.success) {
      console.error('Error in handle_new_user:', userResult?.error || 'Unknown error');
      throw new Error(userResult?.error || 'Failed to process user');
    }

    console.log(`User ${userResult.action} successfully:`, userResult.user_id);
    console.log('User session created successfully for phone:', formattedPhoneNumber);

    console.log('User session created successfully:', authSession.user.id);
    
    // The client-side will handle the redirect based on this status
    return { success: true, redirectTo: "/dashboard" };
      
  } catch (error) {
    // Don't log NEXT_REDIRECT as an error - it's expected behavior
    if (!(error instanceof Error && error.message === 'NEXT_REDIRECT')) {
      console.error("Error in verifyOtpAction:", error);
    }
    
    // Use a user-friendly error message for redirects
    const errorMessage = (error instanceof Error && error.message === 'NEXT_REDIRECT') 
      ? 'Redirecting...' 
      : error instanceof Error ? error.message : 'An unknown error occurred';
      
    // Ensure phone number is properly decoded before re-encoding to prevent double-encoding
    const decodedPhone = phoneNumber ? decodeURIComponent(phoneNumber) : '';
    const redirectUrl = `/auth?step=verify&phone=${encodeURIComponent(decodedPhone)}&error=true&message=${encodeURIComponent(errorMessage)}`;
    // This will throw a special error to handle the redirect
    redirect(redirectUrl);
    // No code after redirect will execute
  }
}
