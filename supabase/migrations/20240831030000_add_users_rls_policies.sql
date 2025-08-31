-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own last_login timestamp
CREATE POLICY "Allow users to update their own last_login"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service_role to perform any operation (bypasses RLS)
CREATE POLICY "Allow service_role full access"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to see their own data
CREATE POLICY "Allow users to view their own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to insert their own records
CREATE POLICY "Allow users to insert their own data"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
