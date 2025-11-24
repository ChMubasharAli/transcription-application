-- Manually assign admin role to the existing user
INSERT INTO public.user_roles (user_id, role)
VALUES ('b61b858c-4cec-41c4-acaf-72ec31654a80', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Let's also check if our trigger exists and works properly
-- First, let's see what triggers we have
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';