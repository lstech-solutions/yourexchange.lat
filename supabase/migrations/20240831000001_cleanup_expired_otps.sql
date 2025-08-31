-- Create a function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  -- Delete OTPs that are either expired or were verified more than 24 hours ago
  DELETE FROM public.otp_verifications 
  WHERE expires_at < NOW() 
  OR (verified = true AND created_at < NOW() - INTERVAL '24 hours');
  
  -- Log the cleanup (optional)
  RAISE NOTICE 'Cleaned up expired OTPs at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otps() TO service_role;

-- Create a function to be called by Supabase's scheduled functions
CREATE OR REPLACE FUNCTION public.daily_cleanup()
RETURNS void AS $$
BEGIN
  PERFORM public.cleanup_expired_otps();
  -- Add other daily cleanup tasks here if needed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION public.daily_cleanup() TO service_role;
