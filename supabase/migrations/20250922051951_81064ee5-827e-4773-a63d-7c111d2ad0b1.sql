-- Add language_id column to vocabulary table
ALTER TABLE public.vocabulary 
ADD COLUMN language_id UUID REFERENCES public.languages(id);

-- Update existing vocabulary items to use the first available language (optional - for existing data)
UPDATE public.vocabulary 
SET language_id = (SELECT id FROM public.languages ORDER BY created_at ASC LIMIT 1)
WHERE language_id IS NULL;