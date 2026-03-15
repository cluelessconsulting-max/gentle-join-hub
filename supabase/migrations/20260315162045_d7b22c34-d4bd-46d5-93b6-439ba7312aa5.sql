
-- Attach all trigger functions that are missing triggers

-- 1. Profile triggers
CREATE TRIGGER on_profile_insert_generate_referral
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

CREATE TRIGGER on_profile_insert_or_update_score
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.calculate_application_score();

CREATE TRIGGER on_profile_update_protect_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profile_fields();

CREATE TRIGGER on_profile_update_notify_approval
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_approval();

CREATE TRIGGER on_profile_update_brevo_sync
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_sync_brevo();

CREATE TRIGGER on_profile_update_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();

CREATE TRIGGER on_profile_update_award_complete
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_profile_complete();

CREATE TRIGGER on_profile_update_referral_points
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_referral_approved();

CREATE TRIGGER on_profile_update_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Purchases triggers
CREATE TRIGGER on_purchase_update_tier
  AFTER INSERT OR UPDATE OR DELETE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_buyer_tier();

CREATE TRIGGER on_purchase_verify_award_points
  AFTER UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_purchase_verify();

-- 3. Event registration triggers
CREATE TRIGGER on_event_reg_insert_notify
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_registration();

CREATE TRIGGER on_event_reg_delete_promote_waitlist
  AFTER DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.promote_waitlist_on_cancel();

CREATE TRIGGER on_event_reg_update_status_notify
  AFTER UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_event_reg_status_change();

CREATE TRIGGER on_event_reg_checkin_points
  AFTER UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_checkin();
