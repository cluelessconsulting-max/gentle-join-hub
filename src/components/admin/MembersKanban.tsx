import { useState, useRef, useEffect } from "react";
import { Instagram, StickyNote, Copy, ExternalLink, Download, X, Search, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ConfirmDialog from "./ConfirmDialog";

export interface Profile {
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

interface Props {
  profiles: Profile[];
  allProfiles: Profile[];
  updatingId: string | null;
  updateStatus: (profileId: string, status: string) => Promise<void>;
  syncToBrevo: (profile: Profile) => Promise<void>;
  onSelectProfile: (profile: Profile) => void;
  onEmailGroup: (status: string) => void;
  onApproveWithEmail: (profile: Profile) => void;
  onProfilesChanged: () => void;
}

// ─── Helpers ───
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="14" height="14">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z" />
  </svg>
);

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const cityEmoji: Record<string, string> = {
  london: "🇬🇧", milan: "🇮🇹", milano: "🇮🇹", paris: "🇫🇷", "new york": "🇺🇸", nyc: "🇺🇸", dubai: "🇦🇪", berlin: "🇩🇪", madrid: "🇪🇸", barcelona: "🇪🇸", amsterdam: "🇳🇱", lisbon: "🇵🇹", roma: "🇮🇹", rome: "🇮🇹",
};
const getCityEmoji = (city: string | null) => {
  if (!city) return "🌍";
  return cityEmoji[city.toLowerCase().trim()] || "🌍";
};

const scoreColor = (score: number) => {
  if (score >= 71) return { bar: "bg-emerald-500", text: "text-emerald-400" };
  if (score >= 41) return { bar: "bg-amber-500", text: "text-amber-400" };
  return { bar: "bg-red-500", text: "text-red-400" };
};

const columns = [
  { status: "pending", label: "PENDING", borderColor: "border-amber-500/30", badgeBg: "bg-amber-950", badgeText: "text-amber-400", headerBg: "bg-amber-500/5" },
  { status: "approved", label: "APPROVED", borderColor: "border-emerald-500/30", badgeBg: "bg-emerald-950", badgeText: "text-emerald-400", headerBg: "bg-emerald-500/5" },
  { status: "rejected", label: "REJECTED", borderColor: "border-red-500/30", badgeBg: "bg-red-950", badgeText: "text-red-400", headerBg: "bg-red-500/5" },
];

const interestColors: Record<string, string> = {
  "Fashion & Style": "bg-pink-950 text-pink-400",
  "Music & Nightlife": "bg-purple-950 text-purple-400",
  "Art & Design": "bg-indigo-950 text-indigo-400",
  "Gastronomy & Social Dining": "bg-orange-950 text-orange-400",
  "Fitness & Wellness": "bg-green-950 text-green-400",
  "Travel & Culture": "bg-sky-950 text-sky-400",
  "Luxury & Lifestyle": "bg-amber-950 text-amber-400",
};

const TierBadge = ({ tier }: { tier: string }) => {
  const classes: Record<string, string> = {
    guest: "bg-slate-800 text-slate-400",
    shopper: "bg-emerald-950 text-emerald-400",
    buyer: "bg-sky-950 text-sky-400",
    vip: "bg-purple-950 text-purple-400",
  };
  return <span className={`${classes[tier] || classes.guest} px-2 py-0.5 rounded-full text-[10px] font-semibold`}>{tier || "guest"}</span>;
};

// ─── Social Tooltip ───
const SocialTooltip = ({ type, handle }: { type: "instagram" | "tiktok"; handle: string | null }) => {
  const [show, setShow] = useState(false);
  const hasHandle = !!handle?.trim();
  const cleanHandle = handle?.replace(/^@/, '') || '';
  const url = type === "instagram" ? `https://instagram.com/${cleanHandle}` : `https://tiktok.com/@${cleanHandle}`;
  const colorClass = type === "instagram" ? "text-pink-400 hover:text-pink-300" : "text-cyan-400 hover:text-cyan-300";
  const disabledClass = "text-slate-700 cursor-default";

  return (
    <div className="relative" onMouseEnter={() => hasHandle && setShow(true)} onMouseLeave={() => setShow(false)}>
      {hasHandle ? (
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`${colorClass} transition-colors`}>
          {type === "instagram" ? <Instagram size={14} /> : <TikTokIcon className="" />}
        </a>
      ) : (
        <span className={disabledClass}>
          {type === "instagram" ? <Instagram size={14} /> : <TikTokIcon className="text-slate-700" />}
        </span>
      )}
      {show && hasHandle && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-3 z-50 min-w-[180px] shadow-xl" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-slate-400 mb-2">@{cleanHandle}</p>
          <div className="flex gap-1.5">
            <button onClick={() => { navigator.clipboard.writeText(cleanHandle); toast.success("Copied!"); }} className="flex items-center gap-1 bg-[#0f0f1a] text-slate-300 border border-[#2a2a3e] rounded px-2 py-1 text-[10px] cursor-pointer hover:border-slate-500 transition-colors">
              <Copy size={10} /> Copy
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-[#0f0f1a] text-slate-300 border border-[#2a2a3e] rounded px-2 py-1 text-[10px] no-underline hover:border-slate-500 transition-colors">
              <ExternalLink size={10} /> View
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Notes Popover ───
const NoteButton = ({ profile, onSaved }: { profile: Profile; onSaved: () => void }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(profile.admin_notes || "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setNote(profile.admin_notes || ""); }, [profile.admin_notes]);

  const saveNote = async () => {
    await supabase.from("profiles").update({ admin_notes: note || null } as any).eq("id", profile.id);
    onSaved();
    setOpen(false);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="relative bg-transparent border-none cursor-pointer text-slate-500 hover:text-slate-300 transition-colors p-0"
        title="Notes"
      >
        <StickyNote size={13} />
        {profile.admin_notes && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
      </button>
      {open && (
        <div ref={ref} className="absolute bottom-full right-0 mb-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-3 z-50 w-[220px] shadow-xl">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Private admin note…"
            className="w-full bg-[#0f0f1a] border border-[#2a2a3e] text-slate-200 text-xs rounded p-2 outline-none resize-none h-16 focus:border-purple-800 transition-colors"
          />
          <div className="flex justify-end gap-1.5 mt-1.5">
            <button onClick={() => setOpen(false)} className="text-[10px] text-slate-500 bg-transparent border-none cursor-pointer hover:text-slate-300">Cancel</button>
            <button onClick={saveNote} className="text-[10px] bg-purple-600 text-white border-none rounded px-2.5 py-1 cursor-pointer hover:bg-purple-500 transition-colors">Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Score Bar ───
const ScoreBar = ({ score }: { score: number }) => {
  const { bar, text } = scoreColor(score);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden min-w-[40px]">
        <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-[10px] font-semibold ${text} min-w-[22px] text-right`}>{score}</span>
    </div>
  );
};

// ─── CSV Export ───
const exportCSV = (profiles: Profile[]) => {
  const headers = ["Name", "Email", "City", "Instagram", "TikTok", "Tier", "Status", "Score", "Interests", "Signup Date"];
  const rows = profiles.map(p => [
    p.full_name || "", p.email || "", p.city || "", p.instagram || "", p.tiktok || "",
    p.buyer_tier, p.application_status, p.application_score?.toString() || "0",
    (p.interests || []).join("; "), new Date(p.created_at).toLocaleDateString()
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `offlist-members-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
};

// ─── Main Component ───
const MembersKanban = ({
  profiles,
  allProfiles,
  updatingId,
  updateStatus,
  syncToBrevo,
  onSelectProfile,
  onEmailGroup,
  onApproveWithEmail,
  onProfilesChanged,
}: Props) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterInterests, setFilterInterests] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [hasIG, setHasIG] = useState(false);
  const [hasTT, setHasTT] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; profileId?: string; name?: string; count?: number } | null>(null);

  const allInterests = ["Fashion & Style", "Music & Nightlife", "Art & Design", "Gastronomy & Social Dining", "Fitness & Wellness", "Travel & Culture", "Luxury & Lifestyle"];
  const allCities = [...new Set(allProfiles.map(p => p.city).filter(Boolean) as string[])].sort();

  const filtered = profiles.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || [p.full_name, p.email, p.instagram, p.tiktok].some(f => f?.toLowerCase().includes(q));
    const matchCity = !filterCity || p.city?.toLowerCase().includes(filterCity.toLowerCase());
    const matchInterests = filterInterests.length === 0 || filterInterests.some(fi => (p.interests || []).includes(fi));
    const score = p.application_score || 0;
    const matchScore = score >= scoreRange[0] && score <= scoreRange[1];
    const matchIG = !hasIG || !!p.instagram?.trim();
    const matchTT = !hasTT || !!p.tiktok?.trim();
    return matchSearch && matchCity && matchInterests && matchScore && matchIG && matchTT;
  });

  const getColumnProfiles = (status: string) => {
    const col = filtered.filter(p => p.application_status === status);
    if (status === "pending") return col.sort((a, b) => (b.application_score || 0) - (a.application_score || 0));
    return col;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const autoApproveAbove80 = async () => {
    const pending = getColumnProfiles("pending").filter(p => (p.application_score || 0) >= 80);
    if (pending.length === 0) { toast.info("No applicants above 80"); return; }
    setConfirmAction({ type: "auto_approve", count: pending.length });
  };

  const bulkAction = async (action: string) => {
    const selected = allProfiles.filter(p => selectedIds.includes(p.id));
    if (action === "export") { exportCSV(selected); return; }
    if (action === "email") { onEmailGroup("selected"); return; }
    // Require confirmation for destructive bulk actions
    if (action === "approved" || action === "rejected") {
      setConfirmAction({ type: `bulk_${action}`, count: selected.length });
      return;
    }
    await executeBulkAction(action);
  };

  const executeBulkAction = async (action: string) => {
    const selected = allProfiles.filter(p => selectedIds.includes(p.id));
    for (const p of selected) {
      await updateStatus(p.id, action);
    }
    setSelectedIds([]);
    toast.success(`${selected.length} members updated`);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === "reject" && confirmAction.profileId) {
      await updateStatus(confirmAction.profileId, "rejected");
    } else if (confirmAction.type === "bulk_approved") {
      await executeBulkAction("approved");
    } else if (confirmAction.type === "bulk_rejected") {
      await executeBulkAction("rejected");
    } else if (confirmAction.type === "auto_approve") {
      const pending = getColumnProfiles("pending").filter(p => (p.application_score || 0) >= 80);
      for (const p of pending) {
        await updateStatus(p.id, "approved");
      }
      toast.success(`Auto-approved ${pending.length} members`);
    }
    setConfirmAction(null);
  };

  const hasActiveFilters = searchQuery || filterCity || filterInterests.length > 0 || scoreRange[0] > 0 || scoreRange[1] < 100 || hasIG || hasTT;

  const resetFilters = () => {
    setSearchQuery(""); setFilterCity(""); setFilterInterests([]); setScoreRange([0, 100]); setHasIG(false); setHasTT(false);
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-wider text-slate-50">Members</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`bg-[#0f0f1a] border ${showFilters ? 'border-purple-600' : 'border-[#1e1e2e]'} text-slate-300 px-3 py-2 rounded-lg cursor-pointer text-[12px] hover:border-purple-800 transition-colors flex items-center gap-1.5`}>
            <Search size={12} /> Filters {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
          </button>
          <button onClick={() => exportCSV(filtered)} className="bg-[#0f0f1a] border border-[#1e1e2e] text-slate-300 px-3 py-2 rounded-lg cursor-pointer text-[12px] hover:border-purple-800 transition-colors flex items-center gap-1.5">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* ─── Advanced Filters ─── */}
      {showFilters && (
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-4 mb-4 space-y-3">
          <div className="flex gap-2.5 flex-wrap items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                className="w-full bg-[#0a0a12] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none focus:border-purple-800 transition-colors"
                placeholder="Search name, email, IG, TikTok…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="bg-[#0a0a12] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none cursor-pointer"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
            >
              <option value="">All cities</option>
              {allCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {allInterests.map(interest => (
              <button
                key={interest}
                onClick={() => setFilterInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest])}
                className={`px-2.5 py-1 rounded-full text-[10px] border-none cursor-pointer transition-all ${filterInterests.includes(interest) ? interestColors[interest] || 'bg-purple-950 text-purple-400' : 'bg-[#1a1a2e] text-slate-500 hover:text-slate-300'}`}
              >
                {interest.split(" & ")[0]}
              </button>
            ))}
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 tracking-wider">SCORE</span>
              <input type="range" min={0} max={100} value={scoreRange[0]} onChange={(e) => setScoreRange([+e.target.value, scoreRange[1]])} className="w-16 accent-purple-500" />
              <span className="text-[11px] text-slate-400">{scoreRange[0]}-{scoreRange[1]}</span>
              <input type="range" min={0} max={100} value={scoreRange[1]} onChange={(e) => setScoreRange([scoreRange[0], +e.target.value])} className="w-16 accent-purple-500" />
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={hasIG} onChange={(e) => setHasIG(e.target.checked)} className="accent-pink-500" />
              <span className="text-[11px] text-slate-400">Has Instagram</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={hasTT} onChange={(e) => setHasTT(e.target.checked)} className="accent-cyan-500" />
              <span className="text-[11px] text-slate-400">Has TikTok</span>
            </label>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-[11px] text-slate-500 bg-transparent border-none cursor-pointer hover:text-slate-300 transition-colors">
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-600">{filtered.length} members match</p>
        </div>
      )}

      {/* ─── Kanban Columns ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {columns.map((col) => {
          const colProfiles = getColumnProfiles(col.status);
          return (
            <div key={col.status} className={`border ${col.borderColor} rounded-xl bg-[#0a0a12] overflow-hidden`}>
              {/* Column Header */}
              <div className={`${col.headerBg} px-4 py-3 flex items-center justify-between border-b ${col.borderColor}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] tracking-[2px] font-semibold ${col.badgeText}`}>{col.label}</span>
                  <span className={`${col.badgeBg} ${col.badgeText} text-[10px] font-bold rounded-full min-w-[22px] h-5 flex items-center justify-center px-1.5`}>
                    {colProfiles.length}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {col.status === "pending" && (
                    <button
                      onClick={autoApproveAbove80}
                      className="bg-emerald-950 text-emerald-400 border-none rounded-md px-2 py-1 cursor-pointer text-[10px] tracking-wider hover:bg-emerald-900 transition-colors"
                      title="Auto-approve all applicants with score ≥ 80"
                    >
                      ⚡ Auto 80+
                    </button>
                  )}
                  <button
                    onClick={() => onEmailGroup(col.status)}
                    className={`${col.badgeBg} ${col.badgeText} border-none rounded-md px-2 py-1 cursor-pointer text-[10px] tracking-wider hover:opacity-80 transition-opacity`}
                  >
                    ✉ Email
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="p-2 flex flex-col gap-1.5 max-h-[65vh] overflow-y-auto">
                {colProfiles.length === 0 && (
                  <p className="text-center text-slate-700 text-[12px] py-8">No members</p>
                )}
                {colProfiles.map((p, idx) => {
                  const score = p.application_score || 0;
                  const interests = p.interests || [];
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => onSelectProfile(p)}
                      className={`bg-[#0f0f1a] border rounded-lg p-3 cursor-pointer hover:border-slate-600 transition-all group ${isSelected ? 'border-purple-500 bg-purple-950/20' : 'border-[#1e1e2e]'}`}
                    >
                      {/* Row 1: Name + Tier + Score */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => { e.stopPropagation(); toggleSelect(p.id); }}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-purple-500 shrink-0"
                        />
                        <span className="text-[13px] text-slate-200 font-medium truncate flex-1">{p.full_name || "—"}</span>
                        <TierBadge tier={p.buyer_tier} />
                      </div>

                      {/* Score bar */}
                      <div className="mb-1.5">
                        <ScoreBar score={score} />
                      </div>

                      {/* Row 2: City + Date */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[12px]">{getCityEmoji(p.city)}</span>
                        <span className="text-[11px] text-slate-500">{p.city || "No city"}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-[10px] text-slate-600">{timeAgo(p.created_at)}</span>
                      </div>

                      {/* Row 3: Interest pills */}
                      {interests.length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-1.5">
                          {interests.slice(0, 3).map(i => (
                            <span key={i} className={`${interestColors[i] || 'bg-slate-800 text-slate-400'} px-1.5 py-0.5 rounded text-[9px]`}>
                              {i.split(" & ")[0]}
                            </span>
                          ))}
                          {interests.length > 3 && (
                            <span className="text-[9px] text-slate-600">+{interests.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Row 4: Social + Notes */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SocialTooltip type="instagram" handle={p.instagram} />
                          <SocialTooltip type="tiktok" handle={p.tiktok} />
                          <NoteButton profile={p} onSaved={onProfilesChanged} />
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {col.status !== "approved" && (
                            <button
                              onClick={() => onApproveWithEmail(p)}
                              disabled={updatingId === p.id}
                              className="bg-emerald-950 text-emerald-400 border-none rounded px-2 py-0.5 cursor-pointer text-[10px] hover:bg-emerald-900 transition-colors disabled:opacity-50"
                            >
                              ✓
                            </button>
                          )}
                          {col.status !== "rejected" && (
                            <button
                              onClick={() => setConfirmAction({ type: "reject", profileId: p.id, name: p.full_name || "this member" })}
                              disabled={updatingId === p.id}
                              className="bg-red-950 text-red-400 border-none rounded px-2 py-0.5 cursor-pointer text-[10px] hover:bg-red-900 transition-colors disabled:opacity-50"
                            >
                              ✕
                            </button>
                          )}
                          {col.status === "rejected" && (
                            <button
                              onClick={() => updateStatus(p.id, "pending")}
                              disabled={updatingId === p.id}
                              className="bg-amber-950 text-amber-400 border-none rounded px-2 py-0.5 cursor-pointer text-[10px] hover:bg-amber-900 transition-colors disabled:opacity-50"
                            >
                              ↩
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Bulk Actions Bar ─── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl px-6 py-3 flex items-center gap-3 shadow-2xl z-50 animate-fade-up">
          <span className="text-sm text-slate-300 font-semibold">{selectedIds.length} selected</span>
          <div className="w-px h-6 bg-[#2a2a3e]" />
          <button onClick={() => bulkAction("approved")} className="bg-emerald-950 text-emerald-400 border-none rounded-lg px-3 py-1.5 cursor-pointer text-[11px] tracking-wider hover:bg-emerald-900 transition-colors">✓ Approve</button>
          <button onClick={() => bulkAction("rejected")} className="bg-red-950 text-red-400 border-none rounded-lg px-3 py-1.5 cursor-pointer text-[11px] tracking-wider hover:bg-red-900 transition-colors">✕ Reject</button>
          <button onClick={() => bulkAction("email")} className="bg-indigo-950 text-purple-400 border-none rounded-lg px-3 py-1.5 cursor-pointer text-[11px] tracking-wider hover:bg-indigo-900 transition-colors">✉ Email</button>
          <button onClick={() => bulkAction("export")} className="bg-[#0f0f1a] text-slate-300 border border-[#2a2a3e] rounded-lg px-3 py-1.5 cursor-pointer text-[11px] tracking-wider hover:border-slate-500 transition-colors flex items-center gap-1"><Download size={11} /> CSV</button>
          <button onClick={() => setSelectedIds([])} className="text-slate-500 bg-transparent border-none cursor-pointer hover:text-slate-300 transition-colors"><X size={16} /></button>
        </div>
      )}

      {/* ─── Confirm Dialog ─── */}
      <ConfirmDialog
        open={!!confirmAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={
          confirmAction?.type === "reject" ? `Reject ${confirmAction.name}?` :
          confirmAction?.type === "bulk_approved" ? `Approve ${confirmAction?.count} members?` :
          confirmAction?.type === "bulk_rejected" ? `Reject ${confirmAction?.count} members?` :
          confirmAction?.type === "auto_approve" ? `Auto-approve ${confirmAction?.count} members?` : "Confirm"
        }
        description={
          confirmAction?.type === "reject" ? "They will not receive a welcome email. You can move them back to Pending later." :
          confirmAction?.type === "bulk_approved" ? `This will approve ${confirmAction?.count} members. They won't receive emails automatically from this action.` :
          confirmAction?.type === "bulk_rejected" ? `This will reject ${confirmAction?.count} members. This action can be undone by moving them back to Pending.` :
          confirmAction?.type === "auto_approve" ? `All ${confirmAction?.count} pending members with score ≥ 80 will be approved.` : ""
        }
        confirmLabel={confirmAction?.type?.includes("reject") ? "Reject" : "Confirm"}
        variant={confirmAction?.type?.includes("reject") ? "destructive" : "default"}
      />
    </div>
  );
};

export default MembersKanban;
