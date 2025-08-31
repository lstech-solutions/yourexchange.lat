-- Add verification_sid column to otp_verifications table
ALTER TABLE public.otp_verifications 
ADD COLUMN IF NOT EXISTS verification_sid TEXT;

-- Add index for verification_sid
CREATE INDEX IF NOT EXISTS idx_otp_verifications_verification_sid 
ON public.otp_verifications(verification_sid);

-- Add comment to the column
COMMENT ON COLUMN public.otp_verifications.verification_sid IS 'The Twilio Verify Service SID for this verification';

-- Update any existing rows with a default value if needed
-- This is safe to run even if the column already exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'otp_verifications' 
               AND column_name = 'verification_sid' 
               AND is_nullable = 'YES') THEN
        -- Update only if the column allows NULL and is NULL
        UPDATE public.otp_verifications 
        SET verification_sid = 'legacy_' || id::TEXT 
        WHERE verification_sid IS NULL;
    END IF;
END $$;
