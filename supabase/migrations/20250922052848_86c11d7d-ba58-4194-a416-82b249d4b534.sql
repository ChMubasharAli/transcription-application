-- Add language_id column to rapid_review table
ALTER TABLE public.rapid_review 
ADD COLUMN language_id UUID REFERENCES public.languages(id);

-- Update existing rapid review items to use the first available language (optional - for existing data)
UPDATE public.rapid_review 
SET language_id = (SELECT id FROM public.languages ORDER BY created_at ASC LIMIT 1)
WHERE language_id IS NULL;