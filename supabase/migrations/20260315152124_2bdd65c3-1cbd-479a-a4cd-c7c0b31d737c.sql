
-- =====================================================
-- PART 1: OPERATIONS LIVE
-- =====================================================

-- 1.1 Audit Log
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  performed_by text NOT NULL,
  target_user_id uuid,
  target_user_name text,
  old_value text,
  new_value text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read audit log"
ON public.audit_log FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can insert audit log"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);

-- 1.2 Check-in: add checked_in_at to event_registrations
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

-- 1.3 Waitlist: add waitlist_position to event_registrations
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS waitlist_position integer;

-- 1.4 Scheduled emails
CREATE TABLE public.scheduled_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  send_at timestamptz NOT NULL,
  recipient_filter text NOT NULL DEFAULT 'registered',
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage scheduled emails"
ON public.scheduled_emails FOR ALL TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_scheduled_emails_event_id ON public.scheduled_emails(event_id);
CREATE INDEX idx_scheduled_emails_status ON public.scheduled_emails(status);
CREATE INDEX idx_scheduled_emails_send_at ON public.scheduled_emails(send_at);

-- Waitlist auto-promote function
CREATE OR REPLACE FUNCTION public.promote_waitlist_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next_id uuid;
  v_next_user_id uuid;
BEGIN
  -- Only act on DELETE of confirmed registrations
  IF OLD.status = 'confirmed' THEN
    -- Find the first person on the waitlist for this event
    SELECT id, user_id INTO v_next_id, v_next_user_id
    FROM public.event_registrations
    WHERE event_id = OLD.event_id AND status = 'waitlist'
    ORDER BY waitlist_position ASC NULLS LAST, registered_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_next_id IS NOT NULL THEN
      UPDATE public.event_registrations
      SET status = 'confirmed', waitlist_position = NULL
      WHERE id = v_next_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_waitlist ON public.event_registrations;
CREATE TRIGGER trg_promote_waitlist
  AFTER DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_waitlist_on_cancel();

-- Update register_for_event to set waitlist_position
CREATE OR REPLACE FUNCTION public.register_for_event(p_user_id uuid, p_event_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_capacity integer; v_count integer; v_status text; v_wl_pos integer;
BEGIN
  SELECT capacity INTO v_capacity FROM public.events WHERE id = p_event_id;
  SELECT count(*) INTO v_count FROM public.event_registrations WHERE event_id = p_event_id AND status = 'confirmed';
  IF v_capacity IS NOT NULL AND v_count >= v_capacity THEN
    v_status := 'waitlist';
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_wl_pos
    FROM public.event_registrations WHERE event_id = p_event_id AND status = 'waitlist';
  ELSE
    v_status := 'confirmed';
    v_wl_pos := NULL;
  END IF;
  INSERT INTO public.event_registrations (user_id, event_id, status, waitlist_position)
    VALUES (p_user_id, p_event_id, v_status, v_wl_pos)
    ON CONFLICT (user_id, event_id) DO NOTHING;
  RETURN v_status;
END;
$$ ;

-- Enable realtime for audit_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;
