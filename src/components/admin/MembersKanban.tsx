import { Instagram } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
  instagram: string | null;
  tiktok: string | null;
  application_status: string;
  created_at: string;
  buyer_tier: string;
  interests: string[] | null;
  [key: string]: any;
}

interface Props {
  profiles: Profile[];
  allProfiles: Profile[];
  updatingId: string | null;
  updateStatus: (profileId: string, status: string) => Promise<void>;
  syncToBrevo: (profile: Profile) => Promise<void>;
  onSelectProfile: (profile: Profile) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filter: { city: string; interest: string; status: string };
  setFilter: (f: { city: string; interest: string; status: string }) => void;
  onEmailGroup: (status: string) => void;
}

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="16" height="16">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z" />
  </svg>
);

const columns = [
  { status: "pending", label: "PENDING", color: "amber", borderColor: "border-amber-500/30", badgeBg: "bg-amber-950", badgeText: "text-amber-400", headerBg: "bg-amber-500/5" },
  { status: "approved", label: "APPROVED", color: "emerald", borderColor: "border-emerald-500/30", badgeBg: "bg-emerald-950", badgeText: "text-emerald-400", headerBg: "bg-emerald-500/5" },
  { status: "rejected", label: "REJECTED", color: "red", borderColor: "border-red-500/30", badgeBg: "bg-red-950", badgeText: "text-red-400", headerBg: "bg-red-500/5" },
];

const TierBadge = ({ tier }: { tier: string }) => {
  const classes: Record<string, string> = {
    guest: "bg-slate-800 text-slate-400",
    shopper: "bg-emerald-950 text-emerald-400",
    buyer: "bg-sky-950 text-sky-400",
    vip: "bg-purple-950 text-purple-400",
  };
  return (
    <span className={`${classes[tier] || classes.guest} px-2 py-0.5 rounded-full text-[10px] font-semibold`}>
      {tier || "guest"}
    </span>
  );
};

const SocialIcon = ({ type, handle }: { type: "instagram" | "tiktok"; handle: string | null }) => {
  const hasHandle = !!handle?.trim();
  const url = type === "instagram"
    ? `https://instagram.com/${handle?.replace(/^@/, '')}`
    : `https://tiktok.com/@${handle?.replace(/^@/, '')}`;

  if (!hasHandle) {
    return (
      <span className="text-slate-700 cursor-default" title={`No ${type}`}>
        {type === "instagram" ? <Instagram size={14} /> : <TikTokIcon className="text-slate-700" />}
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`${type === "instagram" ? "text-pink-400 hover:text-pink-300" : "text-cyan-400 hover:text-cyan-300"} transition-colors`}
      title={handle || ""}
    >
      {type === "instagram" ? <Instagram size={14} /> : <TikTokIcon className={type === "tiktok" ? "text-cyan-400 hover:text-cyan-300" : ""} />}
    </a>
  );
};

const MembersKanban = ({
  profiles,
  allProfiles,
  updatingId,
  updateStatus,
  syncToBrevo,
  onSelectProfile,
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  onEmailGroup,
}: Props) => {

  const getColumnProfiles = (status: string) =>
    profiles.filter((p) => p.application_status === status);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-wider text-slate-50 mb-5">Members</h2>

      {/* Filters */}
      <div className="flex gap-2.5 flex-wrap mb-6 items-center">
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
        <span className="text-slate-600 text-xs">{profiles.length} results</span>
      </div>

      {/* Kanban Columns */}
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
                <button
                  onClick={() => onEmailGroup(col.status)}
                  className={`${col.badgeBg} ${col.badgeText} border-none rounded-md px-2.5 py-1 cursor-pointer text-[10px] tracking-wider hover:opacity-80 transition-opacity`}
                  title={`Email all ${col.label.toLowerCase()}`}
                >
                  ✉ Email all
                </button>
              </div>

              {/* Cards */}
              <div className="p-2 flex flex-col gap-1.5 max-h-[65vh] overflow-y-auto">
                {colProfiles.length === 0 && (
                  <p className="text-center text-slate-700 text-[12px] py-8">No members</p>
                )}
                {colProfiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProfile(p)}
                    className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg p-3 cursor-pointer hover:border-slate-600 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[13px] text-slate-200 font-medium truncate max-w-[140px]">{p.full_name || "—"}</span>
                      <div className="flex items-center gap-1.5">
                        <SocialIcon type="instagram" handle={p.instagram} />
                        <SocialIcon type="tiktok" handle={p.tiktok} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[11px] text-slate-500">{p.city || "No city"}</span>
                      <span className="text-slate-700">·</span>
                      <TierBadge tier={p.buyer_tier} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600">{new Date(p.created_at).toLocaleDateString()}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {col.status !== "approved" && (
                          <button
                            onClick={() => updateStatus(p.id, "approved")}
                            disabled={updatingId === p.id}
                            className="bg-emerald-950 text-emerald-400 border-none rounded px-2 py-0.5 cursor-pointer text-[11px] hover:bg-emerald-900 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {col.status !== "rejected" && (
                          <button
                            onClick={() => updateStatus(p.id, "rejected")}
                            disabled={updatingId === p.id}
                            className="bg-red-950 text-red-400 border-none rounded px-2 py-0.5 cursor-pointer text-[11px] hover:bg-red-900 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            ✕
                          </button>
                        )}
                        {col.status === "rejected" && (
                          <button
                            onClick={() => updateStatus(p.id, "pending")}
                            disabled={updatingId === p.id}
                            className="bg-amber-950 text-amber-400 border-none rounded px-2 py-0.5 cursor-pointer text-[11px] hover:bg-amber-900 transition-colors disabled:opacity-50"
                            title="Move to Pending"
                          >
                            ↩ Pending
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MembersKanban;
