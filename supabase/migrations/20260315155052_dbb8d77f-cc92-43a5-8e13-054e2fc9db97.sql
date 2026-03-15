
-- Allow public read of limited profile fields for public profiles
CREATE POLICY "Public can view basic profile by referral_code"
  ON public.profiles FOR SELECT
  TO anon
  USING (application_status = 'approved' AND referral_code IS NOT NULL);
