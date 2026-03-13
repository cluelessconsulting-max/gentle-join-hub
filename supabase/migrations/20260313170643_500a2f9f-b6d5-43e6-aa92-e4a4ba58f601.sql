
-- Add buyer_tier and total_points to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS buyer_tier text NOT NULL DEFAULT 'guest';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_points integer NOT NULL DEFAULT 0;

-- Add verified_by to purchases
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS verified_by text;

-- Create function to auto-update buyer_tier and total_points
CREATE OR REPLACE FUNCTION public.update_buyer_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_count integer;
  v_total numeric;
  v_tier text;
BEGIN
  -- Determine which user_id to update
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Count purchases and sum amounts
  SELECT count(*), COALESCE(sum(amount), 0)
  INTO v_count, v_total
  FROM public.purchases
  WHERE user_id = v_user_id;

  -- Determine tier
  IF v_count >= 6 THEN v_tier := 'vip';
  ELSIF v_count >= 3 THEN v_tier := 'buyer';
  ELSIF v_count >= 1 THEN v_tier := 'shopper';
  ELSE v_tier := 'guest';
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET buyer_tier = v_tier, total_points = floor(v_total)
  WHERE user_id = v_user_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on purchases table
DROP TRIGGER IF EXISTS trg_update_buyer_tier ON public.purchases;
CREATE TRIGGER trg_update_buyer_tier
AFTER INSERT OR UPDATE OR DELETE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.update_buyer_tier();
