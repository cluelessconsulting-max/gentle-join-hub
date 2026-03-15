import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  tier: string;
  totalPoints: number;
  purchaseCount: number;
  totalSpent: number;
}

interface PointsTransaction {
  id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
}

interface DiscountCode {
  id: string;
  code: string;
  is_active: boolean;
}

const tierPerks: Record<string, string[]> = {
  guest: ["Access to public events", "Basic member profile", "Event notifications"],
  shopper: ["All Guest perks", "Priority event access", "Exclusive discount codes", "Referral bonus: +100 pts"],
  buyer: ["All Shopper perks", "VIP event invitations", "Early access to drops", "Personal shopping assistance"],
  vip: ["All Buyer perks", "Complimentary event access", "Private sales & previews", "Dedicated concierge", "Gold member badge"],
};

const tierOrder = ["guest", "shopper", "buyer", "vip"];
const tierLabels: Record<string, string> = { guest: "Guest", shopper: "Shopper", buyer: "Buyer", vip: "VIP" };
const tierMinPurchases = [0, 1, 3, 6];
const tierColors: Record<string, { border: string; bg: string; text: string }> = {
  guest: { border: "border-slate-600/30", bg: "bg-slate-900/20", text: "text-slate-400" },
  shopper: { border: "border-emerald-500/30", bg: "bg-emerald-950/20", text: "text-emerald-400" },
  buyer: { border: "border-blue-500/30", bg: "bg-blue-950/20", text: "text-blue-400" },
  vip: { border: "border-amber-400/30", bg: "bg-amber-950/20", text: "text-amber-400" },
};

const LoyaltySection = ({ userId, tier, totalPoints, purchaseCount, totalSpent }: Props) => {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);

  const currentIdx = tierOrder.indexOf(tier.toLowerCase());

  useEffect(() => {
    const fetch = async () => {
      const [{ data: txData }, { data: codesData }] = await Promise.all([
        supabase.from("points_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("discount_codes").select("*").eq("user_id", userId),
      ]);
      setTransactions((txData as any) || []);
      setCodes((codesData as any) || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  // Progress ring calculations
  const nextIdx = currentIdx < 3 ? currentIdx + 1 : 3;
  const nextPurchases = tierMinPurchases[nextIdx];
  const pPercent = currentIdx >= 3 ? 100 : Math.min(100, (purchaseCount / nextPurchases) * 100);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pPercent / 100) * circumference;

  return (
    <div className="mb-14">
      <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-6">Loyalty & Rewards</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Progress Ring */}
        <div className="bg-foreground/5 border border-foreground/10 p-8 flex flex-col items-center justify-center">
          <div className="relative w-[160px] h-[160px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="8" />
              <circle
                cx="70" cy="70" r={radius} fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-[28px] text-foreground">{totalPoints}</span>
              <span className="text-[9px] tracking-[0.2em] uppercase text-warm-grey">Points</span>
            </div>
          </div>
          <p className="text-[11px] text-warm-grey mt-4 text-center">
            {currentIdx >= 3 ? "Maximum tier reached" : `${Math.round(pPercent)}% to ${tierLabels[tierOrder[nextIdx]]}`}
          </p>
        </div>

        {/* Tier Perks Grid */}
        <div className="grid grid-cols-2 gap-2">
          {tierOrder.map((t, i) => {
            const isActive = t === tier.toLowerCase();
            const isLocked = i > currentIdx;
            const c = tierColors[t];
            const awayCount = isLocked ? tierMinPurchases[i] - purchaseCount : 0;
            return (
              <div
                key={t}
                className={`p-4 border transition-all ${c.border} ${isActive ? `${c.bg} ring-1 ring-inset ${c.border}` : isLocked ? "opacity-50" : c.bg}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isLocked && <span className="text-[12px]">🔒</span>}
                  <span className={`text-[11px] tracking-[0.15em] uppercase font-semibold ${c.text}`}>{tierLabels[t]}</span>
                </div>
                <ul className="space-y-1">
                  {(tierPerks[t] || []).slice(0, 3).map((perk, pi) => (
                    <li key={pi} className="text-[10px] text-warm-grey flex items-start gap-1.5">
                      <span className={isLocked ? "text-foreground/20" : c.text}>•</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                {isLocked && awayCount > 0 && (
                  <p className="text-[9px] text-foreground/30 mt-2">{awayCount} purchase{awayCount > 1 ? "s" : ""} away</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Discount Codes */}
      {codes.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-3">Your Discount Codes</p>
          <div className="flex flex-wrap gap-2">
            {codes.map(c => (
              <div key={c.id} className="bg-foreground/5 border border-foreground/10 px-4 py-2.5 flex items-center gap-3">
                <span className="font-mono text-[13px] text-accent">{c.code}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied!"); }}
                  className="text-[10px] text-warm-grey hover:text-foreground bg-transparent border-none cursor-pointer transition-colors"
                >
                  Copy
                </button>
                {!c.is_active && <span className="text-[9px] px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/40">Used</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points History */}
      <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-3">Points History</p>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="bg-foreground/5 h-12 animate-pulse" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-foreground/5 border border-foreground/10 p-8 text-center">
          <p className="text-[13px] text-warm-grey">No points earned yet.</p>
          <p className="text-[11px] text-foreground/30 mt-1">Make your first purchase to start earning points.</p>
        </div>
      ) : (
        <div className="border border-foreground/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-foreground/5">
                {["Date", "Description", "Points"].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-[0.2em] uppercase text-warm-grey p-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-t border-foreground/5">
                  <td className="p-3 text-[12px] text-warm-grey">{new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                  <td className="p-3 text-[12px] text-foreground">{tx.description || tx.type}</td>
                  <td className="p-3 text-[12px] text-accent font-semibold">+{tx.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LoyaltySection;
