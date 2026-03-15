import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  instagram: string | null;
  phone: string | null;
  created_at: string;
  application_status: string;
}

interface DuplicateGroup {
  field: string;
  value: string;
  profiles: Profile[];
}

const AdminDuplicates = () => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, instagram, phone, created_at, application_status");

      const profiles = (data as any as Profile[]) || [];
      const groups: DuplicateGroup[] = [];

      const findDupes = (field: keyof Profile, label: string) => {
        const byValue: Record<string, Profile[]> = {};
        profiles.forEach((p) => {
          const val = (p[field] as string)?.trim().toLowerCase();
          if (val) {
            if (!byValue[val]) byValue[val] = [];
            byValue[val].push(p);
          }
        });
        Object.entries(byValue).forEach(([value, profs]) => {
          if (profs.length > 1) {
            groups.push({ field: label, value, profiles: profs });
          }
        });
      };

      findDupes("email", "Email");
      findDupes("instagram", "Instagram");
      findDupes("phone", "Phone");

      setDuplicates(groups);
      setLoading(false);
    };
    detect();
  }, []);

  if (loading) return <p className="text-slate-500 animate-pulse">Scanning for duplicates…</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-wider mb-2 text-slate-50">Duplicate Detection</h2>
      <p className="text-slate-400 text-sm mb-6">Profiles sharing the same email, Instagram, or phone number.</p>

      {duplicates.length === 0 ? (
        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-6 text-center">
          <p className="text-emerald-400 text-sm">✓ No duplicates found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {duplicates.map((group, i) => (
            <div key={i} className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400 text-sm">⚠</span>
                <span className="text-[11px] tracking-[2px] text-slate-600 uppercase">{group.field}</span>
                <span className="text-sm text-slate-300 font-mono">{group.value}</span>
                <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded-full ml-auto">
                  {group.profiles.length} matches
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {group.profiles.map((p) => (
                  <div key={p.id} className="flex justify-between items-center px-3 py-2 bg-[#0a0a12] rounded-lg text-sm">
                    <div>
                      <span className="text-slate-200">{p.full_name || "—"}</span>
                      <span className="text-slate-600 ml-2 text-xs">{p.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        p.application_status === "approved" ? "bg-emerald-950 text-emerald-400" :
                        p.application_status === "pending" ? "bg-amber-950 text-amber-400" :
                        "bg-red-950 text-red-400"
                      }`}>{p.application_status}</span>
                      <span className="text-[10px] text-slate-600">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDuplicates;
