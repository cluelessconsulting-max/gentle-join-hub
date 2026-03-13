
-- Add new profile fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS tiktok text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shopping_style text,
  ADD COLUMN IF NOT EXISTS event_frequency text,
  ADD COLUMN IF NOT EXISTS referral text,
  ADD COLUMN IF NOT EXISTS how_heard text,
  ADD COLUMN IF NOT EXISTS application_status text NOT NULL DEFAULT 'pending';

-- Allow admins (via service role) to read all profiles - needed for admin page
-- We'll use an edge function with service role for admin access
