import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CollabRequest {
  id: string;
  full_name: string;
  email: string;
  role: string;
  city: string | null;
  portfolio_url: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-950 text-amber-400",
  in_review: "bg-sky-950 text-sky-400",
  accepted: "bg-emerald-950 text-emerald-400",
  declined: "bg-red-950 text-red-400",
};

const AdminCollabs = () => {
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [selected, setSelected] = useState<CollabRequest | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase
      .from("collaboration_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests((data as any) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("collaboration_requests").update({ status } as any).eq("id", id);
    toast.success(`Status updated to ${status}`);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const replyByEmail = (req: CollabRequest) => {
    const subject = encodeURIComponent(`Offlist Collaboration — ${req.role}`);
    const body = encodeURIComponent(`Hi ${req.full_name.split(" ")[0]},\n\nThank you for your interest in collaborating with Offlist.\n\nWe've reviewed your application as ${req.role} and would love to discuss further.\n\nBest regards,\nOfflist Team`);
    window.open(`mailto:${req.email}?subject=${subject}&body=${body}`, "_blank");
  };

  const exportCSV = () => {
    const header = "Name,Email,Role,City,Portfolio,Message,Status,Date\n";
    const rows = requests.map(r => [
      `"${r.full_name}"`, `"${r.email}"`, `"${r.role}"`, `"${r.city || ""}"`,
      `"${r.portfolio_url || ""}"`, `"${(r.message || "").replace(/"/g, '""')}"`,
      `"${r.status}"`, `"${new Date(r.created_at).toLocaleDateString()}"`,
    ].join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `offlist-collabs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${requests.length} records`);
  };

  if (loading) return <p className="text-slate-500 animate-pulse">Loading…</p>;

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-2xl font-bold tracking-wider text-slate-50">Collaborations</h2>
        <button onClick={exportCSV} disabled={requests.length === 0} className="bg-sky-950 text-sky-400 border border-sky-900 px-4 py-2 rounded-lg cursor-pointer text-[13px] hover:bg-sky-900 transition-colors disabled:opacity-30">↓ Export CSV</button>
      </div>

      {requests.length === 0 ? (
        <p className="text-slate-600 text-[13px] text-center py-10">No collaboration requests yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1e1e2e]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Email", "Role", "City", "Status", "Date", ""].map(h => (
                  <th key={h} className="p-3 text-left text-[11px] tracking-[2px] text-slate-600 bg-[#0f0f1a] border-b border-[#1e1e2e] font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className="border-b border-[#1a1a2e] hover:bg-[#0f0f1a]/50 cursor-pointer transition-colors" onClick={() => setSelected(r)}>
                  <td className="p-3 text-[13px] text-slate-200">{r.full_name}</td>
                  <td className="p-3 text-[13px] text-slate-400">{r.email}</td>
                  <td className="p-3 text-[13px] text-purple-400">{r.role}</td>
                  <td className="p-3 text-[13px] text-slate-400">{r.city || "—"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[r.status] || statusColors.pending}`}>
                      {r.status === "in_review" ? "In Review" : r.status}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <button onClick={(e) => { e.stopPropagation(); replyByEmail(r); }} className="text-[10px] text-sky-400 hover:text-sky-300 bg-transparent border-none cursor-pointer">✉ Reply</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-out panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0f0f1a] border-l border-[#1e1e2e] z-50 overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-50">{selected.full_name}</h3>
                <p className="text-sm text-slate-500">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-slate-300 text-lg bg-transparent border-none cursor-pointer">✕</button>
            </div>

            <div className="flex gap-2 mb-5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[selected.status] || statusColors.pending}`}>
                {selected.status === "in_review" ? "In Review" : selected.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-400">{selected.role}</span>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              {[
                ["City", selected.city],
                ["Portfolio", selected.portfolio_url ? <a href={selected.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline break-all">{selected.portfolio_url}</a> : null],
                ["Submitted", new Date(selected.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-[10px] tracking-[2px] text-slate-600 uppercase mb-1">{label}</p>
                  <p className="text-sm text-slate-300">{val || "—"}</p>
                </div>
              ))}
            </div>

            {selected.message && (
              <div className="mb-6">
                <p className="text-[10px] tracking-[2px] text-slate-600 uppercase mb-1">Message</p>
                <p className="text-sm text-slate-300 leading-relaxed bg-[#0a0a14] p-4 rounded-lg">{selected.message}</p>
              </div>
            )}

            <div className="mb-6">
              <p className="text-[10px] tracking-[2px] text-slate-600 uppercase mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {["pending", "in_review", "accepted", "declined"].map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] cursor-pointer border transition-colors ${
                      selected.status === s ? "border-purple-500 bg-purple-950 text-purple-400" : "border-[#1e1e2e] bg-transparent text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {s === "in_review" ? "In Review" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] tracking-[2px] text-slate-600 uppercase mb-2">Private Note</p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-[#0a0a14] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none min-h-[80px] resize-y focus:border-purple-800 transition-colors"
                placeholder="Internal notes…"
              />
            </div>

            <button
              onClick={() => replyByEmail(selected)}
              className="w-full bg-sky-600 text-white border-none py-3 rounded-lg cursor-pointer text-[13px] font-semibold hover:bg-sky-500 transition-colors"
            >
              ✉ Reply by Email
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCollabs;
