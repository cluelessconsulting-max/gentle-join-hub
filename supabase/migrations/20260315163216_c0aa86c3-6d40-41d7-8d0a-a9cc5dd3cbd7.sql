
CREATE OR REPLACE FUNCTION public.award_points_on_purchase_verify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_points integer;
  v_multiplier boolean;
  v_ends_at timestamptz;
BEGIN
  IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
    -- Prevent duplicate: check if points already awarded for this purchase
    IF EXISTS (SELECT 1 FROM points_transactions WHERE user_id = NEW.user_id AND type = 'purchase' AND description LIKE '%' || NEW.id::text || '%') THEN
      RETURN NEW;
    END IF;

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
    VALUES (NEW.user_id, 'purchase', v_points, 'Purchase verified: ' || NEW.brand_name || ' (£' || NEW.amount || ') [' || NEW.id || ']');
    
    UPDATE public.profiles SET total_points = total_points + v_points WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;
