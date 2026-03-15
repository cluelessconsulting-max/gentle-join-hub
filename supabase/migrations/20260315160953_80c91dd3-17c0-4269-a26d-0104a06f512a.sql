-- Points multiplier settings (using app_settings table)
INSERT INTO public.app_settings (key, value) VALUES ('multiplier_active', 'false'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('multiplier_ends_at', 'null'::jsonb) ON CONFLICT (key) DO NOTHING;

-- Trigger: award points when purchase is verified
CREATE OR REPLACE FUNCTION public.award_points_on_purchase_verify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_points integer;
  v_multiplier boolean;
  v_ends_at timestamptz;
BEGIN
  IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
    v_points := floor(NEW.amount);
    
    SELECT (value::text = 'true') INTO v_multiplier FROM app_settings WHERE key = 'multiplier_active';
    
    IF v_multiplier THEN
      BEGIN
        SELECT (value#>>'{}')::timestamptz INTO v_ends_at FROM app_settings WHERE key = 'multiplier_ends_at';
        IF v_ends_at IS NOT NULL AND v_ends_at > now() THEN
          v_points := v_points * 2;
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END IF;
    
    INSERT INTO public.points_transactions (user_id, type, points, description)
    VALUES (NEW.user_id, 'purchase', v_points, 'Purchase verified: ' || NEW.brand_name || ' (£' || NEW.amount || ')');
    
    UPDATE public.profiles SET total_points = total_points + v_points WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_points_on_purchase_verify ON public.purchases;
CREATE TRIGGER trg_award_points_on_purchase_verify
  AFTER UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_on_purchase_verify();

-- Trigger: award points on event check-in
CREATE OR REPLACE FUNCTION public.award_points_on_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.checked_in_at IS NOT NULL AND (OLD.checked_in_at IS NULL) THEN
    INSERT INTO public.points_transactions (user_id, type, points, description)
    VALUES (NEW.user_id, 'event_checkin', 25, 'Event check-in');
    UPDATE public.profiles SET total_points = total_points + 25 WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_points_on_checkin ON public.event_registrations;
CREATE TRIGGER trg_award_points_on_checkin
  AFTER UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_on_checkin();

-- Trigger: award points on profile completion (photo + bio)
CREATE OR REPLACE FUNCTION public.award_points_on_profile_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.avatar_url IS NOT NULL AND NEW.bio IS NOT NULL
     AND length(trim(NEW.avatar_url)) > 0 AND length(trim(NEW.bio)) > 0
     AND (OLD.avatar_url IS NULL OR length(trim(OLD.avatar_url)) = 0 OR OLD.bio IS NULL OR length(trim(OLD.bio)) = 0) THEN
    IF NOT EXISTS (SELECT 1 FROM points_transactions WHERE user_id = NEW.user_id AND type = 'profile_complete') THEN
      INSERT INTO public.points_transactions (user_id, type, points, description)
      VALUES (NEW.user_id, 'profile_complete', 25, 'Profile completed (photo + bio)');
      UPDATE public.profiles SET total_points = total_points + 25 WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_points_on_profile_complete ON public.profiles;
CREATE TRIGGER trg_award_points_on_profile_complete
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_on_profile_complete();

-- Trigger: award 100 points to referrer when referred member gets approved
CREATE OR REPLACE FUNCTION public.award_points_on_referral_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.application_status = 'approved' AND OLD.application_status != 'approved' AND NEW.referred_by IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM points_transactions WHERE user_id = NEW.referred_by AND type = 'referral' AND description LIKE '%' || NEW.user_id::text || '%') THEN
      INSERT INTO public.points_transactions (user_id, type, points, description)
      VALUES (NEW.referred_by, 'referral', 100, 'Referral approved: ' || COALESCE(NEW.full_name, NEW.user_id::text));
      UPDATE public.profiles SET total_points = total_points + 100 WHERE user_id = NEW.referred_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_points_on_referral_approved ON public.profiles;
CREATE TRIGGER trg_award_points_on_referral_approved
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_on_referral_approved();

-- Update buyer tier trigger to consider both count and spend thresholds
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
  v_tier_by_count text;
  v_tier_by_spend text;
  v_tier text;
  v_points integer;
BEGIN
  IF TG_OP = 'DELETE' THEN v_user_id := OLD.user_id;
  ELSE v_user_id := NEW.user_id;
  END IF;

  SELECT count(*), COALESCE(sum(amount), 0) INTO v_count, v_total
  FROM public.purchases WHERE user_id = v_user_id AND verification_status = 'verified';

  IF v_count >= 6 THEN v_tier_by_count := 'vip';
  ELSIF v_count >= 3 THEN v_tier_by_count := 'buyer';
  ELSIF v_count >= 1 THEN v_tier_by_count := 'shopper';
  ELSE v_tier_by_count := 'guest';
  END IF;

  IF v_total >= 2000 THEN v_tier_by_spend := 'vip';
  ELSIF v_total >= 500 THEN v_tier_by_spend := 'buyer';
  ELSIF v_total >= 1 THEN v_tier_by_spend := 'shopper';
  ELSE v_tier_by_spend := 'guest';
  END IF;

  v_tier := CASE
    WHEN v_tier_by_count = 'vip' OR v_tier_by_spend = 'vip' THEN 'vip'
    WHEN v_tier_by_count = 'buyer' OR v_tier_by_spend = 'buyer' THEN 'buyer'
    WHEN v_tier_by_count = 'shopper' OR v_tier_by_spend = 'shopper' THEN 'shopper'
    ELSE 'guest'
  END;

  SELECT COALESCE(sum(points), 0) INTO v_points FROM public.points_transactions WHERE user_id = v_user_id;

  UPDATE public.profiles SET buyer_tier = v_tier, total_points = v_points WHERE user_id = v_user_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Notify on event registration status change
CREATE OR REPLACE FUNCTION public.notify_on_event_reg_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_event_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
    SELECT name INTO v_event_name FROM public.events WHERE id = NEW.event_id;
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'Event Confirmed! ✓', 'Your registration for ' || COALESCE(v_event_name, 'an event') || ' has been approved.', 'success');
  ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    SELECT name INTO v_event_name FROM public.events WHERE id = NEW.event_id;
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'Registration Update', 'Your registration for ' || COALESCE(v_event_name, 'an event') || ' was not confirmed this time.', 'info');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_event_reg_status_change ON public.event_registrations;
CREATE TRIGGER trg_notify_on_event_reg_status_change
  AFTER UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_event_reg_status_change();