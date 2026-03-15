
-- Drop all existing triggers first, then recreate them all

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;
DROP TRIGGER IF EXISTS trg_calculate_application_score ON public.profiles;
DROP TRIGGER IF EXISTS trg_protect_sensitive_profile_fields ON public.profiles;
DROP TRIGGER IF EXISTS trg_notify_on_approval ON public.profiles;
DROP TRIGGER IF EXISTS trg_award_points_on_profile_complete ON public.profiles;
DROP TRIGGER IF EXISTS trg_award_points_on_referral_approved ON public.profiles;
DROP TRIGGER IF EXISTS trg_auto_sync_brevo ON public.profiles;
DROP TRIGGER IF EXISTS trg_notify_admin_new_user ON public.profiles;
DROP TRIGGER IF EXISTS trg_update_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_update_buyer_tier ON public.purchases;
DROP TRIGGER IF EXISTS trg_award_points_on_purchase_verify ON public.purchases;
DROP TRIGGER IF EXISTS trg_notify_on_registration ON public.event_registrations;
DROP TRIGGER IF EXISTS trg_notify_on_event_reg_status_change ON public.event_registrations;
DROP TRIGGER IF EXISTS trg_award_points_on_checkin ON public.event_registrations;
DROP TRIGGER IF EXISTS trg_promote_waitlist_on_cancel ON public.event_registrations;

-- Also drop any old-named triggers from previous migration attempts
DROP TRIGGER IF EXISTS generate_referral_code ON public.profiles;
DROP TRIGGER IF EXISTS calculate_application_score ON public.profiles;
DROP TRIGGER IF EXISTS protect_sensitive_profile_fields ON public.profiles;
DROP TRIGGER IF EXISTS notify_on_approval ON public.profiles;
DROP TRIGGER IF EXISTS award_points_on_profile_complete ON public.profiles;
DROP TRIGGER IF EXISTS award_points_on_referral_approved ON public.profiles;
DROP TRIGGER IF EXISTS auto_sync_brevo ON public.profiles;
DROP TRIGGER IF EXISTS notify_admin_new_user ON public.profiles;
DROP TRIGGER IF EXISTS update_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_buyer_tier ON public.purchases;
DROP TRIGGER IF EXISTS award_points_on_purchase_verify ON public.purchases;
DROP TRIGGER IF EXISTS notify_on_registration ON public.event_registrations;
DROP TRIGGER IF EXISTS notify_on_event_reg_status_change ON public.event_registrations;
DROP TRIGGER IF EXISTS award_points_on_checkin ON public.event_registrations;
DROP TRIGGER IF EXISTS promote_waitlist_on_cancel ON public.event_registrations;

-- Now create all triggers

CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

CREATE TRIGGER trg_calculate_application_score
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.calculate_application_score();

CREATE TRIGGER trg_protect_sensitive_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profile_fields();

CREATE TRIGGER trg_notify_on_approval
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_approval();

CREATE TRIGGER trg_award_points_on_profile_complete
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_profile_complete();

CREATE TRIGGER trg_award_points_on_referral_approved
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_referral_approved();

CREATE TRIGGER trg_auto_sync_brevo
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_sync_brevo();

CREATE TRIGGER trg_notify_admin_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();

CREATE TRIGGER trg_update_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_buyer_tier
  AFTER INSERT OR UPDATE OR DELETE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_buyer_tier();

CREATE TRIGGER trg_award_points_on_purchase_verify
  AFTER UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_purchase_verify();

CREATE TRIGGER trg_notify_on_registration
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_registration();

CREATE TRIGGER trg_notify_on_event_reg_status_change
  AFTER UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_event_reg_status_change();

CREATE TRIGGER trg_award_points_on_checkin
  AFTER UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_checkin();

CREATE TRIGGER trg_promote_waitlist_on_cancel
  AFTER DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.promote_waitlist_on_cancel();
