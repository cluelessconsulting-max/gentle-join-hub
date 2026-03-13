import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Invite {
  id: string;
  code: string;
  created_by: string | null;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

const AdminInvites = ({ userId }: { userId: string }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteOnly, setInviteOnly] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(1);

  useEffect(() => {
    fetchInvites();
    fetchSetting();
  }, []);

  const fetchInvites = async () => {
    const { data } = await supabase
      .from("invites" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInvites(data as any);
  };

  const fetchSetting = async () => {
    const { data } = await supabase
      .from("app_settings" as any)
      .select("value")
      .eq("key", "invite_only")
      .single();
    if (data) setInviteOnly((data as any).value?.enabled === true);
  };

  const toggleInviteOnly = async () => {
    const newVal = !inviteOnly;
    await supabase
      .from("app_settings" as any)
      .update({ value: { enabled: newVal } } as any)
      .eq("key", "invite_only");
    setInviteOnly(newVal);
    toast.success(newVal ? "Invite-only mode enabled" : "Invite-only mode disabled");
  };

  const generateCodes = async () => {
    setGenerating(true);
    const codes = Array.from({ length: count }, () =>
      Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("")
    );

    const rows = codes.map((code) => ({
      code,
      created_by: userId,
    }));

    const { error } = await supabase.from("invites" as any).insert(rows as any);
    if (error) {
      toast.error("Failed to generate codes");
    } else {
      toast.success(`Generated ${count} invite code(s)`);
      fetchInvites();
    }
    setGenerating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied!");
  };

  const unused = invites.filter((i) => !i.used_by);
  const used = invites.filter((i) => i.used_by);

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-2xl font-bold tracking-wider text-slate-50">Invite Codes</h2>
        <button
          onClick={toggleInviteOnly}
          className={`px-4 py-2 rounded-lg text-[13px] border transition-colors cursor-pointer ${
            inviteOnly
              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
              : "bg-[#0f0f1a] text-slate-400 border-[#1e1e2e]"
          }`}
        >
          Invite-only: {inviteOnly ? "ON" : "OFF"}
        </button>
      </div>

      {/* Generate */}
      <div className="flex gap-3 items-center mb-7">
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
          className="bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none w-20"
        />
        <button
          onClick={generateCodes}
          disabled={generating}
          className="bg-purple-600 text-white border-none px-5 py-2 rounded-lg cursor-pointer text-[13px] font-semibold hover:bg-purple-500 transition-colors disabled:opacity-40"
        >
          {generating ? "Generating..." : "Generate Codes"}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-7">
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-4 flex-1">
          <p className="text-2xl font-bold text-purple-400">{invites.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-4 flex-1">
          <p className="text-2xl font-bold text-emerald-400">{unused.length}</p>
          <p className="text-xs text-slate-500 mt-1">Available</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-4 flex-1">
          <p className="text-2xl font-bold text-amber-400">{used.length}</p>
          <p className="text-xs text-slate-500 mt-1">Used</p>
        </div>
      </div>

      {/* Unused codes */}
      <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-3">Available Codes</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
        {unused.map((inv) => (
          <div
            key={inv.id}
            onClick={() => copyCode(inv.code)}
            className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-center cursor-pointer hover:border-purple-800 transition-colors"
          >
            <span className="text-sm font-mono text-purple-400">{inv.code}</span>
          </div>
        ))}
        {unused.length === 0 && <p className="text-slate-600 text-[13px] col-span-4">No available codes</p>}
      </div>

      {/* Used codes */}
      {used.length > 0 && (
        <>
          <h3 className="text-sm tracking-[2px] text-slate-600 uppercase mb-3">Used Codes</h3>
          <div className="flex flex-col gap-0.5">
            {used.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center px-4 py-2.5 bg-[#0f0f1a] rounded-lg">
                <span className="text-sm font-mono text-slate-500">{inv.code}</span>
                <span className="text-xs text-slate-600">
                  Used {inv.used_at ? new Date(inv.used_at).toLocaleDateString() : "—"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminInvites;
