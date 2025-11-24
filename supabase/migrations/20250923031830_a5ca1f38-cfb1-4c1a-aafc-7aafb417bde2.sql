-- Add language_id to profiles table to store user's selected language
ALTER TABLE public.profiles 
ADD COLUMN language_id uuid REFERENCES public.languages(id);

-- Add some sample languages if table is empty
INSERT INTO public.languages (name, code) VALUES 
('English', 'en'),
('Punjabi', 'pa'),
('Hindi', 'hi'),
('Mandarin', 'zh'),
('Arabic', 'ar'),
('Spanish', 'es')
ON CONFLICT DO NOTHING;