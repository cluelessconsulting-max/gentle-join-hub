-- Allow all authenticated users to read multiplier settings
CREATE POLICY "Members can read multiplier settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (key IN ('multiplier_active', 'multiplier_ends_at'));