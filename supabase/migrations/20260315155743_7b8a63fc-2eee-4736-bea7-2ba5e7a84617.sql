
-- Update register_for_event to set status='pending' instead of 'confirmed'
CREATE OR REPLACE FUNCTION public.register_for_event(p_user_id uuid, p_event_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_capacity integer; v_count integer; v_status text; v_wl_pos integer;
BEGIN
  SELECT capacity INTO v_capacity FROM public.events WHERE id = p_event_id;
  SELECT count(*) INTO v_count FROM public.event_registrations WHERE event_id = p_event_id AND status IN ('confirmed', 'pending');
  IF v_capacity IS NOT NULL AND v_count >= v_capacity THEN
    v_status := 'waitlist';
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_wl_pos
    FROM public.event_registrations WHERE event_id = p_event_id AND status = 'waitlist';
  ELSE
    v_status := 'pending';
    v_wl_pos := NULL;
  END IF;
  INSERT INTO public.event_registrations (user_id, event_id, status, waitlist_position)
    VALUES (p_user_id, p_event_id, v_status, v_wl_pos)
    ON CONFLICT (user_id, event_id) DO NOTHING;
  RETURN v_status;
END;
$function$;

-- Create collaboration_requests table
CREATE TABLE public.collaboration_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  portfolio_url TEXT,
  message TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending'
);

ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a collaboration request
CREATE POLICY "Anyone can submit collab request"
  ON public.collaboration_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admin can view all collaboration requests
CREATE POLICY "Admin can manage collab requests"
  ON public.collaboration_requests FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
