import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  referral_code: string | null;
  referred_by: string | null;
}

const AdminReferrals = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, referral_code, referred_by" as any)
        .order("created_at", { ascending: false });
      if (data) setProfiles(data as any);
    };
    fetch();
  }, []);

  // Build referral stats: how many people each user referred
  const referralCounts = profiles.reduce((acc, p) => {
    if (p.referred_by) {
      acc[p.referred_by] = (acc[p.referred_by] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const referrers = Object.entries(referralCounts)
    .map(([userId, count]) => {
      const profile = profiles.find((p) => p.user_id === userId);
      return { userId, count, name: profile?.full_name || "Unknown", email: profile?.email || "", code: profile?.referral_code || "" };
    })
    .sort((a, b) => b.count - a.count);

  const referredUsers = profiles.filter((p) => p.referred_by);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-wider mb-7 text-slate-50">Referral Tracking</h2>

      <div className="flex gap-4 mb-7">
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-4 flex-1">
          <p className="text-2xl font-bold text-purple-400">{referredUsers.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Referrals</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-4 flex-1">
          <p className="text-2xl font-bold text-emerald-400">{referrers.length}</p>
          <p className="text-xs text-slate-500 mt-1">Active Referrers</p>
        </div>
      </div>

      {/* Top Referrers */}
      <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-3">Top Referrers</h3>
      {referrers.length === 0 ? (
        <p className="text-slate-600 text-[13px] py-6">No referrals yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1e1e2e] mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Email", "Referral Code", "Referrals"].map((h) => (
                  <th key={h} className="p-3 text-left text-[11px] tracking-[2px] text-slate-600 bg-[#0f0f1a] border-b border-[#1e1e2e] font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrers.map((r) => (
                <tr key={r.userId} className="border-b border-[#1a1a2e]">
                  <td className="p-3 text-[13px] text-slate-200">{r.name}</td>
                  <td className="p-3 text-[13px] text-slate-400">{r.email}</td>
                  <td className="p-3 text-[13px] font-mono text-purple-400">{r.code}</td>
                  <td className="p-3">
                    <span className="bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-semibold">{r.count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Referred Users */}
      <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-3">Referred Users</h3>
      {referredUsers.length === 0 ? (
        <p className="text-slate-600 text-[13px] py-6">No referred users yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1e1e2e]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["User", "Email", "Referred By"].map((h) => (
                  <th key={h} className="p-3 text-left text-[11px] tracking-[2px] text-slate-600 bg-[#0f0f1a] border-b border-[#1e1e2e] font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referredUsers.map((p) => {
                const referrer = profiles.find((pr) => pr.user_id === p.referred_by);
                return (
                  <tr key={p.user_id} className="border-b border-[#1a1a2e]">
                    <td className="p-3 text-[13px] text-slate-200">{p.full_name || "—"}</td>
                    <td className="p-3 text-[13px] text-slate-400">{p.email || "—"}</td>
                    <td className="p-3 text-[13px] text-slate-400">{referrer?.full_name || referrer?.email || "Unknown"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReferrals;
