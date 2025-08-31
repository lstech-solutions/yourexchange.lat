-- Drop existing table if it exists
DROP TABLE IF EXISTS public.otp_verifications CASCADE;

-- Create OTP verifications table
CREATE TABLE public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_otp_verifications_phone_number ON public.otp_verifications(phone_number);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_otp_verifications_updated_at
BEFORE UPDATE ON public.otp_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for security
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to verify OTPs
CREATE POLICY "Allow OTP verification"
ON public.otp_verifications
FOR SELECT
TO authenticated
USING (true);

-- Allow service role to manage OTPs (for server-side use)
CREATE POLICY "Allow service role access"
ON public.otp_verifications
USING (true)
WITH CHECK (auth.role() = 'service_role');
