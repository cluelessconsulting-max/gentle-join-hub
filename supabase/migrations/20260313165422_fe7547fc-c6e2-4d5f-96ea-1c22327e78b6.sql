
-- Update referral code format to OFFLIST-XXX-XXXX
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  name_part text;
  random_part text;
BEGIN
  IF NEW.referral_code IS NULL THEN
    name_part := upper(substr(regexp_replace(COALESCE(NEW.full_name, 'USR'), '[^a-zA-Z]', '', 'g'), 1, 3));
    IF length(name_part) < 3 THEN
      name_part := rpad(name_part, 3, 'X');
    END IF;
    random_part := upper(substr(md5(random()::text), 1, 4));
    NEW.referral_code := 'OFFLIST-' || name_part || '-' || random_part;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage discount codes" ON public.discount_codes
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own codes" ON public.discount_codes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  discount_code_id uuid REFERENCES public.discount_codes(id),
  brand_name text NOT NULL,
  amount numeric(10,2) NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage purchases" ON public.purchases
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
