-- Update the handle_new_user function to include exam_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, exam_date)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone_number',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'exam_date' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'exam_date')::DATE
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$function$