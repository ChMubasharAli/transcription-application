-- Insert sample domains for testing
INSERT INTO public.domains (title, description, difficulty, color) VALUES
('Business', 'Professional business communication and workplace scenarios', 'Intermediate', '#2563eb'),
('Finance', 'Financial terminology, banking, and investment discussions', 'Advanced', '#059669'),
('Healthcare', 'Medical consultations, health discussions, and patient care', 'Intermediate', '#dc2626'),
('Education', 'Academic discussions, classroom scenarios, and educational topics', 'Beginner', '#7c3aed'),
('Technology', 'Tech industry conversations, software development, and innovation', 'Advanced', '#ea580c'),
('Travel', 'Tourism, transportation, and cultural exchange scenarios', 'Beginner', '#0891b2');

-- Insert sample dialogues for Business domain
INSERT INTO public.dialogues (domain_id, title, description, duration, difficulty, participants)
SELECT 
  d.id,
  'Business Meeting - Project Discussion',
  'A dialogue between manager and employee discussing quarterly project goals',
  '8 minutes',
  'Intermediate',
  '2 speakers'
FROM public.domains d WHERE d.title = 'Business'
UNION ALL
SELECT 
  d.id,
  'Client Presentation',
  'Presenting a business proposal to potential clients',
  '12 minutes',
  'Advanced',
  '3 speakers'
FROM public.domains d WHERE d.title = 'Business';

-- Insert sample dialogues for Finance domain
INSERT INTO public.dialogues (domain_id, title, description, duration, difficulty, participants)
SELECT 
  d.id,
  'Investment Consultation',
  'Financial advisor discussing investment options with a client',
  '15 minutes',
  'Advanced',
  '2 speakers'
FROM public.domains d WHERE d.title = 'Finance'
UNION ALL
SELECT 
  d.id,
  'Banking Services',
  'Customer inquiring about loan options and bank services',
  '10 minutes',
  'Intermediate',
  '2 speakers'
FROM public.domains d WHERE d.title = 'Finance';