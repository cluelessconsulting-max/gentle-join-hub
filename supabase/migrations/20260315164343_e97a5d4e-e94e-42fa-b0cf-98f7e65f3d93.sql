DROP TRIGGER IF EXISTS on_profile_sync_brevo ON public.profiles;

CREATE TRIGGER on_profile_sync_brevo
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_sync_brevo();