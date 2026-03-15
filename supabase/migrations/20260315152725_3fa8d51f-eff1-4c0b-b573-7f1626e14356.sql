
-- Brand partners table
CREATE TABLE public.brand_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  contact_email text NOT NULL,
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage brand partners" ON public.brand_partners
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public can read active brands by slug" ON public.brand_partners
  FOR SELECT TO anon, authenticated
  USING (active = true);

-- Add membership_type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_type text NOT NULL DEFAULT 'free';

-- Add price fields to events for future Stripe
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0;

-- Add payment fields to event_registrations
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'free';
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS stripe_payment_id text;
