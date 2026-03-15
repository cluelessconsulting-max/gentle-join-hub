import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  checked_in_at: string | null;
  registered_at: string;
}

interface EventInfo {
  id: string;
  name: string;
  date: string;
  location: string;
}

interface ProfileInfo {
  full_name: string | null;
  city: string | null;
  buyer_tier: string;
  referral_code: string | null;
  avatar_url: string | null;
}

const TIER_COLORS: Record<string, string> = {
  guest: "bg-slate-800 text-slate-400",
  shopper: "bg-emerald-950 text-emerald-400",
  buyer: "bg-sky-950 text-sky-400",
  vip: "bg-purple-950 text-purple-400",
};

const CheckIn = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [registrations, setRegistrations] = useState<(Registration & { profile: ProfileInfo | null })[]>([]);
  const [searchCode, setSearchCode] = useState("");
  const [scanResult, setScanResult] = useState<{
    status: "found" | "not_found" | "already" | "not_registered";
    reg?: Registration;
    profile?: ProfileInfo;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    const [{ data: evt }, { data: regs }, { data: profs }] = await Promise.all([
      supabase.from("events").select("id, name, date, location").eq("id", eventId!).single(),
      supabase.from("event_registrations" as any).select("*").eq("event_id", eventId!),
      supabase.from("profiles").select("user_id, full_name, city, buyer_tier, referral_code, avatar_url"),
    ]);
    setEvent(evt as any);
    const profMap = new Map((profs as any[] || []).map((p: any) => [p.user_id, p]));
    setRegistrations(
      ((regs as any[]) || []).map((r: any) => ({ ...r, profile: profMap.get(r.user_id) || null }))
    );
    setLoading(false);
  };

  const handleSearch = () => {
    const code = searchCode.trim().toUpperCase();
    if (!code) return;

    const match = registrations.find(
      (r) => r.profile?.referral_code?.toUpperCase() === code
    );

    if (!match) {
      setScanResult({ status: "not_registered" });
      return;
    }

    if (match.checked_in_at) {
      setScanResult({ status: "already", reg: match, profile: match.profile || undefined });
      return;
    }

    if (match.status !== "confirmed") {
      setScanResult({ status: "not_registered", reg: match, profile: match.profile || undefined });
      return;
    }

    setScanResult({ status: "found", reg: match, profile: match.profile || undefined });
  };

  const handleCheckIn = async () => {
    if (!scanResult?.reg) return;
    setCheckingIn(true);

    const { error } = await supabase
      .from("event_registrations" as any)
      .update({ checked_in_at: new Date().toISOString() } as any)
      .eq("id", scanResult.reg.id);

    if (error) {
      toast.error("Check-in failed");
    } else {
      toast.success("Checked in!");
      // Log audit
      await supabase.from("audit_log" as any).insert({
        action: "checkin",
        performed_by: user?.email || "admin",
        target_user_name: scanResult.profile?.full_name || "Unknown",
        new_value: event?.name || eventId,
      } as any);
      setScanResult({ ...scanResult, status: "already", reg: { ...scanResult.reg, checked_in_at: new Date().toISOString() } });
      fetchData();
    }
    setCheckingIn(false);
  };

  const checkedInCount = registrations.filter((r) => r.checked_in_at).length;
  const confirmedCount = registrations.filter((r) => r.status === "confirmed").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <p className="text-purple-400 text-2xl animate-pulse">⬡</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 font-mono">
      {/* Header */}
      <div className="bg-[#0f0f1a] border-b border-[#1e1e2e] px-6 py-5">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[10px] tracking-[3px] text-purple-400 uppercase mb-1">Check-in Mode</p>
            <h1 className="text-xl font-bold text-slate-50">{event?.name || "Event"}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{event?.date} · {event?.location}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-400">{checkedInCount}</p>
            <p className="text-[10px] text-slate-500 tracking-wider">/ {confirmedCount} checked in</p>
          </div>
        </div>
      </div>

      {/* Search / Scan */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-8">
          <input
            className="flex-1 bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-5 py-4 rounded-xl text-lg outline-none focus:border-purple-800 transition-colors tracking-wider uppercase"
            placeholder="Enter member code…"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
          <button
            onClick={handleSearch}
            className="bg-purple-600 text-white border-none px-8 py-4 rounded-xl cursor-pointer text-sm font-semibold tracking-wider hover:bg-purple-500 transition-colors min-h-[56px]"
          >
            Search
          </button>
        </div>

        {/* Result */}
        {scanResult && (
          <div className={`rounded-2xl p-8 text-center mb-8 border ${
            scanResult.status === "found" ? "bg-emerald-950/30 border-emerald-800" :
            scanResult.status === "already" ? "bg-amber-950/30 border-amber-800" :
            "bg-red-950/30 border-red-800"
          }`}>
            {scanResult.status === "not_registered" && (
              <>
                <p className="text-5xl mb-4">✕</p>
                <p className="text-2xl font-bold text-red-400 mb-2">NOT ON GUEST LIST</p>
                <p className="text-sm text-slate-500">This code is not registered for this event</p>
              </>
            )}

            {scanResult.status === "already" && (
              <>
                <p className="text-5xl mb-4">⚠</p>
                <p className="text-2xl font-bold text-amber-400 mb-2">ALREADY CHECKED IN</p>
                <p className="text-lg text-slate-300 mb-1">{scanResult.profile?.full_name}</p>
                <p className="text-sm text-slate-500">
                  at {new Date(scanResult.reg!.checked_in_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </>
            )}

            {scanResult.status === "found" && scanResult.profile && (
              <>
                {scanResult.profile.avatar_url && (
                  <img src={scanResult.profile.avatar_url} alt="" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-emerald-500" />
                )}
                <p className="text-2xl font-bold text-slate-50 mb-2">{scanResult.profile.full_name}</p>
                <div className="flex justify-center gap-2 mb-2">
                  <span className="text-xs text-slate-400">{scanResult.profile.city}</span>
                  <span className={`${TIER_COLORS[scanResult.profile.buyer_tier] || TIER_COLORS.guest} px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
                    {scanResult.profile.buyer_tier}
                  </span>
                </div>
                <p className="text-sm text-emerald-400 mb-6">✓ Confirmed registration</p>
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="bg-emerald-600 text-white border-none px-12 py-5 rounded-xl cursor-pointer text-xl font-bold tracking-wider hover:bg-emerald-500 transition-colors min-h-[60px] disabled:opacity-50"
                >
                  {checkingIn ? "…" : "✓ CHECK IN"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Guest List */}
        <h3 className="text-[10px] tracking-[3px] text-slate-600 uppercase mb-3">Guest List</h3>
        <div className="flex flex-col gap-1">
          {registrations
            .filter((r) => r.status === "confirmed")
            .sort((a, b) => (a.checked_in_at ? 1 : 0) - (b.checked_in_at ? 1 : 0))
            .map((r) => (
              <div key={r.id} className={`flex items-center justify-between px-4 py-3 rounded-lg ${r.checked_in_at ? "bg-[#0f0f1a]/50" : "bg-[#0f0f1a]"}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${r.checked_in_at ? "bg-emerald-500" : "bg-slate-700"}`} />
                  <span className={`text-sm ${r.checked_in_at ? "text-slate-500" : "text-slate-200"}`}>
                    {r.profile?.full_name || "—"}
                  </span>
                  <span className={`${TIER_COLORS[r.profile?.buyer_tier || "guest"]} px-2 py-0.5 rounded-full text-[10px] font-semibold`}>
                    {r.profile?.buyer_tier || "guest"}
                  </span>
                </div>
                {r.checked_in_at && (
                  <span className="text-[10px] text-emerald-500">
                    ✓ {new Date(r.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
