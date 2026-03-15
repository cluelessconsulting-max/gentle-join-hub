import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ReferralLeader {
  referral_code: string;
  full_name: string | null;
  count: number;
}

const ReferralLeaderboard = () => {
  const [leaders, setLeaders] = useState<ReferralLeader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Get all profiles with referred_by set
      const { data: profiles } = await supabase
        .from("profiles")
        .select("referred_by");

      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, referral_code");

      if (!profiles || !allProfiles) {
        setLoading(false);
        return;
      }

      // Count referrals per user
      const counts: Record<string, number> = {};
      (profiles as any[]).forEach((p) => {
        if (p.referred_by) {
          counts[p.referred_by] = (counts[p.referred_by] || 0) + 1;
        }
      });

      // Map to names
      const leaderList: ReferralLeader[] = Object.entries(counts)
        .map(([userId, count]) => {
          const prof = (allProfiles as any[]).find((p) => p.user_id === userId);
          return {
            referral_code: prof?.referral_code || "—",
            full_name: prof?.full_name || "Unknown",
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setLeaders(leaderList);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="mb-14">
        <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-4">Referral Leaderboard</p>
        <div className="bg-foreground/5 border border-foreground/10">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-foreground/5 last:border-b-0">
              <div className="bg-foreground/5 animate-pulse w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="bg-foreground/5 animate-pulse h-3 w-28" />
              </div>
              <div className="bg-foreground/5 animate-pulse h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (leaders.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="mb-14">
      <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-4">Referral Leaderboard</p>
      <div className="bg-foreground/5 border border-foreground/10">
        {leaders.map((leader, i) => (
          <div
            key={leader.referral_code}
            className="flex items-center gap-4 px-5 py-3 border-b border-foreground/5 last:border-b-0"
          >
            <span className="text-lg w-8 text-center">
              {i < 3 ? medals[i] : <span className="text-[12px] text-warm-grey">{i + 1}</span>}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] text-foreground">{leader.full_name}</span>
            </div>
            <span className="font-display text-[15px] text-accent">{leader.count}</span>
            <span className="text-[10px] text-warm-grey">referrals</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferralLeaderboard;
