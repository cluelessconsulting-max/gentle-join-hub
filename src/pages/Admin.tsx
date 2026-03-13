import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
          supabase.functions.invoke("brevo-admin", {
            body: {
              action: "send_email",
              recipients: [{ email: profile.email, name: profile.full_name || "Member" }],
              subject: "Welcome to Offlist — You're In",
              htmlContent: `<h2>Welcome, ${profile.full_name || "there"}!</h2><p>Your application has been approved. You're now part of the Offlist network.</p><p>We'll be in touch about upcoming events.</p><p>— The Offlist Team</p>`,
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
          FIRSTNAME: profile.full_name?.split(" ")[0] || "",
          LASTNAME: profile.full_name?.split(" ").slice(1).join(" ") || "",
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

    // Note: we don't have email in profiles table directly
    // For now, use full_name as placeholder - in production you'd join with auth.users
    const recipients = targets.map((p) => ({
      email: p.full_name || "unknown",
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

  const filteredProfiles = getFilteredProfiles();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <p className="text-2xl text-purple-400 animate-pulse">⬡</p>
      </div>
    );
  }

  const tabs = [
    { id: "overview", icon: "◈", label: "Overview" },
    { id: "members", icon: "◉", label: "Members" },
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
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold tracking-wider text-slate-50">Members</h2>
              <button
                onClick={() => setActiveTab("email")}
                disabled={selectedUsers.length === 0}
                className="bg-indigo-950 text-purple-400 border border-indigo-900 px-4 py-2 rounded-lg cursor-pointer text-[13px] disabled:opacity-30 disabled:cursor-default hover:bg-indigo-900 transition-colors"
              >
                ✉ Email Selected ({selectedUsers.length})
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2.5 flex-wrap mb-5 items-center">
              <input
                className="bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none min-w-[140px] focus:border-purple-800 transition-colors"
                placeholder="Search name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <input
                className="bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none min-w-[140px] focus:border-purple-800 transition-colors"
                placeholder="Filter city…"
                value={filter.city}
                onChange={(e) => setFilter({ ...filter, city: e.target.value })}
              />
              <input
                className="bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none min-w-[140px] focus:border-purple-800 transition-colors"
                placeholder="Filter interest…"
                value={filter.interest}
                onChange={(e) => setFilter({ ...filter, interest: e.target.value })}
              />
              <select
                className="bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none cursor-pointer"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <span className="text-slate-600 text-xs">{filteredProfiles.length} results</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#1e1e2e]">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-[11px] tracking-[2px] text-slate-600 bg-[#0f0f1a] border-b border-[#1e1e2e]">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setSelectedUsers(e.target.checked ? filteredProfiles.map((p) => p.id) : [])
                        }
                        checked={selectedUsers.length === filteredProfiles.length && filteredProfiles.length > 0}
                      />
                    </th>
                    {["Name", "City", "Age", "IG", "Phone", "Interests", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="p-3 text-left text-[11px] tracking-[2px] text-slate-600 bg-[#0f0f1a] border-b border-[#1e1e2e] whitespace-nowrap font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((p) => (
                    <tr key={p.id} className="border-b border-[#1a1a2e] hover:bg-[#0f0f1a]/50 transition-colors">
                      <td className="p-3 text-[13px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(p.id)}
                          onChange={(e) =>
                            setSelectedUsers((prev) =>
                              e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                            )
                          }
                        />
                      </td>
                      <td className="p-3 text-[13px] text-slate-200 whitespace-nowrap">{p.full_name || "—"}</td>
                      <td className="p-3 text-[13px] text-slate-400">{p.city || "—"}</td>
                      <td className="p-3 text-[13px] text-slate-400">{p.age || "—"}</td>
                      <td className="p-3 text-[13px] text-slate-400">{p.instagram || "—"}</td>
                      <td className="p-3 text-[13px] text-slate-400">{p.phone || "—"}</td>
                      <td className="p-3 text-[11px] text-slate-400 max-w-[200px] truncate">{(p.interests || []).join(", ") || "—"}</td>
                      <td className="p-3"><StatusBadge status={p.application_status} /></td>
                      <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          {p.application_status !== "approved" && (
                            <button
                              onClick={() => updateStatus(p.id, "approved")}
                              disabled={updatingId === p.id}
                              className="bg-emerald-950 text-emerald-400 border-none rounded-md px-2.5 py-1 cursor-pointer text-[13px] hover:bg-emerald-900 transition-colors disabled:opacity-50"
                            >
                              ✓
                            </button>
                          )}
                          {p.application_status !== "rejected" && (
                            <button
                              onClick={() => updateStatus(p.id, "rejected")}
                              disabled={updatingId === p.id}
                              className="bg-red-950 text-red-400 border-none rounded-md px-2.5 py-1 cursor-pointer text-[13px] hover:bg-red-900 transition-colors disabled:opacity-50"
                            >
                              ✕
                            </button>
                          )}
                          <button
                            onClick={() => syncToBrevo(p)}
                            className="bg-indigo-950 text-purple-400 border-none rounded-md px-2.5 py-1 cursor-pointer text-[11px] hover:bg-indigo-900 transition-colors"
                          >
                            ↑ Brevo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProfiles.length === 0 && (
              <p className="text-center text-slate-600 text-[13px] py-16">No members found.</p>
            )}
          </div>
        )}

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

export default Admin;
