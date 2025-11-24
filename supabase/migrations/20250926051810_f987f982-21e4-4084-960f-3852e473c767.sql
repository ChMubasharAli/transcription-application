-- Add admin role for the contact@scoresmartpte.com user if not already present
INSERT INTO public.user_roles (user_id, role) 
SELECT 'b61b858c-4cec-41c4-acaf-72ec31654a80', 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'b61b858c-4cec-41c4-acaf-72ec31654a80' AND role = 'admin'
);

-- Also add admin role for the scoresmartpte@gmail.com user
INSERT INTO public.user_roles (user_id, role) 
SELECT 'd743bd95-a6a0-4428-ba97-6b503d202351', 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'd743bd95-a6a0-4428-ba97-6b503d202351' AND role = 'admin'
);