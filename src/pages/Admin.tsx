import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import AdminInvites from "@/components/admin/AdminInvites";
import AdminEventsManager from "@/components/admin/AdminEventsManager";
import AdminReferrals from "@/components/admin/AdminReferrals";
import AdminBuyers from "@/components/admin/AdminBuyers";
import MembersKanban from "@/components/admin/MembersKanban";
import AuditLog from "@/components/admin/AuditLog";
import AdminBrandPartners from "@/components/admin/AdminBrandPartners";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminDuplicates from "@/components/admin/AdminDuplicates";
import AdminExport from "@/components/admin/AdminExport";
import AdminCollabs from "@/components/admin/AdminCollabs";
import AdminScoring from "@/components/admin/AdminScoring";

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
  application_score: number | null;
  admin_notes: string | null;
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

  const [approvalProfile, setApprovalProfile] = useState<Profile | null>(null);
  const [approvalSubject, setApprovalSubject] = useState("");
  const [approvalBody, setApprovalBody] = useState("");

  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sending, setSending] = useState(false);
  const [emailConfirm, setEmailConfirm] = useState(false);

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
    const profile = profiles.find((p) => p.id === profileId);
    const oldStatus = profile?.application_status;

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
      try {
        await supabase.from("audit_log" as any).insert({
          action: `member_${status}`,
          performed_by: user?.email || "admin",
          target_user_id: profile?.user_id,
          target_user_name: profile?.full_name || profile?.email || "Unknown",
          old_value: oldStatus,
          new_value: status,
        } as any);
      } catch {}

      if (profile) {
        const updatedProfile = { ...profile, application_status: status };
        syncToBrevo(updatedProfile).catch(() => {});
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
          FULL_NAME: profile.full_name || "",
          NOME: profile.full_name?.split(" ")[0] || "",
          COGNOME: profile.full_name?.split(" ").slice(1).join(" ") || "",
          AGE: profile.age?.toString() || "",
          INSTAGRAM: profile.instagram || "",
          TIKTOK: profile.tiktok || "",
          PHONE: profile.phone || "",
          CITY: profile.city || "",
          INTERESTS: (profile.interests || []).join(", "),
          SHOPPING_STYLE: profile.shopping_style || "",
          EVENT_FREQUENCY: profile.event_frequency || "",
          REFERRAL: profile.referral || "",
          HOW_HEARD: profile.how_heard || "",
          APPLICATION_STATUS: profile.application_status || "",
          JOB_TITLE: profile.job_title || "",
          INDUSTRY: profile.industry || "",
          TRAVEL_STYLE: profile.travel_style || "",
          IDEAL_NIGHT_OUT: profile.ideal_night_out || "",
          FAVOURITE_NEIGHBOURHOODS: profile.favourite_neighbourhoods || "",
          INVITE_CODE: (profile as any).invite_code || "",
          REFERRAL_CODE: profile.referral_code || "",
          REFERRED_BY: profile.referred_by || "",
          BUYER_TIER: profile.buyer_tier || "",
          TOTAL_POINTS: profile.total_points?.toString() || "",
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

    try {
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
        toast.error("Failed to send email. Please try again.");
      } else {
        toast.success(`Email sent to ${recipients.length} people`);
        setEmailSubject("");
        setEmailBody("");
        setSelectedUsers([]);
        try {
          await supabase.from("audit_log" as any).insert({
            action: "bulk_email_sent",
            performed_by: user?.email || "admin",
            new_value: `${recipients.length} recipients`,
            metadata: { subject: emailSubject, recipientCount: recipients.length },
          } as any);
        } catch {}
      }
    } catch (e) {
      toast.error("Network error sending email. Please check your connection and retry.");
    }
    setSending(false);
  };

  const runSystemCheck = async () => {
    setChecking(true);
    const checks: CheckResult[] = [];

    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      checks.push({ name: "Database Connection", ok: !error, detail: error?.message || "Connected" });
    } catch (e: any) {
      checks.push({ name: "Database Connection", ok: false, detail: e.message });
    }

    try {
      const { data, error } = await supabase.from("profiles").select("*").limit(1);
      checks.push({ name: "Profiles Table", ok: !error, detail: error?.message || `Table OK, ${profiles.length} total rows` });
    } catch (e: any) {
      checks.push({ name: "Profiles Table", ok: false, detail: e.message });
    }

    try {
      const { data } = await supabase.auth.getUser();
      checks.push({ name: "Auth System", ok: !!data?.user, detail: data?.user?.email || "Not authenticated" });
    } catch (e: any) {
      checks.push({ name: "Auth System", ok: false, detail: e.message });
    }

    try {
      const { data, error } = await supabase.functions.invoke("brevo-admin", {
        body: { action: "get_stats" },
      });
      checks.push({ name: "Brevo API", ok: data?.success, detail: data?.success ? "Connected" : "Failed" });
    } catch (e: any) {
      checks.push({ name: "Brevo API", ok: false, detail: "Cannot reach Brevo" });
    }

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

  const cityBreakdown = profiles.reduce((acc, p) => {
    const city = p.city || "Unknown";
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sortedCities = Object.entries(cityBreakdown).sort((a, b) => b[1] - a[1]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-2xl text-accent animate-pulse font-display">Offlist</p>
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
    { id: "brands", icon: "◆", label: "Brands" },
    { id: "analytics", icon: "◈", label: "Analytics" },
    { id: "collabs", icon: "◈", label: "Collabs" },
    { id: "export", icon: "↓", label: "Export" },
    { id: "duplicates", icon: "⊘", label: "Duplicates" },
    { id: "email", icon: "◎", label: "Send Email" },
    { id: "testing", icon: "◌", label: "System Check" },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-primary text-primary-foreground font-body">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] bg-primary/95 border-r border-primary-foreground/10 p-8 px-4 flex-col gap-1 shrink-0">
        <div className="flex items-center gap-2.5 mb-7">
          <span className="font-display text-[22px] font-normal tracking-wide uppercase text-foreground">Offlist</span>
        </div>
        <p className="text-[10px] tracking-[3px] text-muted-foreground mb-2 pl-2">ADMIN</p>

        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 bg-transparent border-none text-left px-3 py-2.5 rounded-lg cursor-pointer text-[13px] tracking-wide transition-all ${
              activeTab === tab.id
                ? "bg-accent/15 text-accent"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
            {tab.badge && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}

        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className="mt-auto bg-transparent border border-border text-muted-foreground px-3 py-2 rounded-lg cursor-pointer text-xs tracking-wider hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          ↩ Sign Out
        </button>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary/95 border-t border-primary-foreground/10 flex justify-around items-center z-50 px-1 py-1 safe-area-pb">
        {tabs.slice(0, 5).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer py-2 px-2 rounded-lg min-h-[44px] min-w-[44px] transition-all ${
              activeTab === tab.id ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            <span className="text-[9px] tracking-wider">{tab.label}</span>
            {tab.badge && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive" />}
          </button>
        ))}
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-secondary border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-display text-[18px] font-normal tracking-wide uppercase text-foreground">Offlist</span>
        </div>
        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className="text-muted-foreground text-[10px] tracking-wider bg-transparent border border-border px-2.5 py-1.5 rounded cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto pb-20 md:pb-10">
        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div>
            <h2 className="font-display text-[32px] font-light tracking-wide mb-5 text-foreground">Overview</h2>

            {/* Alert Banners */}
            {(() => {
              const alerts: { text: string; tab: string; color: string }[] = [];
              const pending48h = profiles.filter(p => p.application_status === "pending" && (Date.now() - new Date(p.created_at).getTime()) > 48 * 60 * 60 * 1000);
              if (pending48h.length > 0) alerts.push({ text: `${pending48h.length} applicant${pending48h.length > 1 ? 's' : ''} waiting over 48h — review now`, tab: "members", color: "border-amber-600/50 bg-amber-50 text-amber-800" });
              return alerts.length > 0 ? (
                <div className="flex flex-col gap-2 mb-6">
                  {alerts.map((a, i) => (
                    <button key={i} onClick={() => setActiveTab(a.tab)} className={`w-full text-left border rounded-lg px-4 py-3 cursor-pointer text-[13px] tracking-wide transition-all hover:opacity-80 bg-transparent ${a.color}`}>
                      ⚠ {a.text}
                    </button>
                  ))}
                </div>
              ) : null;
            })()}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              {[
                { label: "Total", value: stats.total, color: "text-accent" },
                { label: "Approved", value: stats.approved, color: "text-emerald-700" },
                { label: "Pending", value: stats.pending, color: "text-amber-700" },
                { label: "Rejected", value: stats.rejected, color: "text-red-700" },
                { label: "Cities", value: stats.cities, color: "text-sky-700" },
              ].map((s) => (
                <div key={s.label} className="bg-secondary border border-border rounded-xl p-5">
                  <p className={`text-4xl font-display font-light ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mb-10">
              <div>
                <h3 className="text-[10px] tracking-[3px] text-muted-foreground uppercase mb-4">By City</h3>
                <div className="flex flex-col gap-0.5">
                  {sortedCities.slice(0, 10).map(([city, count]) => (
                    <div key={city} className="flex justify-between items-center px-4 py-2.5 bg-secondary rounded-lg">
                      <span className="text-sm text-foreground">{city}</span>
                      <span className="text-xs text-accent font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] tracking-[3px] text-muted-foreground uppercase mb-4">By Buyer Tier</h3>
                <div className="flex flex-col gap-0.5">
                  {sortedTiers.map(([tier, count]) => (
                    <div key={tier} className="flex justify-between items-center px-4 py-2.5 bg-secondary rounded-lg">
                      <TierBadge tier={tier} />
                      <span className="text-xs text-foreground/70 font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-10">
              <AdminScoring profiles={profiles} onSelectProfile={setSelectedProfile} />
            </div>

            <h3 className="text-[10px] tracking-[3px] text-muted-foreground uppercase mb-4">Recent Applications</h3>
            <div className="flex flex-col gap-0.5">
              {profiles.slice(0, 8).map((p) => (
                <div key={p.id} className="flex justify-between items-center px-4 py-3 bg-secondary rounded-lg">
                  <div>
                    <span className="block text-sm text-foreground">{p.full_name || "—"}</span>
                    <span className="text-[11px] text-muted-foreground">{p.city || "No city"} · {p.instagram || "No IG"}</span>
                  </div>
                  <StatusBadge status={p.application_status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <MembersKanban
            profiles={profiles}
            allProfiles={profiles}
            updatingId={updatingId}
            updateStatus={updateStatus}
            syncToBrevo={syncToBrevo}
            onSelectProfile={setSelectedProfile}
            onApproveWithEmail={(profile) => {
              setApprovalProfile(profile);
              setApprovalSubject(`Welcome to Offlist, ${profile.full_name?.split(" ")[0] || "there"}`);
              setApprovalBody(`Hi ${profile.full_name?.split(" ")[0] || "there"},\n\nYour application has been approved by our team.\n\nMake sure you follow us on Instagram and TikTok for the latest event updates.\n\nYou are now able to submit a request to be added to the guest list for the events on our website.\n\nGrazie e alla prossima!`);
            }}
            onProfilesChanged={fetchProfiles}
            onEmailGroup={(status: string) => {
              setFilter({ ...filter, status });
              setActiveTab("email");
            }}
          />
        )}

        {activeTab === "events" && <AdminEventsManager />}
        {activeTab === "buyers" && <AdminBuyers />}
        {activeTab === "invites" && user && <AdminInvites userId={user.id} />}
        {activeTab === "referrals" && <AdminReferrals />}
        {activeTab === "brands" && <AdminBrandPartners />}
        {activeTab === "analytics" && <AdminAnalytics />}
        {activeTab === "export" && <AdminExport />}
        {activeTab === "collabs" && <AdminCollabs />}
        {activeTab === "duplicates" && <AdminDuplicates />}

        {/* ── EMAIL COMPOSER ── */}
        {activeTab === "email" && (
          <div className="max-w-[680px]">
            <h2 className="font-display text-[32px] font-light tracking-wide mb-7 text-foreground">Send Email</h2>

            <p className="text-[10px] tracking-[3px] text-muted-foreground uppercase mb-2">Segment / Recipients</p>
            <div className="flex gap-2.5 flex-wrap mb-2">
              <input
                className="bg-secondary border border-border text-foreground px-3 py-2 rounded-lg text-[13px] outline-none min-w-[140px] focus:border-accent transition-colors"
                placeholder="Filter by city…"
                value={filter.city}
                onChange={(e) => setFilter({ ...filter, city: e.target.value })}
              />
              <input
                className="bg-secondary border border-border text-foreground px-3 py-2 rounded-lg text-[13px] outline-none min-w-[140px] focus:border-accent transition-colors"
                placeholder="Filter by interest…"
                value={filter.interest}
                onChange={(e) => setFilter({ ...filter, interest: e.target.value })}
              />
              <select
                className="bg-secondary border border-border text-foreground px-3 py-2 rounded-lg text-[13px] outline-none cursor-pointer"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">All statuses</option>
                <option value="approved">Approved only</option>
                <option value="pending">Pending only</option>
              </select>
            </div>
            <p className="text-accent text-[13px] mb-5">
              → {getFilteredProfiles().length} recipients match this segment
            </p>

            <p className="text-[10px] tracking-[3px] text-muted-foreground uppercase mb-1.5">Subject</p>
            <input
              className="w-full bg-secondary border border-border text-foreground px-3.5 py-2.5 rounded-lg text-sm outline-none mb-4 focus:border-accent transition-colors"
              placeholder="Email subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />

            <p className="text-[10px] tracking-[3px] text-muted-foreground uppercase mb-1.5">Message</p>
            <textarea
              className="w-full bg-secondary border border-border text-foreground px-3.5 py-3 rounded-lg text-sm outline-none mb-5 min-h-[180px] resize-y focus:border-accent transition-colors"
              placeholder="Write your message..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />

            <button
              onClick={() => setEmailConfirm(true)}
              disabled={sending || !emailSubject || !emailBody}
              className="bg-primary text-primary-foreground border-none px-7 py-3 rounded-lg cursor-pointer text-sm font-semibold tracking-wide hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              {sending ? "Sending..." : `Send to ${getFilteredProfiles().length} people`}
            </button>

            <ConfirmDialog
              open={emailConfirm}
              onCancel={() => setEmailConfirm(false)}
              onConfirm={() => { setEmailConfirm(false); sendBulkEmail(); }}
              title={`Send email to ${getFilteredProfiles().length} recipients?`}
              description={`Subject: "${emailSubject}". This will send an email to all matching members. Make sure the content is correct before proceeding.`}
              confirmLabel="Send Email"
            />

            <div className="mt-6 p-4 bg-secondary border border-border rounded-lg text-xs text-muted-foreground leading-relaxed">
              <strong>Note:</strong> Template visivi, tracking aperture e gestione bounce richiedono accesso diretto a Brevo. Questa interfaccia copre i casi d'uso principali.
            </div>
          </div>
        )}

        {/* ── SYSTEM CHECK ── */}
        {activeTab === "testing" && (
          <div>
            <h2 className="font-display text-[32px] font-light tracking-wide mb-3 text-foreground">System Check</h2>
            <p className="text-muted-foreground mb-6 text-sm">Run automated checks to verify all systems are working correctly.</p>

            <button
              onClick={runSystemCheck}
              disabled={checking}
              className="bg-primary text-primary-foreground border-none px-7 py-3 rounded-lg cursor-pointer text-sm font-semibold tracking-wide hover:bg-accent transition-colors disabled:opacity-40"
            >
              {checking ? "Running checks..." : "▶ Run All Checks"}
            </button>

            {checkResults.length > 0 && (
              <div className="flex flex-col gap-3 mt-7">
                {checkResults.map((r, i) => (
                  <div
                    key={i}
                    className={`flex gap-4 items-start bg-secondary px-5 py-3.5 rounded-xl border-l-[3px] ${
                      r.ok ? "border-l-emerald-600" : "border-l-red-600"
                    }`}
                  >
                    <span className={`text-lg ${r.ok ? "text-emerald-600" : "text-red-600"}`}>
                      {r.ok ? "✓" : "✕"}
                    </span>
                    <div>
                      <p className="text-sm text-foreground m-0">{r.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 m-0">{r.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-10">
              <AuditLog />
            </div>

            <h3 className="text-[10px] tracking-[3px] text-muted-foreground uppercase mt-10 mb-4">Manual Testing Checklist</h3>
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
                <label key={i} className="flex items-center gap-2.5 py-2.5 border-b border-border cursor-pointer text-[13px] text-foreground/70">
                  <input type="checkbox" className="accent-accent" />
                  {item}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── USER DETAIL MODAL ── */}
        {selectedProfile && (
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedProfile(null)}>
            <div className="bg-background border border-border rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-display text-xl font-light text-foreground">{selectedProfile.full_name || "—"}</h3>
                    <p className="text-sm text-muted-foreground">{selectedProfile.email}</p>
                  </div>
                   <div className="flex gap-2">
                    <button onClick={() => setSelectedProfile(null)} className="text-muted-foreground hover:text-foreground text-lg bg-transparent border-none cursor-pointer">✕</button>
                    <button
                      onClick={() => { setSelectedProfile(null); navigate(`/dashboard?impersonate=${selectedProfile.user_id}`); }}
                      className="text-[10px] bg-accent text-accent-foreground border-none px-3 py-1.5 rounded-lg cursor-pointer hover:bg-accent/80 transition-colors"
                    >
                      👁 Preview as member
                    </button>
                   </div>
                </div>

                <div className="flex gap-2">
                  <StatusBadge status={selectedProfile.application_status} />
                  <TierBadge tier={selectedProfile.buyer_tier} />
                  {selectedProfile.total_points > 0 && (
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">{selectedProfile.total_points} pts</span>
                  )}
                </div>

                {selectedProfile.referral_code && (
                  <div className="mt-4 bg-secondary px-4 py-2.5 rounded-lg inline-block">
                    <span className="text-[10px] tracking-[2px] text-muted-foreground uppercase mr-2">Code</span>
                    <span className="text-accent font-semibold text-sm">{selectedProfile.referral_code}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-6">
                  {[
                    ["City", selectedProfile.city],
                    ["Age", selectedProfile.age],
                    ["Phone", selectedProfile.phone],
                    ["Instagram", selectedProfile.instagram ? (
                      <a href={`https://instagram.com/${selectedProfile.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-pink-700 hover:text-pink-600 underline">{selectedProfile.instagram}</a>
                    ) : null],
                    ["TikTok", selectedProfile.tiktok ? (
                      <a href={`https://tiktok.com/@${selectedProfile.tiktok.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-cyan-700 hover:text-cyan-600 underline">{selectedProfile.tiktok}</a>
                    ) : null],
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
                      <p className="text-[10px] tracking-[2px] text-muted-foreground uppercase mb-1">{label}</p>
                      <p className="text-sm text-foreground/70">{value || "—"}</p>
                    </div>
                  ))}
                </div>

                {(selectedProfile.interests || []).length > 0 && (
                  <div className="mt-5">
                    <p className="text-[10px] tracking-[2px] text-muted-foreground uppercase mb-2">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProfile.interests!.map((i) => (
                        <span key={i} className="bg-accent/15 text-accent px-2.5 py-1 rounded-full text-xs">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── APPROVAL EMAIL MODAL ── */}
        {approvalProfile && (
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setApprovalProfile(null)}>
            <div className="bg-background border border-border rounded-2xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <h3 className="font-display text-lg font-light text-foreground mb-1">Approve & Email</h3>
                <p className="text-sm text-muted-foreground mb-5">{approvalProfile.full_name} — {approvalProfile.email}</p>

                <p className="text-[10px] tracking-[2px] text-muted-foreground uppercase mb-1.5">Subject</p>
                <input
                  className="w-full bg-secondary border border-border text-foreground px-3.5 py-2.5 rounded-lg text-sm outline-none mb-4 focus:border-accent transition-colors"
                  value={approvalSubject}
                  onChange={(e) => setApprovalSubject(e.target.value)}
                />

                <p className="text-[10px] tracking-[2px] text-muted-foreground uppercase mb-1.5">Message</p>
                <textarea
                  className="w-full bg-secondary border border-border text-foreground px-3.5 py-3 rounded-lg text-sm outline-none mb-5 min-h-[140px] resize-y focus:border-accent transition-colors"
                  value={approvalBody}
                  onChange={(e) => setApprovalBody(e.target.value)}
                />

                <div className="flex gap-2.5">
                  <button
                    onClick={async () => {
                      await updateStatus(approvalProfile.id, "approved");
                      setApprovalProfile(null);
                    }}
                    className="flex-1 bg-secondary text-muted-foreground border border-border py-3 rounded-lg cursor-pointer text-[11px] tracking-wider hover:border-foreground/30 transition-colors"
                  >
                    Approve without email
                  </button>
                  <button
                    onClick={async () => {
                      await updateStatus(approvalProfile.id, "approved");
                      if (approvalProfile.email) {
                        const htmlContent = approvalBody.replace(/\n/g, "<br>");
                        await supabase.functions.invoke("brevo-admin", {
                          body: {
                            action: "send_email",
                            recipients: [{ email: approvalProfile.email, name: approvalProfile.full_name || "Member" }],
                            subject: approvalSubject,
                            htmlContent: `<!DOCTYPE html><html><body style="margin:0;padding:40px 20px;background-color:#EDE8E0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0"><tr><td style="padding:0 0 24px;text-align:center;"><span style="font-size:18px;letter-spacing:4px;text-transform:uppercase;color:#0A0A0A;">OFFLIST</span></td></tr><tr><td style="padding:0 0 24px;text-align:center;"><span style="font-size:13px;color:#8B8178;line-height:1.8;">${htmlContent}</span></td></tr><tr><td style="padding:0 0 24px;text-align:center;"><a href="https://off-list.uk/#events" style="display:inline-block;background-color:#0A0A0A;color:#EDE8E0;text-decoration:none;padding:14px 36px;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Browse Events</a></td></tr></table></td></tr></table></body></html>`,
                          },
                        });
                        toast.success("Approval email sent");
                      }
                      setApprovalProfile(null);
                    }}
                    className="flex-[2] bg-emerald-700 text-white border-none py-3 rounded-lg cursor-pointer text-[11px] tracking-wider font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    ✓ Send & Approve
                  </button>
                </div>
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
    approved: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    rejected: "bg-red-100 text-red-800",
  };
  const cls = classes[status as keyof typeof classes] || "bg-secondary text-muted-foreground";
  return (
    <span className={`${cls} px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
      {status || "unknown"}
    </span>
  );
};

const TierBadge = ({ tier }: { tier: string }) => {
  const classes: Record<string, string> = {
    guest: "bg-foreground/10 text-muted-foreground",
    shopper: "bg-emerald-100 text-emerald-800",
    buyer: "bg-sky-100 text-sky-800",
    vip: "bg-accent/20 text-accent",
  };
  const cls = classes[tier] || classes.guest;
  return (
    <span className={`${cls} px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
      {tier || "guest"}
    </span>
  );
};

export default Admin;
