
-- App settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage settings" ON public.app_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.app_settings (key, value) VALUES ('invite_only', '{"enabled": false}'::jsonb) ON CONFLICT DO NOTHING;

-- Invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage invites" ON public.invites FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Anyone can read invites" ON public.invites FOR SELECT TO anon, authenticated USING (true);

-- Profiles: new columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;

-- Referral code generator trigger
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substr(md5(random()::text || NEW.user_id::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Generate referral codes for existing profiles
UPDATE public.profiles SET referral_code = upper(substr(md5(random()::text || user_id::text), 1, 8)) WHERE referral_code IS NULL;

-- Claim invite RPC
CREATE OR REPLACE FUNCTION public.claim_invite(p_code text, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.invites WHERE code = p_code AND used_by IS NULL FOR UPDATE;
  IF v_id IS NULL THEN RETURN false; END IF;
  UPDATE public.invites SET used_by = p_user_id, used_at = now() WHERE id = v_id;
  UPDATE public.profiles SET invite_code = p_code WHERE user_id = p_user_id;
  RETURN true;
END;
$$;

-- Set referral RPC
CREATE OR REPLACE FUNCTION public.set_referral(p_user_id uuid, p_referral_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_referrer_id uuid;
BEGIN
  SELECT user_id INTO v_referrer_id FROM public.profiles WHERE referral_code = p_referral_code;
  IF v_referrer_id IS NOT NULL AND v_referrer_id != p_user_id THEN
    UPDATE public.profiles SET referred_by = v_referrer_id WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Events: add capacity
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS capacity integer;

-- Event registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'confirmed',
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can register" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users or admin can view" ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users can unregister" ON public.event_registrations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can update registrations" ON public.event_registrations FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Admin event management policies
CREATE POLICY "Admin can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin can update events" ON public.events FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin can delete events" ON public.events FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Register for event with capacity check
CREATE OR REPLACE FUNCTION public.register_for_event(p_user_id uuid, p_event_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_capacity integer; v_count integer; v_status text;
BEGIN
  SELECT capacity INTO v_capacity FROM public.events WHERE id = p_event_id;
  SELECT count(*) INTO v_count FROM public.event_registrations WHERE event_id = p_event_id AND status = 'confirmed';
  IF v_capacity IS NOT NULL AND v_count >= v_capacity THEN v_status := 'waitlist'; ELSE v_status := 'confirmed'; END IF;
  INSERT INTO public.event_registrations (user_id, event_id, status) VALUES (p_user_id, p_event_id, v_status) ON CONFLICT (user_id, event_id) DO NOTHING;
  RETURN v_status;
END;
$$;

-- Auto Brevo sync via pg_net
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.auto_sync_brevo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE name_parts text[];
BEGIN
  IF NEW.email IS NOT NULL THEN
    name_parts := string_to_array(COALESCE(NEW.full_name, ''), ' ');
    PERFORM net.http_post(
      url := 'https://wuefwgkeulmgykkmfhdr.supabase.co/functions/v1/sync-brevo',
      body := jsonb_build_object(
        'email', NEW.email,
        'firstName', COALESCE(name_parts[1], ''),
        'lastName', COALESCE(array_to_string(name_parts[2:], ' '), ''),
        'city', COALESCE(NEW.city, ''),
        'age', COALESCE(NEW.age::text, ''),
        'instagram', COALESCE(NEW.instagram, ''),
        'tiktok', COALESCE(NEW.tiktok, ''),
        'phone', COALESCE(NEW.phone, ''),
        'interests', COALESCE(array_to_string(NEW.interests, ', '), ''),
        'shoppingStyle', COALESCE(NEW.shopping_style, ''),
        'eventFrequency', COALESCE(NEW.event_frequency, ''),
        'referral', COALESCE(NEW.referral, ''),
        'howHeard', COALESCE(NEW.how_heard, ''),
        'jobTitle', COALESCE(NEW.job_title, ''),
        'industry', COALESCE(NEW.industry, ''),
        'travelStyle', COALESCE(NEW.travel_style, ''),
        'idealNightOut', COALESCE(NEW.ideal_night_out, ''),
        'favouriteNeighbourhoods', COALESCE(NEW.favourite_neighbourhoods, '')
      ),
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZWZ3Z2tldWxtZ3lra21maGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzYxMDUsImV4cCI6MjA4ODU1MjEwNX0.BebYPN_elqjl6bUBs8iZBbHXmETX96v1gkKV8ujYDqg"}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_sync_brevo ON public.profiles;
CREATE TRIGGER on_profile_sync_brevo AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.auto_sync_brevo();
