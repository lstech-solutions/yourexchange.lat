-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user(TEXT, TIMESTAMPTZ);

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user(
  p_phone_number TEXT,
  p_last_login TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  user_id UUID;
  action_type TEXT;
  result JSONB;
BEGIN
  -- Try to get existing user
  SELECT id INTO user_id 
  FROM public.users 
  WHERE phone_number = p_phone_number
  LIMIT 1;
  
  IF user_id IS NULL THEN
    -- Insert new user with explicit ID generation
    INSERT INTO public.users (
      phone_number,
      last_login
    ) VALUES (
      p_phone_number,
      p_last_login
    )
    RETURNING id INTO user_id;
    
    action_type := 'created';
  ELSE
    -- Update existing user
    UPDATE public.users
    SET 
      last_login = p_last_login
    WHERE id = user_id;
    
    action_type := 'updated';
  END IF;
  
  -- Return success response
  SELECT jsonb_build_object(
    'success', true,
    'action', action_type,
    'user_id', user_id
  ) INTO result;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error response
  SELECT jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'state', SQLSTATE
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user(TEXT, TIMESTAMPTZ) 
TO service_role, anon, authenticated;
