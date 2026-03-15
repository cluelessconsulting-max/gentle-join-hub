import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BrandData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface BuyerRow {
  full_name: string | null;
  city: string | null;
  buyer_tier: string;
  amount: number;
  purchase_date: string;
}

const BrandPortal = () => {
  const { slug } = useParams<{ slug: string }>();
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [buyers, setBuyers] = useState<BuyerRow[]>([]);
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBuyers: 0, totalRevenue: 0 });
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number; revenue: number }[]>([]);

  useEffect(() => {
    fetchBrand();
  }, [slug]);

  const fetchBrand = async () => {
    const { data } = await supabase
      .from("brand_partners" as any)
      .select("id, name, slug, logo_url")
      .eq("slug", slug)
      .eq("active", true)
      .single();
    if (data) setBrand(data as any);
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!brand) return;
    // Verify password via edge function
    const { data, error } = await supabase.functions.invoke("brand-auth", {
      body: { slug, password },
    });
    if (error || !data?.success) {
      toast.error("Invalid password");
      return;
    }
    setAuthenticated(true);
    fetchPortalData();
  };

  const fetchPortalData = async () => {
    if (!brand) return;

    // Get discount codes for this brand
    const { data: codes } = await supabase.functions.invoke("brand-auth", {
      body: { slug, password, action: "get_data" },
    });

    if (codes?.buyers) setBuyers(codes.buyers);
    if (codes?.discountCodes) setDiscountCodes(codes.discountCodes);
    if (codes?.stats) setStats(codes.stats);
    if (codes?.monthlyData) setMonthlyData(codes.monthlyData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <p className="text-purple-400 animate-pulse text-2xl">⬡</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <p className="text-slate-500 text-sm">Brand not found</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] font-mono">
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-2xl p-10 max-w-sm w-full mx-4 text-center">
          {brand.logo_url && <img src={brand.logo_url} alt={brand.name} className="w-16 h-16 mx-auto mb-4 rounded-lg object-contain" />}
          <h1 className="text-xl font-bold text-slate-50 mb-1">{brand.name}</h1>
          <p className="text-xs text-slate-500 mb-6">Partner Portal</p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-[#0a0a12] border border-[#1e1e2e] text-slate-200 px-4 py-3 rounded-lg text-sm outline-none mb-4 focus:border-purple-800 transition-colors"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-purple-600 text-white border-none py-3 rounded-lg cursor-pointer text-sm font-semibold hover:bg-purple-500 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-mono text-slate-200 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          {brand.logo_url && <img src={brand.logo_url} alt={brand.name} className="w-10 h-10 rounded-lg object-contain" />}
          <div>
            <h1 className="text-2xl font-bold text-slate-50">{brand.name}</h1>
            <p className="text-xs text-slate-500">Partner Dashboard</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Buyers", value: stats.totalBuyers, color: "text-purple-400" },
            { label: "Total Revenue", value: `£${stats.totalRevenue.toLocaleString()}`, color: "text-emerald-400" },
            { label: "Active Codes", value: discountCodes.filter((c: any) => c.is_active).length, color: "text-sky-400" },
          ].map((s) => (
            <div key={s.label} className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1 tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Monthly Trend */}
        {monthlyData.length > 0 && (
          <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5 mb-8">
            <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-4">Monthly Purchases</h3>
            <div className="flex items-end gap-2 h-32">
              {monthlyData.map((m) => {
                const maxCount = Math.max(...monthlyData.map((d) => d.count), 1);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-purple-400 font-semibold">{m.count}</span>
                    <div
                      className="w-full bg-purple-600 rounded-t"
                      style={{ height: `${(m.count / maxCount) * 100}%`, minHeight: 4 }}
                    />
                    <span className="text-[9px] text-slate-600">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Discount Codes */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5 mb-8">
          <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-4">Your Discount Codes</h3>
          {discountCodes.length === 0 ? (
            <p className="text-slate-600 text-[13px]">No codes yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {discountCodes.map((c: any) => (
                <span key={c.id} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${c.is_active ? "bg-emerald-950 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                  {c.code}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Buyers Table */}
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-4">Buyers</h3>
          {buyers.length === 0 ? (
            <p className="text-slate-600 text-[13px]">No purchases yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {["Name", "City", "Tier", "Amount", "Date"].map((h) => (
                    <th key={h} className="text-left text-[11px] tracking-[2px] text-slate-600 pb-2 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buyers.map((b, i) => (
                  <tr key={i} className="border-t border-[#1a1a2e]">
                    <td className="py-2 text-[13px] text-slate-200">{b.full_name || "—"}</td>
                    <td className="py-2 text-[13px] text-slate-400">{b.city || "—"}</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-purple-400">{b.buyer_tier}</span>
                    </td>
                    <td className="py-2 text-[13px] text-emerald-400">£{b.amount}</td>
                    <td className="py-2 text-[11px] text-slate-500">{new Date(b.purchase_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandPortal;
