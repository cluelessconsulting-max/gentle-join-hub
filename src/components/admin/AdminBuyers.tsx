import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
  buyer_tier: string;
  total_points: number;
}

interface Purchase {
  id: string;
  user_id: string;
  brand_name: string;
  amount: number;
  purchase_date: string;
  notes: string | null;
  verified_by: string | null;
  verification_status: string;
  created_at: string;
}

interface DiscountCode {
  id: string;
  code: string;
  user_id: string;
  is_active: boolean;
}

const AdminBuyers = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ user_id: "", brand_name: "", amount: "", purchase_date: "", notes: "" });
  const [codeForm, setCodeForm] = useState({ user_id: "", code: "" });
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [{ data: purchasesData }, { data: profilesData }, { data: codesData }] = await Promise.all([
      supabase.from("purchases" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email, city, buyer_tier, total_points"),
      supabase.from("discount_codes" as any).select("*"),
    ]);
    if (purchasesData) setPurchases(purchasesData as any);
    if (profilesData) setProfiles(profilesData as any);
    if (codesData) setDiscountCodes(codesData as any);
  };

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  // Users who have discount codes
  const buyerUserIds = [...new Set(discountCodes.map((c) => c.user_id))];
  const buyers = profiles.filter((p) => buyerUserIds.includes(p.user_id));

  const savePurchase = async () => {
    if (!form.user_id || !form.brand_name || !form.amount) {
      toast.error("Please fill required fields");
      return;
    }
    const { error } = await supabase.from("purchases" as any).insert({
      user_id: form.user_id,
      brand_name: form.brand_name,
      amount: parseFloat(form.amount),
      purchase_date: form.purchase_date || new Date().toISOString().split("T")[0],
      notes: form.notes || null,
      verified_by: "clueless.consulting@gmail.com",
    } as any);
    if (error) {
      toast.error("Failed to add purchase");
      return;
    }
    toast.success("Purchase added");
    setForm({ user_id: "", brand_name: "", amount: "", purchase_date: "", notes: "" });
    setShowForm(false);
    fetchAll();
  };

  const deletePurchase = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("purchases" as any).delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Failed to delete purchase");
      return;
    }
    toast.success("Purchase deleted — tier updated automatically");
    setDeleteTarget(null);
    fetchAll();
  };

  const saveDiscountCode = async () => {
    if (!codeForm.user_id || !codeForm.code) {
      toast.error("Please fill all fields");
      return;
    }
    const { error } = await supabase.from("discount_codes" as any).insert({
      user_id: codeForm.user_id,
      code: codeForm.code,
    } as any);
    if (error) {
      toast.error(error.message?.includes("unique") ? "Code already exists" : "Failed to create code");
      return;
    }
    toast.success("Discount code created");
    setCodeForm({ user_id: "", code: "" });
    setShowCodeForm(false);
    fetchAll();
  };

  const exportCSV = () => {
    const header = "Name,Email,City,Brand,Amount (£),Date,Notes\n";
    const rows = purchases.map((p) => {
      const prof = getProfile(p.user_id);
      return [
        `"${prof?.full_name || ""}"`,
        `"${prof?.email || ""}"`,
        `"${prof?.city || ""}"`,
        `"${p.brand_name}"`,
        p.amount,
        `"${p.purchase_date}"`,
        `"${p.notes || ""}"`,
      ].join(",");
    }).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `offlist-buyers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${purchases.length} records`);
  };

  const inputCls = "bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none w-full focus:border-purple-800 transition-colors";

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-2xl font-bold tracking-wider text-slate-50">Buyers</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCodeForm(!showCodeForm); setShowForm(false); }}
            className="bg-indigo-950 text-purple-400 border border-indigo-900 px-4 py-2 rounded-lg cursor-pointer text-[13px] hover:bg-indigo-900 transition-colors"
          >
            {showCodeForm ? "Cancel" : "+ Discount Code"}
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowCodeForm(false); }}
            className="bg-purple-600 text-white border-none px-5 py-2 rounded-lg cursor-pointer text-[13px] font-semibold hover:bg-purple-500 transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Purchase"}
          </button>
          <button
            onClick={exportCSV}
            disabled={purchases.length === 0}
            className="bg-sky-950 text-sky-400 border border-sky-900 px-4 py-2 rounded-lg cursor-pointer text-[13px] hover:bg-sky-900 transition-colors disabled:opacity-30"
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Discount Code Form */}
      {showCodeForm && (
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5 mb-7">
          <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-3">Create Discount Code</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select className={inputCls} value={codeForm.user_id} onChange={(e) => setCodeForm({ ...codeForm, user_id: e.target.value })}>
              <option value="">Select user…</option>
              {profiles.map((p) => (
                <option key={p.user_id} value={p.user_id}>{p.full_name || p.email || p.user_id}</option>
              ))}
            </select>
            <input className={inputCls} placeholder="Discount code (e.g. OFFLIST-VIP-20)" value={codeForm.code} onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value })} />
          </div>
          <button onClick={saveDiscountCode} disabled={!codeForm.user_id || !codeForm.code} className="bg-emerald-600 text-white border-none px-5 py-2 rounded-lg cursor-pointer text-[13px] font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-40">
            Create Code
          </button>
        </div>
      )}

      {/* Purchase Form */}
      {showForm && (
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5 mb-7">
          <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-3">Add Purchase Record</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select className={inputCls} value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
              <option value="">Select user…</option>
              {profiles.map((p) => (
                <option key={p.user_id} value={p.user_id}>{p.full_name || p.email || p.user_id}</option>
              ))}
            </select>
            <input className={inputCls} placeholder="Brand name" value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
            <input className={inputCls} type="number" placeholder="Amount (£)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <input className={inputCls} type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
          </div>
          <textarea className={`${inputCls} min-h-[50px] resize-y mb-3`} placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button onClick={savePurchase} disabled={!form.user_id || !form.brand_name || !form.amount} className="bg-emerald-600 text-white border-none px-5 py-2 rounded-lg cursor-pointer text-[13px] font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-40">
            Save Purchase
          </button>
        </div>
      )}

      {/* Discount Codes */}
      {discountCodes.length > 0 && (
        <div className="mb-7">
          <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-3">Active Discount Codes</p>
          <div className="flex flex-wrap gap-2">
            {discountCodes.map((c) => {
              const prof = getProfile(c.user_id);
              return (
                <span key={c.id} className="bg-[#0f0f1a] border border-[#1e1e2e] px-3 py-1.5 rounded-lg text-[12px] text-slate-300">
                  <span className="text-purple-400 font-semibold">{c.code}</span>
                  <span className="text-slate-600 ml-2">→ {prof?.full_name || prof?.email || "Unknown"}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Buyers with codes */}
      {buyers.length > 0 && (
        <div className="mb-7">
          <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-3">Users with Discount Codes</p>
          <div className="overflow-x-auto rounded-xl border border-[#1e1e2e]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Name", "Email", "City", "Tier", "Codes", "Total Purchases", "Total Spent"].map((h) => (
                    <th key={h} className="p-3 text-left text-[11px] tracking-[2px] text-slate-600 bg-[#0f0f1a] border-b border-[#1e1e2e] font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buyers.map((b) => {
                  const codes = discountCodes.filter((c) => c.user_id === b.user_id);
                  const userPurchases = purchases.filter((p) => p.user_id === b.user_id);
                  const totalSpent = userPurchases.reduce((sum, p) => sum + Number(p.amount), 0);
                  return (
                    <tr key={b.user_id} className="border-b border-[#1a1a2e] hover:bg-[#0f0f1a]/50 transition-colors">
                      <td className="p-3 text-[13px] text-slate-200">{b.full_name || "—"}</td>
                      <td className="p-3 text-[13px] text-slate-400">{b.email || "—"}</td>
                      <td className="p-3 text-[13px] text-slate-400">{b.city || "—"}</td>
                      <td className="p-3"><TierBadge tier={b.buyer_tier} /></td>
                      <td className="p-3 text-[12px] text-purple-400">{codes.map((c) => c.code).join(", ")}</td>
                      <td className="p-3 text-[13px] text-slate-300">{userPurchases.length}</td>
                      <td className="p-3 text-[13px] text-emerald-400 font-semibold">£{totalSpent.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Purchases */}
      <p className="text-[11px] tracking-[2px] text-slate-600 uppercase mb-3">All Purchases</p>
      {purchases.length === 0 ? (
        <p className="text-slate-600 text-[13px] text-center py-10">No purchases recorded yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1e1e2e]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Email", "Brand", "Amount", "Date", "Status", "Notes", ""].map((h) => (
                  <th key={h} className="p-3 text-left text-[11px] tracking-[2px] text-slate-600 bg-[#0f0f1a] border-b border-[#1e1e2e] font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => {
                const prof = getProfile(p.user_id);
                return (
                  <tr key={p.id} className="border-b border-[#1a1a2e] hover:bg-[#0f0f1a]/50 transition-colors">
                    <td className="p-3 text-[13px] text-slate-200">{prof?.full_name || "—"}</td>
                    <td className="p-3 text-[13px] text-slate-400">{prof?.email || "—"}</td>
                    <td className="p-3 text-[13px] text-slate-200">{p.brand_name}</td>
                    <td className="p-3 text-[13px] text-emerald-400 font-semibold">£{Number(p.amount).toFixed(2)}</td>
                     <td className="p-3 text-[11px] text-slate-500">{p.purchase_date}</td>
                     <td className="p-3">
                       <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                         p.verification_status === "verified" ? "bg-emerald-950 text-emerald-400" :
                         p.verification_status === "rejected" ? "bg-red-950 text-red-400" :
                         "bg-orange-950 text-orange-400"
                       }`}>
                         {p.verification_status || "pending"}
                       </span>
                       {p.verification_status === "pending" && (
                         <span className="ml-2 inline-flex gap-1">
                           <button
                             onClick={async () => {
                               await supabase.from("purchases" as any).update({ verification_status: "verified", verified_by: "clueless.consulting@gmail.com" } as any).eq("id", p.id);
                               toast.success("Purchase verified");
                               fetchAll();
                             }}
                             className="text-[10px] bg-emerald-600 text-white border-none px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-500"
                           >✓</button>
                           <button
                             onClick={async () => {
                               await supabase.from("purchases" as any).update({ verification_status: "rejected" } as any).eq("id", p.id);
                               toast.success("Purchase rejected");
                               fetchAll();
                             }}
                             className="text-[10px] bg-red-600 text-white border-none px-2 py-0.5 rounded cursor-pointer hover:bg-red-500"
                           >✕</button>
                         </span>
                       )}
                     </td>
                     <td className="p-3 text-[12px] text-slate-500">{p.notes || "—"}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="text-red-500/60 hover:text-red-400 text-[11px] transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#0a0a14] border border-[#1e1e2e]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this purchase
              {deleteTarget ? ` (£${Number(deleteTarget.amount).toFixed(2)} at ${deleteTarget.brand_name})` : ""}?
              The user's tier will be recalculated automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1e1e2e] text-slate-300 border-none hover:bg-[#2a2a3e]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deletePurchase} className="bg-red-600 text-white hover:bg-red-500">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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

export default AdminBuyers;
