-- Fix security warning by recreating the function with proper search_path
DROP TRIGGER IF EXISTS trigger_calculate_week_start ON public.naati_attempts;
DROP FUNCTION IF EXISTS public.calculate_week_start() CASCADE;

CREATE OR REPLACE FUNCTION public.calculate_week_start()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Calculate Monday of the week for the attempt_at date
  NEW.week_start := DATE_TRUNC('week', NEW.attempt_at)::DATE + INTERVAL '1 day';
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_calculate_week_start
  BEFORE INSERT OR UPDATE ON public.naati_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_week_start();