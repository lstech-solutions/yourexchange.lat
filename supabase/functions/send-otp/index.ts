import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Clean up any existing OTPs for this phone number
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("phone_number", phoneNumber);

    // Store OTP in database
    const { error: dbError } = await supabase.from("otp_verifications").insert({
      phone_number: phoneNumber,
      otp_code: otpCode,
      expires_at: expiresAt,
      verified: false,
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to store OTP" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS via Brevo (you'll need to set up Brevo API key)
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");

    if (brevoApiKey) {
      try {
        const smsResponse = await fetch(
          "https://api.brevo.com/v3/transactionalSMS/sms",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "api-key": brevoApiKey,
            },
            body: JSON.stringify({
              type: "transactional",
              unicodeEnabled: false,
              recipient: phoneNumber,
              content: `Your YourExchange verification code is: ${otpCode}. This code expires in 5 minutes.`,
              sender: "YourExchange",
            }),
          },
        );

        if (!smsResponse.ok) {
          console.error("Brevo SMS error:", await smsResponse.text());
          // Don't fail the request if SMS fails, just log it
        }
      } catch (smsError) {
        console.error("SMS sending error:", smsError);
        // Don't fail the request if SMS fails, just log it
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent successfully",
        // In development, return the OTP for testing
        ...(Deno.env.get("ENVIRONMENT") === "development" && { otp: otpCode }),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
