import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BrandPartner {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  contact_email: string;
  active: boolean;
  created_at: string;
}

const AdminBrandPartners = () => {
  const [brands, setBrands] = useState<BrandPartner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", contact_email: "", password: "", logo_url: "" });
  const [newCodeBrand, setNewCodeBrand] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    const { data } = await supabase.from("brand_partners" as any).select("*").order("created_at", { ascending: false });
    if (data) setBrands(data as any);
  };

  const createBrand = async () => {
    if (!form.name || !form.slug || !form.contact_email || !form.password) {
      toast.error("All fields required");
      return;
    }

    const { error } = await supabase.functions.invoke("brand-auth", {
      body: { action: "create_brand", ...form },
    });

    if (error) { toast.error("Failed to create brand"); return; }
    toast.success("Brand partner created");
    setShowForm(false);
    setForm({ name: "", slug: "", contact_email: "", password: "", logo_url: "" });
    fetchBrands();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("brand_partners" as any).update({ active: !active } as any).eq("id", id);
    toast.success(active ? "Brand deactivated" : "Brand activated");
    fetchBrands();
  };

  const generateCode = async () => {
    if (!newCode || !newCodeBrand) return;
    // Find a user to associate — for brand codes we use a placeholder
    const { error } = await supabase.from("discount_codes").insert({
      code: newCode.toUpperCase(),
      user_id: newCodeBrand, // brand id as reference
    } as any);
    if (error) { toast.error("Failed to create code"); return; }
    toast.success("Discount code created");
    setNewCode("");
    setNewCodeBrand(null);
  };

  const inputCls = "bg-[#0a0a12] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none w-full focus:border-purple-800 transition-colors";

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-2xl font-bold tracking-wider text-slate-50">Brand Partners</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white border-none px-5 py-2 rounded-lg cursor-pointer text-[13px] font-semibold hover:bg-purple-500 transition-colors"
        >
          {showForm ? "Cancel" : "+ New Brand"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5 mb-7">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className={inputCls} placeholder="Brand name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={inputCls} placeholder="Slug (URL-friendly)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
            <input className={inputCls} placeholder="Contact email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            <input className={inputCls} type="password" placeholder="Portal password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <input className={`${inputCls} mb-3`} placeholder="Logo URL (optional)" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          <button
            onClick={createBrand}
            disabled={!form.name || !form.slug || !form.contact_email || !form.password}
            className="bg-emerald-600 text-white border-none px-5 py-2 rounded-lg cursor-pointer text-[13px] font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-40"
          >
            Create Brand Partner
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {brands.map((b) => (
          <div key={b.id} className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {b.logo_url && <img src={b.logo_url} alt={b.name} className="w-8 h-8 rounded object-contain" />}
                <div>
                  <span className="text-sm text-slate-200 font-semibold">{b.name}</span>
                  <span className="text-xs text-slate-500 ml-2">/brand/{b.slug}</span>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <span className={`text-xs ${b.active ? "text-emerald-400" : "text-slate-600"}`}>
                  {b.active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => toggleActive(b.id, b.active)}
                  className="text-xs bg-transparent border border-[#1e1e2e] text-slate-400 px-3 py-1 rounded cursor-pointer hover:border-slate-500 transition-colors"
                >
                  {b.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => setNewCodeBrand(newCodeBrand === b.id ? null : b.id)}
                  className="text-xs bg-transparent border border-[#1e1e2e] text-purple-400 px-3 py-1 rounded cursor-pointer hover:border-purple-500 transition-colors"
                >
                  + Code
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-1">{b.contact_email}</p>

            {newCodeBrand === b.id && (
              <div className="flex gap-2 mt-3">
                <input
                  className={`${inputCls} max-w-[200px]`}
                  placeholder="DISCOUNT-CODE"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
                <button
                  onClick={generateCode}
                  disabled={!newCode}
                  className="bg-purple-600 text-white border-none px-4 py-2 rounded-lg cursor-pointer text-xs font-semibold hover:bg-purple-500 transition-colors disabled:opacity-40"
                >
                  Create
                </button>
              </div>
            )}
          </div>
        ))}
        {brands.length === 0 && <p className="text-slate-600 text-[13px] text-center py-10">No brand partners yet</p>}
      </div>
    </div>
  );
};

export default AdminBrandPartners;
