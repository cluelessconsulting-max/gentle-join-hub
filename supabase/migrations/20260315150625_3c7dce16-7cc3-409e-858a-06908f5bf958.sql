
-- Add application_score and admin_notes columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS application_score integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes text;

-- Create function to calculate application score
CREATE OR REPLACE FUNCTION public.calculate_application_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  score integer := 0;
  name_parts text[];
BEGIN
  -- Instagram handle: +20
  IF NEW.instagram IS NOT NULL AND trim(NEW.instagram) != '' THEN
    score := score + 20;
    -- Instagram exists and not empty: +10
    score := score + 10;
  END IF;

  -- TikTok handle: +20
  IF NEW.tiktok IS NOT NULL AND trim(NEW.tiktok) != '' THEN
    score := score + 20;
  END IF;

  -- City is London, Milan, Paris or New York: +20
  IF lower(COALESCE(NEW.city, '')) IN ('london', 'milan', 'milano', 'paris', 'new york', 'new york city', 'nyc') THEN
    score := score + 20;
  END IF;

  -- 3 or more interests: +15
  IF array_length(NEW.interests, 1) >= 3 THEN
    score := score + 15;
  END IF;

  -- Full name has both first and last name: +15
  IF NEW.full_name IS NOT NULL THEN
    name_parts := string_to_array(trim(NEW.full_name), ' ');
    IF array_length(name_parts, 1) >= 2 THEN
      score := score + 15;
    END IF;
  END IF;

  NEW.application_score := score;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate score on insert/update
DROP TRIGGER IF EXISTS trg_calculate_application_score ON public.profiles;
CREATE TRIGGER trg_calculate_application_score
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_application_score();

-- Recalculate scores for existing profiles
UPDATE public.profiles SET application_score = 0 WHERE application_score IS NULL;
