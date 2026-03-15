import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  profileName: string | null;
  tier: string;
  totalPoints: number;
  purchaseCount: number;
  totalSpent: number;
  referralCode: string | null;
}

const tierConfig: Record<string, { label: string; gradient: string; text: string; glow: string }> = {
  guest: { label: "GUEST", gradient: "from-slate-600 to-slate-500", text: "text-slate-300", glow: "" },
  shopper: { label: "SHOPPER", gradient: "from-emerald-600 to-emerald-400", text: "text-emerald-300", glow: "shadow-[0_0_20px_-5px_rgba(52,211,153,0.4)]" },
  buyer: { label: "BUYER", gradient: "from-blue-600 to-blue-400", text: "text-blue-300", glow: "shadow-[0_0_20px_-5px_rgba(96,165,250,0.4)]" },
  vip: { label: "VIP", gradient: "from-amber-500 to-yellow-300", text: "text-amber-300", glow: "shadow-[0_0_30px_-5px_rgba(251,191,36,0.5)]" },
};

const tiers = ["guest", "shopper", "buyer", "vip"];
const tierThresholds = [
  { purchases: 0, spend: 0 },
  { purchases: 1, spend: 1 },
  { purchases: 3, spend: 500 },
  { purchases: 6, spend: 2000 },
];

const DashboardHero = ({ profileName, tier, totalPoints, purchaseCount, totalSpent, referralCode }: Props) => {
  const config = tierConfig[tier.toLowerCase()] || tierConfig.guest;
  const isVIP = tier.toLowerCase() === "vip";
  const currentIdx = tiers.indexOf(tier.toLowerCase());
  const nextIdx = currentIdx < 3 ? currentIdx + 1 : 3;
  const next = tierThresholds[nextIdx];

  const [multiplierActive, setMultiplierActive] = useState(false);
  const [multiplierEnds, setMultiplierEnds] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const [{ data: activeData }, { data: endsData }] = await Promise.all([
        supabase.from("app_settings").select("value").eq("key", "multiplier_active").single(),
        supabase.from("app_settings").select("value").eq("key", "multiplier_ends_at").single(),
      ]);
      const active = (activeData as any)?.value === true || (activeData as any)?.value === "true";
      const ends = (endsData as any)?.value;
      if (active && ends && new Date(ends) > new Date()) {
        setMultiplierActive(true);
        setMultiplierEnds(ends);
      }
    };
    check();
  }, []);

  let progressPercent = 100;
  let progressLabel = "";
  if (!isVIP) {
    const purchasesNeeded = next.purchases - purchaseCount;
    const spendNeeded = next.spend - totalSpent;
    const pProgress = next.purchases > 0 ? Math.min(1, purchaseCount / next.purchases) : 1;
    const sProgress = next.spend > 0 ? Math.min(1, totalSpent / next.spend) : 1;
    progressPercent = Math.max(pProgress, sProgress) * 100;
    if (purchasesNeeded > 0 && (spendNeeded <= 0 || purchasesNeeded <= spendNeeded / 100)) {
      progressLabel = `${purchasesNeeded} more purchase${purchasesNeeded > 1 ? "s" : ""} to reach ${tiers[nextIdx].charAt(0).toUpperCase() + tiers[nextIdx].slice(1)}`;
    } else if (spendNeeded > 0) {
      progressLabel = `£${Math.ceil(spendNeeded)} more to reach ${tiers[nextIdx].charAt(0).toUpperCase() + tiers[nextIdx].slice(1)}`;
    }
  }

  const firstName = profileName
    ? profileName.split(" ")[0].charAt(0).toUpperCase() + profileName.split(" ")[0].slice(1).toLowerCase()
    : "";

  return (
    <div className={`relative overflow-hidden ${isVIP ? "ring-1 ring-amber-400/30" : ""}`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]" />
      {isVIP && (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(251,191,36,0.05)_50%,transparent_60%)] animate-pulse" />
      )}

      {multiplierActive && (
        <div className="relative z-10 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-b border-amber-500/30 px-6 py-2.5 text-center">
          <span className="text-[12px] text-amber-300 tracking-wide">
            🌟 Double Points Weekend — earn 2x points
            {multiplierEnds && ` until ${new Date(multiplierEnds).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`}
          </span>
        </div>
      )}

      <div className="relative z-10 px-6 md:px-12 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="flex-1">
            <p className="text-[10px] tracking-[0.3em] uppercase text-amber-400/70 mb-4 font-light">Member Dashboard</p>
            <h1 className="font-display text-[clamp(32px,5vw,56px)] font-light leading-[1.1] text-white mb-6" style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}>
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h1>

            {/* Tier Badge */}
            <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r ${config.gradient} ${config.glow} mb-6`}>
              <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-white">
                {config.label}
              </span>
              {isVIP && <span className="text-lg animate-pulse">✦</span>}
            </div>

            {/* Progress */}
            {!isVIP && (
              <div className="max-w-md mt-2">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-1000`}
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">{progressLabel}</p>
              </div>
            )}
            {isVIP && (
              <p className="text-[12px] text-amber-400/60 italic mt-2">
                You have reached our highest tier. Thank you for being an Offlist VIP.
              </p>
            )}
          </div>

          {/* Right side: Points + Code */}
          <div className="flex flex-col items-end gap-5">
            <div className="text-right">
              <p className="text-[42px] font-bold text-white leading-none font-display">{totalPoints}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 mt-1">Points</p>
            </div>

            {referralCode && (
              <div className="bg-white/5 border border-white/10 px-5 py-3 flex items-center gap-3 backdrop-blur-sm">
                <span className="text-[10px] tracking-[0.2em] uppercase text-slate-500">Code</span>
                <span className="font-mono text-[15px] tracking-wider text-amber-400">{referralCode}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(referralCode); toast.success("Code copied!"); }}
                  className="text-[10px] text-slate-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                >
                  Copy
                </button>
              </div>
            )}

            <div className="flex gap-6 text-right">
              <div>
                <p className="text-[18px] font-semibold text-white">{purchaseCount}</p>
                <p className="text-[9px] tracking-[0.2em] uppercase text-slate-500">Purchases</p>
              </div>
              <div>
                <p className="text-[18px] font-semibold text-white">£{totalSpent.toFixed(0)}</p>
                <p className="text-[9px] tracking-[0.2em] uppercase text-slate-500">Total Spent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;
