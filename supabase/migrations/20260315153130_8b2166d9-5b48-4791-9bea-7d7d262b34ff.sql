
-- Notifications table for in-app notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read) WHERE read = false;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE OR REPLACE FUNCTION public.notify_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.application_status != 'approved' AND NEW.application_status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'Application Approved! 🎉', 'Welcome to Offlist. You can now browse and register for exclusive events.', 'success');
  END IF;
  IF OLD.application_status != 'rejected' AND NEW.application_status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'Application Update', 'Your application was not approved at this time.', 'info');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_approval
  AFTER UPDATE OF application_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_approval();

CREATE OR REPLACE FUNCTION public.notify_on_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE v_event_name text;
BEGIN
  SELECT name INTO v_event_name FROM public.events WHERE id = NEW.event_id;
  IF NEW.status = 'confirmed' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'You''re on the list! ✓', 'You''ve been confirmed for ' || COALESCE(v_event_name, 'an event') || '.', 'success');
  ELSIF NEW.status = 'waitlist' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'Waitlisted', 'You''ve been added to the waitlist for ' || COALESCE(v_event_name, 'an event') || '. We''ll notify you if a spot opens up.', 'info');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_registration
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_registration();
