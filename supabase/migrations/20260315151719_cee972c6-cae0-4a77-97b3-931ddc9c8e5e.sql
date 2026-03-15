
-- Fix invites: remove public SELECT policies, use only the security definer claim_invite function
DROP POLICY IF EXISTS "Anon can check specific invite code" ON public.invites;
DROP POLICY IF EXISTS "Authenticated can check specific invite code" ON public.invites;

-- Create a security definer function for invite validation (used during signup)
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invites
    WHERE code = upper(p_code) AND used_by IS NULL
  )
$$;

-- Grant execute to anon and authenticated so signup can validate
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO authenticated;

-- Only admin can read invites table directly
-- The "Admin can manage invites" ALL policy already exists

-- Fix app_settings: restrict authenticated to specific keys
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.app_settings;

CREATE POLICY "Authenticated can read safe settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (key IN ('invite_only', 'maintenance_mode'));

-- Revoke UPDATE on sensitive profile columns from authenticated role
-- This adds column-level security on top of the trigger
REVOKE UPDATE (application_status, buyer_tier, total_points, application_score, admin_notes, referral_code) ON public.profiles FROM authenticated;

-- Re-grant these columns to service_role (admin operations via edge functions use this)
GRANT UPDATE (application_status, buyer_tier, total_points, application_score, admin_notes, referral_code) ON public.profiles TO service_role;
