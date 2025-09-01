// This is a server-side API route for OTP verification
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { phoneNumber, otpCode } = await request.json();
    
    if (!phoneNumber || !otpCode) {
      return NextResponse.json(
        { error: 'Phone number and OTP code are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with minimal cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: () => '',
          set: () => {},
          remove: () => {}
        }
      }
    );

    // Check if OTP exists and is not expired
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('otp_code', otpCode)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpData) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', otpData.id);

    if (updateError) {
      console.error('Error updating OTP verification:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify OTP' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      phoneNumber
    });
  } catch (error) {
    console.error('Error in verify-otp route:', error);
    return NextResponse.json(
      { error: 'An error occurred while verifying OTP' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
