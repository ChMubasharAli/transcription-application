-- Update the password for the admin user
-- First, let's get the user ID
UPDATE auth.users 
SET encrypted_password = crypt('score@2025', gen_salt('bf'))
WHERE email = 'contact@scoresmartpte.com';