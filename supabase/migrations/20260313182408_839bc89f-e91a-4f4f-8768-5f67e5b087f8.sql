CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://wuefwgkeulmgykkmfhdr.supabase.co/functions/v1/notify-new-user',
    body := jsonb_build_object(
      'email', NEW.email,
      'full_name', COALESCE(NEW.full_name, '')
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();