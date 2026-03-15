
-- Update auto_sync_brevo trigger to send ALL attributes
CREATE OR REPLACE FUNCTION public.auto_sync_brevo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE name_parts text[];
BEGIN
  IF NEW.email IS NOT NULL THEN
    name_parts := string_to_array(COALESCE(NEW.full_name, ''), ' ');
    PERFORM net.http_post(
      url := 'https://wuefwgkeulmgykkmfhdr.supabase.co/functions/v1/sync-brevo',
      body := jsonb_build_object(
        'email', NEW.email,
        'fullName', COALESCE(NEW.full_name, ''),
        'firstName', COALESCE(name_parts[1], ''),
        'lastName', COALESCE(array_to_string(name_parts[2:], ' '), ''),
        'age', COALESCE(NEW.age::text, ''),
        'instagram', COALESCE(NEW.instagram, ''),
        'tiktok', COALESCE(NEW.tiktok, ''),
        'phone', COALESCE(NEW.phone, ''),
        'city', COALESCE(NEW.city, ''),
        'interests', COALESCE(array_to_string(NEW.interests, ', '), ''),
        'shoppingStyle', COALESCE(NEW.shopping_style, ''),
        'eventFrequency', COALESCE(NEW.event_frequency, ''),
        'referral', COALESCE(NEW.referral, ''),
        'howHeard', COALESCE(NEW.how_heard, ''),
        'applicationStatus', COALESCE(NEW.application_status, ''),
        'jobTitle', COALESCE(NEW.job_title, ''),
        'industry', COALESCE(NEW.industry, ''),
        'travelStyle', COALESCE(NEW.travel_style, ''),
        'idealNightOut', COALESCE(NEW.ideal_night_out, ''),
        'favouriteNeighbourhoods', COALESCE(NEW.favourite_neighbourhoods, ''),
        'inviteCode', COALESCE(NEW.invite_code, ''),
        'referralCode', COALESCE(NEW.referral_code, ''),
        'referredBy', COALESCE(NEW.referred_by::text, ''),
        'buyerTier', COALESCE(NEW.buyer_tier, ''),
        'totalPoints', COALESCE(NEW.total_points::text, '')
      ),
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1ZWZ3Z2tldWxtZ3lra21maGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzYxMDUsImV4cCI6MjA4ODU1MjEwNX0.BebYPN_elqjl6bUBs8iZBbHXmETX96v1gkKV8ujYDqg"}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;
