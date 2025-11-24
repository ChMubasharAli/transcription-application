-- Remove language_id from domains table since domains will be shared
ALTER TABLE public.domains DROP COLUMN language_id;

-- Add language_id to dialogues table to make dialogues language-specific
ALTER TABLE public.dialogues ADD COLUMN language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE;