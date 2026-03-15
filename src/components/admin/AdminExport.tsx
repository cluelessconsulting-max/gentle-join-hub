import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const downloadCSV = (data: any[], filename: string) => {
  if (!data.length) {
    toast.error("No data to export");
    return;
  }
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = Array.isArray(val) ? val.join("; ") : String(val ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${data.length} rows`);
};

const AdminExport = () => {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportData = async (type: string) => {
    setExporting(type);
    try {
      if (type === "members") {
        const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        downloadCSV((data as any) || [], "offlist-members");
      } else if (type === "events") {
        const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
        downloadCSV((data as any) || [], "offlist-events");
      } else if (type === "registrations") {
        const { data } = await supabase.from("event_registrations" as any).select("*").order("registered_at", { ascending: false });
        downloadCSV((data as any) || [], "offlist-registrations");
      } else if (type === "purchases") {
        const { data } = await supabase.from("purchases" as any).select("*").order("created_at", { ascending: false });
        downloadCSV((data as any) || [], "offlist-purchases");
      } else if (type === "audit") {
        const { data } = await supabase.from("audit_log" as any).select("*").order("created_at", { ascending: false });
        downloadCSV((data as any) || [], "offlist-audit-log");
      }
    } catch {
      toast.error("Export failed");
    }
    setExporting(null);
  };

  const exports = [
    { id: "members", label: "Members & Profiles", icon: "◉", desc: "All profile data including application status, interests, city" },
    { id: "events", label: "Events", icon: "◎", desc: "All events with capacity, location, dates" },
    { id: "registrations", label: "Event Registrations", icon: "◈", desc: "All event sign-ups with status and timestamps" },
    { id: "purchases", label: "Purchases", icon: "◆", desc: "All purchase records with amounts and brand names" },
    { id: "audit", label: "Audit Log", icon: "◌", desc: "All admin actions and system events" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-slate-50">Export Data</h2>
      <p className="text-slate-400 text-sm mb-6">Download CSV files for reporting and backup.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exports.map((exp) => (
          <div key={exp.id} className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5 flex items-center gap-4">
            <span className="text-2xl text-purple-400">{exp.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-slate-200 font-semibold">{exp.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{exp.desc}</p>
            </div>
            <button
              onClick={() => exportData(exp.id)}
              disabled={exporting === exp.id}
              className="bg-[#1a1a2e] text-slate-300 border border-[#2a2a3e] px-4 py-2 rounded-lg cursor-pointer text-[11px] tracking-wider hover:border-purple-600 hover:text-purple-400 transition-colors disabled:opacity-40"
            >
              {exporting === exp.id ? "Exporting…" : "↓ CSV"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminExport;
