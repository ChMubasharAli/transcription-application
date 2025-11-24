-- Update the handle_new_user function to include language_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, exam_date, language_id)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone_number',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'exam_date' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'exam_date')::DATE
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'language_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'language_id')::uuid
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;