-- Add last_login column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add comment to the column
COMMENT ON COLUMN public.users.last_login IS 'Timestamp of the last user login';

-- Update existing rows to set a default value if needed
UPDATE public.users 
SET last_login = NOW() 
WHERE last_login IS NULL;
