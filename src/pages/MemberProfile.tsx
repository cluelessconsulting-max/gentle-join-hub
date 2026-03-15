import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PublicProfile {
  full_name: string | null;
  city: string | null;
  instagram: string | null;
  tiktok: string | null;
  interests: string[] | null;
  buyer_tier: string;
  membership_type: string;
  referral_code: string | null;
  avatar_url: string | null;
  industry: string | null;
  total_points: number;
}

const interestIcons: Record<string, string> = {
  "Fashion & Style": "✦",
  "Music & Nightlife": "♪",
  "Art & Design": "◈",
  "Gastronomy & Social Dining": "◉",
  "Fitness & Wellness": "◎",
  "Travel & Culture": "✧",
  "Luxury & Lifestyle": "◆",
};

const tierConfig: Record<string, { label: string; color: string }> = {
  guest: { label: "Guest", color: "text-warm-grey" },
  shopper: { label: "Shopper", color: "text-accent" },
  buyer: { label: "Buyer", color: "text-accent" },
  vip: { label: "VIP", color: "text-amber-500" },
};

const membershipConfig: Record<string, { label: string; color: string }> = {
  free: { label: "Member", color: "border-foreground/15 text-foreground/60" },
  premium: { label: "Premium", color: "border-purple-400/30 text-purple-400" },
  vip: { label: "VIP", color: "border-amber-400/30 text-amber-400" },
};

const MemberProfile = () => {
  const { code } = useParams<{ code: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!code) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, city, instagram, tiktok, interests, buyer_tier, membership_type, referral_code, avatar_url, industry, total_points")
        .eq("referral_code", code.toUpperCase())
        .eq("application_status", "approved")
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as any as PublicProfile);
      }
      setLoading(false);
    };
    fetch();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-display text-2xl text-foreground/40 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="flex justify-between items-center px-6 md:px-12 py-7">
          <Link to="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">Offlist</Link>
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-[42px] font-light mb-4">Member not found</h1>
            <p className="text-[13px] text-warm-grey mb-8">This profile doesn't exist or is not public.</p>
            <Link to="/" className="bg-primary text-primary-foreground text-[10px] tracking-wide-lg uppercase px-7 py-3 no-underline transition-all hover:bg-accent">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const firstName = profile.full_name?.split(" ")[0] || "";
  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
  const tier = tierConfig[profile.buyer_tier] || tierConfig.guest;
  const membership = membershipConfig[profile.membership_type] || membershipConfig.free;

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex justify-between items-center px-6 md:px-12 py-7">
        <Link to="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">Offlist</Link>
        <Link to="/apply" className="text-[10px] tracking-wide-lg uppercase bg-primary text-primary-foreground px-5 py-2 no-underline transition-all hover:bg-accent">
          Apply
        </Link>
      </nav>

      <section className="px-6 md:px-12 py-16 max-w-xl mx-auto">
        {/* Avatar */}
        <div className="flex justify-center mb-8">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || "Member"}
              className="w-24 h-24 rounded-full object-cover border-2 border-foreground/10"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center">
              <span className="font-display text-[28px] text-foreground/40">{initials}</span>
            </div>
          )}
        </div>

        {/* Name & Badges */}
        <div className="text-center mb-8">
          <h1 className="font-display text-[38px] font-light mb-3">{profile.full_name || "Member"}</h1>

          <div className="flex justify-center gap-2 flex-wrap mb-4">
            <span className={`text-[10px] tracking-wide-md uppercase border px-3 py-1 ${membership.color}`}>
              {membership.label}
            </span>
            <span className={`text-[10px] tracking-wide-md uppercase ${tier.color}`}>
              {tier.label}
            </span>
            {profile.total_points > 0 && (
              <span className="text-[10px] tracking-wide-md text-accent">
                {profile.total_points} pts
              </span>
            )}
          </div>

          {(profile.city || profile.industry) && (
            <p className="text-[12px] text-warm-grey">
              {[profile.city, profile.industry].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* Interests */}
        {(profile.interests || []).length > 0 && (
          <div className="mb-10">
            <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-4 text-center">Interests</p>
            <div className="flex justify-center flex-wrap gap-2">
              {profile.interests!.map((interest) => (
                <span
                  key={interest}
                  className="bg-foreground/5 border border-foreground/10 px-4 py-2 text-[11px] text-foreground/80 tracking-wide flex items-center gap-2"
                >
                  <span className="text-accent">{interestIcons[interest] || "·"}</span>
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {(profile.instagram || profile.tiktok) && (
          <div className="flex justify-center gap-4 mb-10">
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground text-[10px] tracking-wide-lg uppercase px-6 py-3 no-underline transition-all hover:bg-accent hover:-translate-y-0.5"
              >
                Instagram
              </a>
            )}
            {profile.tiktok && (
              <a
                href={`https://tiktok.com/@${profile.tiktok.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground text-[10px] tracking-wide-lg uppercase px-6 py-3 no-underline transition-all hover:bg-accent hover:-translate-y-0.5"
              >
                TikTok
              </a>
            )}
          </div>
        )}

        {/* Referral Code */}
        {profile.referral_code && (
          <div className="text-center">
            <div className="bg-foreground/5 border border-foreground/10 px-6 py-4 inline-block">
              <p className="text-[10px] tracking-wide-xl uppercase text-warm-grey mb-1">Referral Code</p>
              <p className="font-display text-[18px] tracking-wider text-accent">{profile.referral_code}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default MemberProfile;
