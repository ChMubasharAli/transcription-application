-- Make exam_date field NOT NULL (mandatory)
-- First, set a default value for any existing NULL records
UPDATE public.profiles 
SET exam_date = CURRENT_DATE + INTERVAL '30 days' 
WHERE exam_date IS NULL;

-- Now alter the column to be NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN exam_date SET NOT NULL;