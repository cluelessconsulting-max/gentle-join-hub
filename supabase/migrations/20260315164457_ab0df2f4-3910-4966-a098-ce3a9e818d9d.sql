-- Remove duplicate triggers, keep only the original ones
DROP TRIGGER IF EXISTS trg_update_buyer_tier ON public.purchases;
DROP TRIGGER IF EXISTS trg_award_points_on_purchase_verify ON public.purchases;