-- Update password for admin user contact@scoresmartpte.com
-- Note: This uses Supabase's auth.update_user function which requires proper permissions

-- First, let's ensure the user has admin role (already done, but ensuring)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'contact@scoresmartpte.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- To update the password, you'll need to do it via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Find contact@scoresmartpte.com
-- 3. Click "..." menu > Reset Password
-- 4. Set password to: SCORE2025

-- Alternatively, send a password reset email:
-- The user can reset their password using the "Forgot your password?" link