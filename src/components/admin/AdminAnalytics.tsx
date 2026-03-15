import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

interface Profile {
  created_at: string;
  application_status: string;
  city: string | null;
  buyer_tier: string;
}

const COLORS = ["#a78bfa", "#34d399", "#f59e0b", "#ef4444", "#38bdf8", "#f472b6"];

const AdminAnalytics = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [regs, setRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [p, e, r] = await Promise.all([
        supabase.from("profiles").select("created_at, application_status, city, buyer_tier"),
        supabase.from("events").select("*"),
        supabase.from("event_registrations" as any).select("event_id, status, registered_at"),
      ]);
      setProfiles((p.data as any) || []);
      setEvents((e.data as any) || []);
      setRegs((r.data as any) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <p className="text-slate-500 animate-pulse">Loading analytics…</p>;

  // Growth over time (by month)
  const growthData = (() => {
    const byMonth: Record<string, number> = {};
    profiles.forEach((p) => {
      const month = p.created_at.substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    });
    const sorted = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
    let cumulative = 0;
    return sorted.map(([month, count]) => {
      cumulative += count;
      return { month, newMembers: count, total: cumulative };
    });
  })();

  // Status breakdown for pie
  const statusData = (() => {
    const counts: Record<string, number> = {};
    profiles.forEach((p) => {
      counts[p.application_status] = (counts[p.application_status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Top cities
  const cityData = (() => {
    const counts: Record<string, number> = {};
    profiles.forEach((p) => {
      const city = p.city || "Unknown";
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([city, count]) => ({ city, count }));
  })();

  // Event popularity
  const eventPopularity = events.map((e) => ({
    name: e.name?.substring(0, 20) || "?",
    registrations: regs.filter((r: any) => r.event_id === e.id).length,
  })).sort((a, b) => b.registrations - a.registrations).slice(0, 8);

  // Conversion rate
  const approved = profiles.filter((p) => p.application_status === "approved").length;
  const conversionRate = profiles.length > 0 ? Math.round((approved / profiles.length) * 100) : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-wider mb-5 text-slate-50">Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Members", value: profiles.length, color: "text-purple-400" },
          { label: "Approval Rate", value: `${conversionRate}%`, color: "text-emerald-400" },
          { label: "Total Events", value: events.length, color: "text-sky-400" },
          { label: "Total Registrations", value: regs.length, color: "text-amber-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[11px] text-slate-500 mt-1 tracking-wider">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mb-8">
        {/* Member Growth */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-4">Member Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="total" stroke="#a78bfa" fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown Pie */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-4">Application Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Cities */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-4">Top Cities</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cityData} layout="vertical">
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis type="category" dataKey="city" tick={{ fill: "#e2e8f0", fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Event Popularity */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-4">Event Popularity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={eventPopularity} layout="vertical">
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="registrations" fill="#a78bfa" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
