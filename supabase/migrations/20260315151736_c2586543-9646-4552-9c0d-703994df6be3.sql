
-- Re-grant UPDATE on sensitive columns to authenticated role
-- The trigger protect_sensitive_profile_fields already prevents non-admin changes
-- Column-level REVOKE breaks admin updates via the client SDK
GRANT UPDATE (application_status, buyer_tier, total_points, application_score, admin_notes, referral_code) ON public.profiles TO authenticated;
