interface Props {
  tier: string;
  totalPoints: number;
  purchaseCount: number;
  totalSpent: number;
}

const tiers = [
  { name: "Guest", minPurchases: 0, minSpend: 0, color: "bg-foreground/30" },
  { name: "Shopper", minPurchases: 1, minSpend: 0, color: "bg-emerald-500" },
  { name: "Buyer", minPurchases: 3, minSpend: 500, color: "bg-blue-500" },
  { name: "VIP", minPurchases: 6, minSpend: 2000, color: "bg-accent" },
];

const TierProgress = ({ tier, totalPoints, purchaseCount, totalSpent }: Props) => {
  const currentIdx = tiers.findIndex((t) => t.name.toLowerCase() === tier.toLowerCase());
  const current = tiers[Math.max(0, currentIdx)];
  const next = currentIdx < tiers.length - 1 ? tiers[currentIdx + 1] : null;
  const isVIP = tier.toLowerCase() === "vip";

  const tierColorClass: Record<string, string> = {
    guest: "text-foreground/50",
    shopper: "text-emerald-400",
    buyer: "text-blue-400",
    vip: "text-accent",
  };

  const tierBgClass: Record<string, string> = {
    guest: "bg-foreground/10",
    shopper: "bg-emerald-500/15",
    buyer: "bg-blue-500/15",
    vip: "bg-accent/15",
  };

  let progressPercent = 100;
  let progressLabel = "";
  if (next) {
    const purchasesNeeded = next.minPurchases - purchaseCount;
    const spendNeeded = next.minSpend - totalSpent;
    const purchaseProgress = Math.min(1, purchaseCount / next.minPurchases);
    const spendProgress = next.minSpend > 0 ? Math.min(1, totalSpent / next.minSpend) : 1;
    progressPercent = Math.max(purchaseProgress, spendProgress) * 100;

    if (purchasesNeeded > 0 && (spendNeeded <= 0 || purchasesNeeded <= spendNeeded / 100)) {
      progressLabel = `${purchasesNeeded} more purchase${purchasesNeeded > 1 ? "s" : ""} to reach ${next.name}`;
    } else if (spendNeeded > 0) {
      progressLabel = `£${Math.ceil(spendNeeded)} more to reach ${next.name}`;
    }
  }

  return (
    <div className={`mb-14 border border-foreground/10 p-6 md:p-8 ${isVIP ? "border-accent/30 shadow-[0_0_30px_-10px_hsl(var(--accent)/0.15)]" : "bg-foreground/5"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-2">Your Tier</p>
          <div className="flex items-center gap-3">
            <span className={`font-display text-[24px] capitalize ${tierColorClass[tier.toLowerCase()] || "text-foreground"}`}>
              {tier}
            </span>
            <span className={`text-[9px] tracking-wide-lg uppercase px-3 py-1 rounded-full font-semibold ${tierBgClass[tier.toLowerCase()] || "bg-foreground/10"} ${tierColorClass[tier.toLowerCase()] || "text-foreground"}`}>
              {tier}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-[28px] text-accent">{totalPoints}</p>
          <p className="text-[10px] tracking-wide-lg uppercase text-warm-grey">Points</p>
        </div>
      </div>

      {isVIP ? (
        <p className="text-[12px] text-accent/80 italic">
          You have reached our highest tier. Thank you for being an Offlist VIP.
        </p>
      ) : next ? (
        <>
          <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${current.color}`}
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
          <p className="text-[11px] text-warm-grey">{progressLabel}</p>
        </>
      ) : null}

      {/* Tier cards */}
      <div className="grid grid-cols-4 gap-2 mt-6">
        {tiers.map((t, i) => {
          const isActive = t.name.toLowerCase() === tier.toLowerCase();
          const isLocked = i > currentIdx;
          return (
            <div
              key={t.name}
              className={`p-3 border text-center transition-all ${
                isActive
                  ? `border-accent/40 ${tierBgClass[t.name.toLowerCase()]}`
                  : isLocked
                  ? "border-foreground/5 opacity-40"
                  : "border-foreground/10"
              }`}
            >
              <p className={`text-[10px] tracking-wide uppercase font-semibold mb-1 ${isActive ? tierColorClass[t.name.toLowerCase()] : "text-foreground/50"}`}>
                {isLocked ? "🔒 " : ""}{t.name}
              </p>
              <p className="text-[9px] text-warm-grey">
                {t.minPurchases === 0 ? "Start" : `${t.minPurchases}+ purchases`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TierProgress;
