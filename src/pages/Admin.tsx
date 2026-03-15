import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AdminInvites from "@/components/admin/AdminInvites";
import AdminEventsManager from "@/components/admin/AdminEventsManager";
import AdminReferrals from "@/components/admin/AdminReferrals";
import AdminBuyers from "@/components/admin/AdminBuyers";

const ADMIN_EMAIL = "clueless.consulting@gmail.com";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
  age: number | null;
  instagram: string | null;
  tiktok: string | null;
  phone: string | null;
  interests: string[] | null;
  shopping_style: string | null;
  event_frequency: string | null;
  referral: string | null;
  how_heard: string | null;
  application_status: string;
  created_at: string;
  referral_code: string | null;
  job_title: string | null;
  industry: string | null;
  travel_style: string | null;
  ideal_night_out: string | null;
  favourite_neighbourhoods: string | null;
  referred_by: string | null;
  buyer_tier: string;
  total_points: number;
}

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const Admin = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [filter, setFilter] = useState({ city: "", interest: "", status: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Email composer
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sending, setSending] = useState(false);

  // System check
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    fetchProfiles();

    // Realtime subscription for new pending applications
    const channel = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
        const newProfile = payload.new as unknown as Profile;
        setProfiles(prev => [newProfile, ...prev]);
        toast.info(`New application from ${newProfile.full_name || newProfile.email || 'unknown'}`);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setProfiles((data as unknown as Profile[]) || []);
    setLoading(false);
  };

  const getFilteredProfiles = () => {
    return profiles.filter((p) => {
      const matchCity = !filter.city || p.city?.toLowerCase().includes(filter.city.toLowerCase());
      const matchStatus = !filter.status || p.application_status === filter.status;
      const matchInterest =
        !filter.interest ||
        (p.interests || []).some((i) => i.toLowerCase().includes(filter.interest.toLowerCase()));
      const matchSearch =
        !searchQuery ||
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCity && matchStatus && matchInterest && matchSearch;
    });
  };

  const updateStatus = async (profileId: string, status: string) => {
    setUpdatingId(profileId);
    const { error } = await supabase
      .from("profiles")
      .update({ application_status: status } as any)
      .eq("id", profileId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Application ${status}`);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, application_status: status } : p))
      );

      // Send welcome email on approval
      if (status === "approved") {
        const profile = profiles.find((p) => p.id === profileId);
        if (profile?.email) {
          const approvalHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#EDE8E0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EDE8E0;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#EDE8E0;">
        <tr><td style="padding:0 0 32px 0;text-align:center;">
          <span style="font-size:18px;letter-spacing:4px;text-transform:uppercase;color:#0A0A0A;font-weight:400;">OFFLIST</span>
        </td></tr>
        <tr><td style="padding:0 0 10px 0;text-align:center;">
          <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B49A6A;">APPLICATION APPROVED</span>
        </td></tr>
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <span style="font-size:28px;font-weight:300;color:#0A0A0A;letter-spacing:0.5px;">You're in.</span>
        </td></tr>
        <tr><td style="padding:0 0 24px 0;"><div style="height:1px;background-color:rgba(10,10,10,0.12);"></div></td></tr>
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <span style="font-size:13px;color:#8B8178;letter-spacing:0.3px;line-height:1.8;">
            Hi ${profile.full_name?.split(" ")[0] || "there"},<br><br>
            Your application has been approved by our team.<br><br>
            Make sure you follow us on
            <a href="https://www.instagram.com/offlist.network/" style="color:#0A0A0A;text-decoration:underline;">Instagram</a>
            and
            <a href="https://www.tiktok.com/@off.list.network" style="color:#0A0A0A;text-decoration:underline;">TikTok</a>
            for the latest event updates.<br><br>
            You are now able to submit a request to be added to the guest list for the events on our website.
          </span>
        </td></tr>
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <a href="https://gentle-join-hub.lovable.app/#events" style="display:inline-block;background-color:#0A0A0A;color:#EDE8E0;text-decoration:none;padding:14px 36px;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Browse Events</a>
        </td></tr>
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <span style="font-size:13px;color:#8B8178;letter-spacing:0.3px;">
            Grazie e alla prossima!
          </span>
        </td></tr>
        <tr><td><div style="height:1px;background-color:rgba(10,10,10,0.12);"></div></td></tr>
        <tr><td style="padding:24px 0 0 0;text-align:center;">
          <span style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#8B8178;">OFFLIST NETWORK</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
          supabase.functions.invoke("brevo-admin", {
            body: {
              action: "send_email",
              recipients: [{ email: profile.email, name: profile.full_name || "Member" }],
              subject: "You're in — Welcome to Offlist",
              htmlContent: approvalHtml,
            },
          }).catch((err) => console.error("Welcome email error:", err));
        }
      }
    }
    setUpdatingId(null);
  };

  const syncToBrevo = async (profile: Profile) => {
    if (!profile.email) {
      toast.error("No email found for this profile");
      return;
    }
    const { error } = await supabase.functions.invoke("brevo-admin", {
      body: {
        action: "sync_contact",
        email: profile.email,
        attributes: {
          NOME: profile.full_name?.split(" ")[0] || "",
          COGNOME: profile.full_name?.split(" ").slice(1).join(" ") || "",
          CITY: profile.city || "",
          INTERESTS: (profile.interests || []).join(", "),
          STATUS: profile.application_status,
          INSTAGRAM: profile.instagram || "",
        },
      },
    });
    if (error) {
      toast.error("Sync failed");
    } else {
      toast.success("Synced to Brevo");
    }
  };

  const sendBulkEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast.error("Subject and body are required");
      return;
    }
    setSending(true);

    const targets =
      selectedUsers.length > 0
        ? profiles.filter((p) => selectedUsers.includes(p.id))
        : getFilteredProfiles();

    const recipients = targets
      .filter((p) => p.email)
      .map((p) => ({
        email: p.email!,
        name: p.full_name || "Member",
      }));

    const { error } = await supabase.functions.invoke("brevo-admin", {
      body: {
        action: "send_email",
        recipients,
        subject: emailSubject,
        htmlContent: emailBody.replace(/\n/g, "<br>"),
      },
    });

    if (error) {
      toast.error("Failed to send email");
    } else {
      toast.success(`Email sent to ${recipients.length} people`);
      setEmailSubject("");
      setEmailBody("");
      setSelectedUsers([]);
    }
    setSending(false);
  };

  const runSystemCheck = async () => {
    setChecking(true);
    const checks: CheckResult[] = [];

    // 1. Database connection
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      checks.push({ name: "Database Connection", ok: !error, detail: error?.message || "Connected" });
    } catch (e: any) {
      checks.push({ name: "Database Connection", ok: false, detail: e.message });
    }

    // 2. Profiles table
    try {
      const { data, error } = await supabase.from("profiles").select("*").limit(1);
      checks.push({ name: "Profiles Table", ok: !error, detail: error?.message || `Table OK, ${profiles.length} total rows` });
    } catch (e: any) {
      checks.push({ name: "Profiles Table", ok: false, detail: e.message });
    }

    // 3. Auth
    try {
      const { data } = await supabase.auth.getUser();
      checks.push({ name: "Auth System", ok: !!data?.user, detail: data?.user?.email || "Not authenticated" });
    } catch (e: any) {
      checks.push({ name: "Auth System", ok: false, detail: e.message });
    }

    // 4. Brevo API
    try {
      const { data, error } = await supabase.functions.invoke("brevo-admin", {
        body: { action: "get_stats" },
      });
      checks.push({ name: "Brevo API", ok: data?.success, detail: data?.success ? "Connected" : "Failed" });
    } catch (e: any) {
      checks.push({ name: "Brevo API", ok: false, detail: "Cannot reach Brevo" });
    }

    // 5. Events table
    try {
      const { data, error } = await supabase.from("events").select("id").limit(1);
      checks.push({ name: "Events Table", ok: !error, detail: error?.message || "Table OK" });
    } catch (e: any) {
      checks.push({ name: "Events Table", ok: false, detail: e.message });
    }

    setCheckResults(checks);
    setChecking(false);
  };

  const stats = {
    total: profiles.length,
    approved: profiles.filter((p) => p.application_status === "approved").length,
    pending: profiles.filter((p) => p.application_status === "pending").length,
    rejected: profiles.filter((p) => p.application_status === "rejected").length,
    cities: [...new Set(profiles.map((p) => p.city).filter(Boolean))].length,
  };

  // City breakdown
  const cityBreakdown = profiles.reduce((acc, p) => {
    const city = p.city || "Unknown";
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sortedCities = Object.entries(cityBreakdown).sort((a, b) => b[1] - a[1]);

  // Tier breakdown
  const tierBreakdown = profiles.reduce((acc, p) => {
    const tier = p.buyer_tier || "guest";
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const tierOrder = ["guest", "shopper", "buyer", "vip"];
  const sortedTiers = tierOrder.map(t => [t, tierBreakdown[t] || 0] as [string, number]);

  const filteredProfiles = getFilteredProfiles();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <p className="text-2xl text-purple-400 animate-pulse">⬡</p>
      </div>
    );
  }

  const pendingCount = profiles.filter(p => p.application_status === "pending").length;

  const tabs = [
    { id: "overview", icon: "◈", label: "Overview" },
    { id: "members", icon: "◉", label: "Members", badge: pendingCount > 0 ? pendingCount : undefined },
    { id: "events", icon: "◎", label: "Events" },
    { id: "buyers", icon: "◆", label: "Buyers" },
    { id: "invites", icon: "◇", label: "Invites" },
    { id: "referrals", icon: "◈", label: "Referrals" },
    { id: "email", icon: "◎", label: "Send Email" },
    { id: "testing", icon: "◌", label: "System Check" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] font-mono text-slate-200">
      {/* Sidebar */}
      <aside className="w-[220px] bg-[#0f0f1a] border-r border-[#1e1e2e] p-8 px-4 flex flex-col gap-1">
        <div className="flex items-center gap-2.5 mb-7">
          <span className="text-2xl text-purple-400">⬡</span>
          <span className="text-lg font-bold tracking-[4px] text-slate-50">OFFLIST</span>
        </div>
        <p className="text-[10px] tracking-[3px] text-slate-600 mb-2 pl-2">ADMIN</p>

        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 bg-transparent border-none text-left px-3 py-2.5 rounded-lg cursor-pointer text-[13px] tracking-wide transition-all ${
              activeTab === tab.id
                ? "bg-indigo-950 text-purple-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1a2e]"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
            {tab.badge && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}

        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className="mt-auto bg-transparent border border-[#1e1e2e] text-slate-600 px-3 py-2 rounded-lg cursor-pointer text-xs tracking-wider hover:text-slate-400 hover:border-slate-600 transition-colors"
        >
          ↩ Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div>
            <h2 className="text-2xl font-bold tracking-wider mb-7 text-slate-50">Overview</h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              {[
                { label: "Total", value: stats.total, color: "text-purple-400" },
                { label: "Approved", value: stats.approved, color: "text-emerald-400" },
                { label: "Pending", value: stats.pending, color: "text-amber-400" },
                { label: "Rejected", value: stats.rejected, color: "text-red-400" },
                { label: "Cities", value: stats.cities, color: "text-sky-400" },
              ].map((s) => (
                <div key={s.label} className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
                  <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1 tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mb-10">
              {/* City Breakdown */}
              <div>
                <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-4">By City</h3>
                <div className="flex flex-col gap-0.5">
                  {sortedCities.slice(0, 10).map(([city, count]) => (
                    <div key={city} className="flex justify-between items-center px-4 py-2.5 bg-[#0f0f1a] rounded-lg">
                      <span className="text-sm text-slate-200">{city}</span>
                      <span className="text-xs text-sky-400 font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier Breakdown */}
              <div>
                <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-4">By Buyer Tier</h3>
                <div className="flex flex-col gap-0.5">
                  {sortedTiers.map(([tier, count]) => (
                    <div key={tier} className="flex justify-between items-center px-4 py-2.5 bg-[#0f0f1a] rounded-lg">
                      <TierBadge tier={tier} />
                      <span className="text-xs text-slate-300 font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-4">Recent Applications</h3>
            <div className="flex flex-col gap-0.5">
              {profiles.slice(0, 8).map((p) => (
                <div key={p.id} className="flex justify-between items-center px-4 py-3 bg-[#0f0f1a] rounded-lg">
                  <div>
                    <span className="block text-sm text-slate-200">{p.full_name || "—"}</span>
                    <span className="text-[11px] text-slate-600">{p.city || "No city"} · {p.instagram || "No IG"}</span>
                  </div>
                  <StatusBadge status={p.application_status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MEMBERS ── */}
        {activeTab === "members" && (
          <MembersKanban
            profiles={filteredProfiles}
            allProfiles={profiles}
            updatingId={updatingId}
            updateStatus={updateStatus}
            syncToBrevo={syncToBrevo}
            onSelectProfile={setSelectedProfile}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filter={filter}
            setFilter={setFilter}
            onEmailGroup={(status: string) => {
              setFilter({ ...filter, status });
              setActiveTab("email");
            }}
          />
        )}

        {/* ── EVENTS MANAGER ── */}
        {activeTab === "events" && <AdminEventsManager />}

        {/* ── BUYERS ── */}
        {activeTab === "buyers" && <AdminBuyers />}

        {/* ── INVITES ── */}
        {activeTab === "invites" && user && <AdminInvites userId={user.id} />}

        {/* ── REFERRALS ── */}
        {activeTab === "referrals" && <AdminReferrals />}

        {/* ── EMAIL COMPOSER ── */}
        {activeTab === "email" && (
          <div className="max-w-[680px]">
            <h2 className="text-2xl font-bold tracking-wider mb-7 text-slate-50">Send Email</h2>

            <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-2">Segment / Recipients</p>
            <div className="flex gap-2.5 flex-wrap mb-2">
              <input
                className="bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none min-w-[140px]"
                placeholder="Filter by city…"
                value={filter.city}
                onChange={(e) => setFilter({ ...filter, city: e.target.value })}
              />
              <input
                className="bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none min-w-[140px]"
                placeholder="Filter by interest…"
                value={filter.interest}
                onChange={(e) => setFilter({ ...filter, interest: e.target.value })}
              />
              <select
                className="bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none cursor-pointer"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">All statuses</option>
                <option value="approved">Approved only</option>
                <option value="pending">Pending only</option>
              </select>
            </div>
            <p className="text-purple-400 text-[13px] mb-5">
              → {getFilteredProfiles().length} recipients match this segment
            </p>

            <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-1.5">Subject</p>
            <input
              className="w-full bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3.5 py-2.5 rounded-lg text-sm outline-none mb-4 focus:border-purple-800 transition-colors"
              placeholder="Email subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />

            <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-1.5">Message</p>
            <textarea
              className="w-full bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3.5 py-3 rounded-lg text-sm outline-none mb-5 min-h-[180px] resize-y focus:border-purple-800 transition-colors"
              placeholder="Write your message..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />

            <button
              onClick={sendBulkEmail}
              disabled={sending || !emailSubject || !emailBody}
              className="bg-purple-600 text-white border-none px-7 py-3 rounded-lg cursor-pointer text-sm font-semibold tracking-wide hover:bg-purple-500 transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              {sending ? "Sending..." : `Send to ${getFilteredProfiles().length} people`}
            </button>

            <div className="mt-6 p-4 bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg text-xs text-slate-500 leading-relaxed">
              <strong>Note:</strong> Template visivi, tracking aperture e gestione bounce richiedono accesso diretto a Brevo. Questa interfaccia copre i casi d'uso principali.
            </div>
          </div>
        )}

        {/* ── SYSTEM CHECK ── */}
        {activeTab === "testing" && (
          <div>
            <h2 className="text-2xl font-bold tracking-wider mb-3 text-slate-50">System Check</h2>
            <p className="text-slate-400 mb-6 text-sm">Run automated checks to verify all systems are working correctly.</p>

            <button
              onClick={runSystemCheck}
              disabled={checking}
              className="bg-purple-600 text-white border-none px-7 py-3 rounded-lg cursor-pointer text-sm font-semibold tracking-wide hover:bg-purple-500 transition-colors disabled:opacity-40"
            >
              {checking ? "Running checks..." : "▶ Run All Checks"}
            </button>

            {checkResults.length > 0 && (
              <div className="flex flex-col gap-3 mt-7">
                {checkResults.map((r, i) => (
                  <div
                    key={i}
                    className={`flex gap-4 items-start bg-[#0f0f1a] px-5 py-3.5 rounded-xl border-l-[3px] ${
                      r.ok ? "border-l-emerald-500" : "border-l-red-500"
                    }`}
                  >
                    <span className={`text-lg ${r.ok ? "text-emerald-500" : "text-red-500"}`}>
                      {r.ok ? "✓" : "✕"}
                    </span>
                    <div>
                      <p className="text-sm text-slate-200 m-0">{r.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 m-0">{r.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mt-10 mb-4">Manual Testing Checklist</h3>
            <div className="flex flex-col">
              {[
                "Sign up with a new test email → check if profile appears in Members tab",
                "Submit application form → verify all fields saved",
                "Approve a user → verify welcome email received",
                "Reject a user → verify status updates correctly",
                "Use 'Sync to Brevo' button → check contact in Brevo",
                "Send a test email to yourself → verify delivery",
                "Filter by city + interest → verify correct results",
                "Log out and try /admin → verify redirect",
              ].map((item, i) => (
                <label key={i} className="flex items-center gap-2.5 py-2.5 border-b border-[#1a1a2e] cursor-pointer text-[13px] text-slate-300">
                  <input type="checkbox" className="accent-purple-500" />
                  {item}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── USER DETAIL MODAL ── */}
        {selectedProfile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedProfile(null)}>
            <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-50">{selectedProfile.full_name || "—"}</h3>
                    <p className="text-sm text-slate-500">{selectedProfile.email}</p>
                  </div>
                  <button onClick={() => setSelectedProfile(null)} className="text-slate-600 hover:text-slate-300 text-lg bg-transparent border-none cursor-pointer">✕</button>
                </div>

                <div className="flex gap-2">
                  <StatusBadge status={selectedProfile.application_status} />
                  <TierBadge tier={selectedProfile.buyer_tier} />
                  {selectedProfile.total_points > 0 && (
                    <span className="bg-amber-950 text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-semibold">{selectedProfile.total_points} pts</span>
                  )}
                </div>

                {selectedProfile.referral_code && (
                  <div className="mt-4 bg-[#1a1a2e] px-4 py-2.5 rounded-lg inline-block">
                    <span className="text-[10px] tracking-[2px] text-slate-600 uppercase mr-2">Code</span>
                    <span className="text-purple-400 font-semibold text-sm">{selectedProfile.referral_code}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-6">
                  {[
                    ["City", selectedProfile.city],
                    ["Age", selectedProfile.age],
                    ["Phone", selectedProfile.phone],
                    ["Instagram", selectedProfile.instagram],
                    ["TikTok", selectedProfile.tiktok],
                    ["Industry", selectedProfile.industry],
                    ["Job Title", selectedProfile.job_title],
                    ["Shopping Style", selectedProfile.shopping_style],
                    ["Event Frequency", selectedProfile.event_frequency],
                    ["Travel Style", selectedProfile.travel_style],
                    ["Ideal Night Out", selectedProfile.ideal_night_out],
                    ["Neighbourhoods", selectedProfile.favourite_neighbourhoods],
                    ["How Heard", selectedProfile.how_heard],
                    ["Referred By", selectedProfile.referral],
                    ["Joined", new Date(selectedProfile.created_at).toLocaleDateString()],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-[10px] tracking-[2px] text-slate-600 uppercase mb-1">{label}</p>
                      <p className="text-sm text-slate-300">{value || "—"}</p>
                    </div>
                  ))}
                </div>

                {(selectedProfile.interests || []).length > 0 && (
                  <div className="mt-5">
                    <p className="text-[10px] tracking-[2px] text-slate-600 uppercase mb-2">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProfile.interests!.map((i) => (
                        <span key={i} className="bg-indigo-950 text-purple-400 px-2.5 py-1 rounded-full text-xs">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const classes = {
    approved: "bg-emerald-950 text-emerald-400",
    pending: "bg-amber-950 text-amber-400",
    rejected: "bg-red-950 text-red-400",
  };
  const cls = classes[status as keyof typeof classes] || "bg-slate-800 text-slate-400";
  return (
    <span className={`${cls} px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
      {status || "unknown"}
    </span>
  );
};

const TierBadge = ({ tier }: { tier: string }) => {
  const classes: Record<string, string> = {
    guest: "bg-slate-800 text-slate-400",
    shopper: "bg-emerald-950 text-emerald-400",
    buyer: "bg-sky-950 text-sky-400",
    vip: "bg-purple-950 text-purple-400",
  };
  const cls = classes[tier] || classes.guest;
  return (
    <span className={`${cls} px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
      {tier || "guest"}
    </span>
  );
};

export default Admin;
