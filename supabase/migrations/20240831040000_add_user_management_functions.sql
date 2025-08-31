-- Ensure the users table has the correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for users table
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger for updated_at
CREATE OR REPLACE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to handle new user creation from the application
CREATE OR REPLACE FUNCTION public.handle_new_user(
  p_phone_number TEXT,
  p_last_login TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  user_id UUID;
  action_type TEXT;
BEGIN
  -- First try to get existing user
  SELECT id INTO user_id 
  FROM public.users 
  WHERE phone_number = p_phone_number
  LIMIT 1;
  
  IF user_id IS NULL THEN
    -- Generate a new UUID for the user
    user_id := gen_random_uuid();
    
    -- Insert new user
    INSERT INTO public.users (
      id,
      phone_number,
      last_login,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      p_phone_number,
      p_last_login,
      NOW(),
      NOW()
    );
    
    action_type := 'created';
  ELSE
    -- Update existing user
    UPDATE public.users
    SET 
      last_login = p_last_login,
      updated_at = NOW()
    WHERE id = user_id;
    
    action_type := 'updated';
  END IF;
  
  -- Return a simple success response
  RETURN jsonb_build_object(
    'success', true,
    'action', action_type,
    'user_id', user_id
  );
EXCEPTION WHEN OTHERS THEN
  -- Return detailed error information
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'state', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
