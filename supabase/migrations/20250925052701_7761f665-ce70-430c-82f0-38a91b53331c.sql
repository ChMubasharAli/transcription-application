-- Create SQL functions for practice time calculations
-- Function to get today's practice seconds in Australia/Sydney timezone
CREATE OR REPLACE FUNCTION public.get_today_practice_seconds(p_student_id UUID)
RETURNS INTEGER AS $$
DECLARE
  today_start_local TIMESTAMPTZ;
  tomorrow_start_local TIMESTAMPTZ;
  result INTEGER;
BEGIN
  -- Calculate today's boundaries in Australia/Sydney timezone
  today_start_local := (date_trunc('day', (now() AT TIME ZONE 'Australia/Sydney')) AT TIME ZONE 'Australia/Sydney');
  tomorrow_start_local := today_start_local + interval '1 day';
  
  -- Calculate overlap with today for each session
  SELECT COALESCE(SUM(
    GREATEST(
      0,
      EXTRACT(EPOCH FROM 
        LEAST(COALESCE(ended_at, now()), tomorrow_start_local)
        - GREATEST(started_at, today_start_local)
      )
    )
  ), 0)::INTEGER INTO result
  FROM public.practice_sessions
  WHERE student_id = p_student_id
    AND started_at < tomorrow_start_local
    AND COALESCE(ended_at, now()) > today_start_local
    AND started_at <= COALESCE(ended_at, now()); -- Guard against invalid sessions
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Function to get all-time practice seconds
CREATE OR REPLACE FUNCTION public.get_all_time_practice_seconds(p_student_id UUID)
RETURNS INTEGER AS $$
DECLARE
  result INTEGER;
BEGIN
  SELECT COALESCE(SUM(
    GREATEST(
      0,
      EXTRACT(EPOCH FROM COALESCE(ended_at, now()) - started_at)
    )
  ), 0)::INTEGER INTO result
  FROM public.practice_sessions
  WHERE student_id = p_student_id
    AND started_at <= COALESCE(ended_at, now()); -- Guard against invalid sessions
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;