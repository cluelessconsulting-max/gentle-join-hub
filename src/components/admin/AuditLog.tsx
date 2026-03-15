import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuditEntry {
  id: string;
  action: string;
  performed_by: string;
  target_user_name: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: any;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  member_approved: "text-emerald-800 bg-emerald-100",
  member_rejected: "text-red-800 bg-red-100",
  member_waitlisted: "text-amber-800 bg-amber-100",
  purchase_added: "text-sky-800 bg-sky-100",
  purchase_deleted: "text-red-800 bg-red-100",
  event_created: "text-accent bg-accent/15",
  event_deleted: "text-red-800 bg-red-100",
  bulk_email_sent: "text-accent bg-accent/15",
  invite_generated: "text-sky-800 bg-sky-100",
  checkin: "text-emerald-800 bg-emerald-100",
};

const AuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchLog();
  }, []);

  const fetchLog = async () => {
    const { data } = await supabase
      .from("audit_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setEntries((data as any) || []);
    setLoading(false);
  };

  const filtered = entries.filter((e) => {
    if (filterAction && !e.action.includes(filterAction)) return false;
    if (filterDate) {
      const entryDate = new Date(e.created_at).toISOString().split("T")[0];
      if (entryDate !== filterDate) return false;
    }
    return true;
  });

  const uniqueActions = [...new Set(entries.map((e) => e.action))].sort();

  const relTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm animate-pulse py-6">Loading audit log…</div>;
  }

  return (
    <div>
      <h3 className="text-[10px] tracking-[3px] text-muted-foreground uppercase mb-4">Action History</h3>

      <div className="flex gap-2.5 mb-4 flex-wrap">
        <select
          className="bg-secondary border border-border text-foreground px-3 py-2 rounded-lg text-[13px] outline-none cursor-pointer"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="">All actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>
        <input
          type="date"
          className="bg-secondary border border-border text-foreground px-3 py-2 rounded-lg text-[13px] outline-none"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        {(filterAction || filterDate) && (
          <button
            onClick={() => { setFilterAction(""); setFilterDate(""); }}
            className="text-muted-foreground text-xs bg-transparent border-none cursor-pointer hover:text-foreground"
          >
            Reset
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-[13px] py-6 text-center">No actions recorded yet</p>
      ) : (
        <div className="flex flex-col gap-1 max-h-[500px] overflow-y-auto">
          {filtered.map((e) => {
            const color = ACTION_COLORS[e.action] || "text-muted-foreground bg-secondary";
            return (
              <div key={e.id} className="flex items-start gap-3 px-4 py-3 bg-secondary rounded-lg">
                <span className={`${color} px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 mt-0.5`}>
                  {e.action.replace(/_/g, " ")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {e.target_user_name && (
                      <span className="text-[13px] text-foreground">{e.target_user_name}</span>
                    )}
                    {e.old_value && e.new_value && (
                      <span className="text-[11px] text-muted-foreground">
                        {e.old_value} → {e.new_value}
                      </span>
                    )}
                    {e.new_value && !e.old_value && (
                      <span className="text-[11px] text-foreground/70">{e.new_value}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{e.performed_by} · {relTime(e.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditLog;
