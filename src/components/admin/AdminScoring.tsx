import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  buyer_tier: string;
  total_points: number;
  created_at: string;
  updated_at: string;
}

interface Purchase {
  user_id: string;
  amount: number;
}

interface EventReg {
  user_id: string;
  status: string;
}

const COLORS = { guest: "#64748b", shopper: "#34d399", buyer: "#60a5fa", vip: "#fbbf24" };
const tierOrder = ["guest", "shopper", "buyer", "vip"];
const tierBg: Record<string, string> = {
  vip: "bg-amber-950/30",
  buyer: "bg-blue-950/20",
  shopper: "bg-emerald-950/20",
  guest: "",
};

const AdminScoring = ({ profiles: allProfiles, onSelectProfile }: { profiles: any[]; onSelectProfile: (p: any) => void }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [eventRegs, setEventRegs] = useState<EventReg[]>([]);
  const [referralCounts, setReferralCounts] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<"points" | "spend" | "engagement">("points");
  const [multiplierActive, setMultiplierActive] = useState(false);
  const [multiplierEnds, setMultiplierEnds] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: pData }, { data: eData }, { data: refData }, { data: multActive }, { data: multEnds }] = await Promise.all([
        supabase.from("purchases" as any).select("user_id, amount"),
        supabase.from("event_registrations" as any).select("user_id, status"),
        supabase.from("profiles").select("referred_by"),
        supabase.from("app_settings").select("value").eq("key", "multiplier_active").single(),
        supabase.from("app_settings").select("value").eq("key", "multiplier_ends_at").single(),
      ]);
      setPurchases((pData as any) || []);
      setEventRegs((eData as any) || []);

      const counts: Record<string, number> = {};
      ((refData as any) || []).forEach((p: any) => {
        if (p.referred_by) counts[p.referred_by] = (counts[p.referred_by] || 0) + 1;
      });
      setReferralCounts(counts);

      const active = (multActive as any)?.value === true || (multActive as any)?.value === "true";
      setMultiplierActive(active);
      const ends = (multEnds as any)?.value;
      if (ends && ends !== "null") setMultiplierEnds(typeof ends === "string" ? ends : "");

      setLoading(false);
    };
    fetch();
  }, []);

  const getUserStats = (userId: string) => {
    const userPurchases = purchases.filter(p => p.user_id === userId);
    const spent = userPurchases.reduce((s, p) => s + Number(p.amount), 0);
    const events = eventRegs.filter(e => e.user_id === userId && e.status === "confirmed").length;
    const referrals = referralCounts[userId] || 0;
    return { purchaseCount: userPurchases.length, spent, events, referrals };
  };

  const sortedProfiles = [...allProfiles].sort((a, b) => {
    const sa = getUserStats(a.user_id);
    const sb = getUserStats(b.user_id);
    if (sortBy === "points") return b.total_points - a.total_points;
    if (sortBy === "spend") return sb.spent - sa.spent;
    return (sb.events + sb.referrals) - (sa.events + sa.referrals);
  });

  // Tier distribution for charts
  const tierDistribution = tierOrder.map(t => ({
    name: t.charAt(0).toUpperCase() + t.slice(1),
    count: allProfiles.filter((p: any) => (p.buyer_tier || "guest") === t).length,
    color: COLORS[t as keyof typeof COLORS],
  }));

  // Revenue by tier
  const revByTier = tierOrder.map(t => {
    const userIds = allProfiles.filter((p: any) => (p.buyer_tier || "guest") === t).map((p: any) => p.user_id);
    const rev = purchases.filter(p => userIds.includes(p.user_id)).reduce((s, p) => s + Number(p.amount), 0);
    return { name: t.charAt(0).toUpperCase() + t.slice(1), value: Math.round(rev), color: COLORS[t as keyof typeof COLORS] };
  }).filter(r => r.value > 0);

  // At-risk members: buyer or VIP with no purchase in 60+ days
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const atRiskMembers = allProfiles.filter((p: any) => {
    if (!["buyer", "vip"].includes(p.buyer_tier)) return false;
    const lastActive = new Date(p.updated_at || p.created_at).getTime();
    return lastActive < sixtyDaysAgo;
  });

  const toggleMultiplier = async () => {
    const newActive = !multiplierActive;
    let endsAt = multiplierEnds;
    if (newActive && !endsAt) {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      endsAt = d.toISOString();
    }
    await Promise.all([
      supabase.from("app_settings").update({ value: newActive as any } as any).eq("key", "multiplier_active"),
      supabase.from("app_settings").update({ value: endsAt as any } as any).eq("key", "multiplier_ends_at"),
    ]);
    setMultiplierActive(newActive);
    setMultiplierEnds(endsAt);
    toast.success(newActive ? "Double points activated!" : "Multiplier deactivated");
  };

  if (loading) return <p className="text-slate-500 animate-pulse">Loading…</p>;

  return (
    <div>
      <h3 className="text-lg font-bold tracking-wider text-slate-50 mb-5">Member Intelligence</h3>

      {/* Points Multiplier */}
      <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5 mb-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-200 font-semibold">🌟 Double Points Weekend</p>
            <p className="text-[11px] text-slate-500 mt-1">When active, all purchase points are doubled</p>
          </div>
          <div className="flex items-center gap-4">
            {multiplierActive && (
              <input
                type="datetime-local"
                value={multiplierEnds ? multiplierEnds.slice(0, 16) : ""}
                onChange={async (e) => {
                  const val = new Date(e.target.value).toISOString();
                  setMultiplierEnds(val);
                  await supabase.from("app_settings").update({ value: val as any } as any).eq("key", "multiplier_ends_at");
                }}
                className="bg-[#0a0a14] border border-[#1e1e2e] text-slate-300 px-2 py-1 rounded text-[12px] outline-none"
              />
            )}
            <button
              onClick={toggleMultiplier}
              className={`w-12 h-6 rounded-full relative cursor-pointer border-none transition-colors ${multiplierActive ? "bg-amber-500" : "bg-slate-700"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${multiplierActive ? "left-[26px]" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-3">Members by Tier</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tierDistribution}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {tierDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-3">Revenue by Tier</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={revByTier} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {revByTier.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* At-Risk Members */}
      {atRiskMembers.length > 0 && (
        <div className="mb-7">
          <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-3">⚠ At-Risk Members ({atRiskMembers.length})</p>
          <div className="flex flex-col gap-1">
            {atRiskMembers.slice(0, 5).map((p: any) => (
              <div key={p.user_id} className="flex justify-between items-center bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-2.5">
                <div>
                  <span className="text-[13px] text-slate-200">{p.full_name || "—"}</span>
                  <span className="text-[11px] text-slate-500 ml-2">{p.buyer_tier}</span>
                </div>
                <button
                  onClick={() => {
                    const subject = encodeURIComponent("We miss you at Offlist!");
                    const body = encodeURIComponent(`Hi ${(p.full_name || "").split(" ")[0]},\n\nWe noticed you haven't been active recently. We'd love to see you at our upcoming events!\n\nBest,\nOfflist Team`);
                    window.open(`mailto:${p.email}?subject=${subject}&body=${body}`, "_blank");
                  }}
                  className="text-[10px] bg-red-600 text-white border-none px-3 py-1 rounded cursor-pointer hover:bg-red-500"
                >
                  Re-engage
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] tracking-[2px] text-slate-600 uppercase">Leaderboard</p>
        <div className="flex gap-1">
          {(["points", "spend", "engagement"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-[10px] px-3 py-1 rounded-lg cursor-pointer border transition-colors ${
                sortBy === s ? "border-purple-500 bg-purple-950 text-purple-400" : "border-[#1e1e2e] bg-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1e1e2e]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["#", "Name", "Tier", "Points", "Spent", "Purchases", "Events", "Referrals"].map(h => (
                <th key={h} className="p-2.5 text-left text-[10px] tracking-[2px] text-slate-600 bg-[#0f0f1a] border-b border-[#1e1e2e] font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedProfiles.slice(0, 30).map((p: any, i: number) => {
              const stats = getUserStats(p.user_id);
              return (
                <tr
                  key={p.user_id}
                  className={`border-b border-[#1a1a2e] cursor-pointer hover:bg-[#1a1a2e] transition-colors ${tierBg[p.buyer_tier] || ""}`}
                  onClick={() => onSelectProfile(p)}
                >
                  <td className="p-2.5 text-[12px] text-slate-500 font-semibold">{i + 1}</td>
                  <td className="p-2.5 text-[13px] text-slate-200">{p.full_name || "—"}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      p.buyer_tier === "vip" ? "bg-amber-950 text-amber-400" :
                      p.buyer_tier === "buyer" ? "bg-sky-950 text-sky-400" :
                      p.buyer_tier === "shopper" ? "bg-emerald-950 text-emerald-400" :
                      "bg-slate-800 text-slate-400"
                    }`}>{p.buyer_tier}</span>
                  </td>
                  <td className="p-2.5 text-[13px] text-purple-400 font-semibold">{p.total_points}</td>
                  <td className="p-2.5 text-[13px] text-emerald-400">£{stats.spent.toFixed(0)}</td>
                  <td className="p-2.5 text-[13px] text-slate-300">{stats.purchaseCount}</td>
                  <td className="p-2.5 text-[13px] text-slate-300">{stats.events}</td>
                  <td className="p-2.5 text-[13px] text-slate-300">{stats.referrals}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminScoring;
