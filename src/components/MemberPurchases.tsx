import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Purchase {
  id: string;
  brand_name: string;
  amount: number;
  purchase_date: string;
  verification_status: string;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  userId: string;
}

const MemberPurchases = ({ userId }: Props) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    brand_name: "",
    amount: "",
    purchase_date: "",
    notes: "",
    receipt_number: "",
  });

  useEffect(() => {
    fetchPurchases();
  }, [userId]);

  const fetchPurchases = async () => {
    const { data } = await supabase
      .from("purchases" as any)
      .select("*")
      .eq("user_id", userId)
      .order("purchase_date", { ascending: false });
    setPurchases((data as any) || []);
    setLoading(false);
  };

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  const verifiedCount = purchases.filter((p) => p.verification_status === "verified").length;

  const handleSubmit = async () => {
    if (!form.brand_name || !form.amount) return;
    setSubmitting(true);

    const { error } = await supabase.from("purchases" as any).insert({
      user_id: userId,
      brand_name: form.brand_name,
      amount: parseFloat(form.amount),
      purchase_date: form.purchase_date || new Date().toISOString().split("T")[0],
      notes: form.notes || null,
      verification_status: "pending",
    } as any);

    if (error) {
      toast.error("Failed to submit purchase");
    } else {
      toast.success("Purchase submitted for verification");
      setForm({ brand_name: "", amount: "", purchase_date: "", notes: "" });
      setShowForm(false);
      fetchPurchases();
    }
    setSubmitting(false);
  };

  return (
    <div className="mb-14">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-2">My Purchases</p>
          <p className="text-[12px] text-warm-grey">
            £{totalSpent.toFixed(0)} total across {purchases.length} purchase{purchases.length !== 1 ? "s" : ""} · {verifiedCount} verified
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-primary-foreground border-none px-6 py-2.5 font-body text-[10px] tracking-wide-lg uppercase cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5"
        >
          {showForm ? "Cancel" : "+ Submit Purchase"}
        </button>
      </div>

      {showForm && (
        <div className="bg-foreground/5 border border-foreground/10 p-6 mb-6">
          <p className="text-[10px] tracking-[0.24em] uppercase text-warm-grey mb-4">New Purchase</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              placeholder="Brand name *"
              value={form.brand_name}
              onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
              className="bg-transparent border border-foreground/15 text-foreground px-4 py-3 text-[12px] tracking-wide outline-none font-body transition-colors focus:border-accent placeholder:text-foreground/25"
            />
            <input
              type="number"
              placeholder="Amount in £ *"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="bg-transparent border border-foreground/15 text-foreground px-4 py-3 text-[12px] tracking-wide outline-none font-body transition-colors focus:border-accent placeholder:text-foreground/25"
            />
            <input
              type="date"
              value={form.purchase_date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
              className="bg-transparent border border-foreground/15 text-foreground px-4 py-3 text-[12px] tracking-wide outline-none font-body transition-colors focus:border-accent placeholder:text-foreground/25"
            />
            <input
              placeholder="Order reference (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="bg-transparent border border-foreground/15 text-foreground px-4 py-3 text-[12px] tracking-wide outline-none font-body transition-colors focus:border-accent placeholder:text-foreground/25"
            />
          </div>
          <p className="text-[10px] text-foreground/30 mb-4">Your purchase will be verified by the Offlist team. Usually within 24 hours.</p>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.brand_name || !form.amount}
            className="bg-primary text-primary-foreground border-none px-8 py-3 font-body text-[10px] tracking-wide-lg uppercase cursor-pointer transition-all hover:bg-accent disabled:opacity-40 disabled:cursor-default"
          >
            {submitting ? "Submitting…" : "Submit for Verification"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-foreground/5 h-16 animate-pulse" />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="bg-foreground/5 border border-foreground/10 p-8 text-center">
          <p className="text-[13px] text-warm-grey">No purchases yet.</p>
          <p className="text-[11px] text-foreground/30 mt-1">Submit your first purchase to start earning points.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => (
            <div key={p.id} className="bg-foreground/5 border border-foreground/10 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-display text-[15px]">
                  {p.brand_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] text-foreground">{p.brand_name}</p>
                  <p className="text-[10px] text-warm-grey">{new Date(p.purchase_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-[9px] tracking-wide-lg uppercase px-2.5 py-1 rounded-full font-semibold ${
                  p.verification_status === "verified"
                    ? "bg-accent/15 text-accent"
                    : p.verification_status === "rejected"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-foreground/10 text-warm-grey"
                }`}>
                  {p.verification_status === "verified" ? "✓ Verified" : p.verification_status === "rejected" ? "Rejected" : "Pending"}
                </span>
                <span className="font-display text-[15px] text-foreground">£{Number(p.amount).toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberPurchases;
