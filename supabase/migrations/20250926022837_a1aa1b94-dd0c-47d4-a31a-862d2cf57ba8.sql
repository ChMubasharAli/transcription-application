-- Update the function to be more permissive for admin users
CREATE OR REPLACE FUNCTION public.get_user_email(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email 
  FROM auth.users 
  WHERE id = user_id;
$$;