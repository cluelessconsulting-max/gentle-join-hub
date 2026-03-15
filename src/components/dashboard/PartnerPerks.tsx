import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BrandPartner {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface DiscountCode {
  id: string;
  code: string;
  is_active: boolean;
}

interface Props {
  userId: string;
  tier: string;
}

const PartnerPerks = ({ userId, tier }: Props) => {
  const [brands, setBrands] = useState<BrandPartner[]>([]);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: brandsData }, { data: codesData }] = await Promise.all([
        supabase.from("brand_partners").select("id, name, slug, logo_url").eq("active", true),
        supabase.from("discount_codes").select("*").eq("user_id", userId),
      ]);
      setBrands((brandsData as any) || []);
      setCodes((codesData as any) || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) {
    return (
      <div>
        <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-6">Offlist Partner Perks</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-background p-8">
              <div className="bg-foreground/5 animate-pulse h-10 w-10 rounded-full mb-4" />
              <div className="bg-foreground/5 animate-pulse h-5 w-32 mb-2" />
              <div className="bg-foreground/5 animate-pulse h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeCodes = codes.filter(c => c.is_active);

  return (
    <div>
      <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-3">Offlist Partner Perks</p>
      <p className="text-[12px] text-warm-grey tracking-wide mb-8 max-w-lg">
        Exclusive discounts and offers from our partner brands — available only through Offlist.
      </p>

      {/* Active discount codes */}
      {activeCodes.length > 0 && (
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/40 mb-3">Your Active Codes</p>
          <div className="flex flex-wrap gap-3">
            {activeCodes.map(c => (
              <div key={c.id} className="border border-border bg-background px-5 py-3 flex items-center gap-4">
                <span className="font-mono text-[14px] tracking-wider text-accent">{c.code}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Code copied!"); }}
                  className="text-[10px] text-warm-grey hover:text-foreground bg-transparent border-none cursor-pointer transition-colors tracking-wide-md uppercase"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used codes */}
      {codes.filter(c => !c.is_active).length > 0 && (
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/40 mb-3">Used</p>
          <div className="flex flex-wrap gap-3">
            {codes.filter(c => !c.is_active).map(c => (
              <div key={c.id} className="border border-border bg-background px-5 py-3 flex items-center gap-4 opacity-40">
                <span className="font-mono text-[14px] tracking-wider text-foreground line-through">{c.code}</span>
                <span className="text-[9px] tracking-wide-md uppercase text-warm-grey">Used</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partner Brands Grid */}
      {brands.length > 0 ? (
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/40 mb-3">Our Partners</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
            {brands.map(brand => (
              <div
                key={brand.id}
                className="bg-background p-8 flex flex-col items-center justify-center text-center group hover:bg-foreground/[0.02] transition-colors"
              >
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.name} className="h-10 object-contain mb-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center mb-4">
                    <span className="font-display text-[18px] text-foreground/30">{brand.name.charAt(0)}</span>
                  </div>
                )}
                <p className="text-[12px] text-foreground tracking-wide">{brand.name}</p>
                <p className="text-[10px] text-accent mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View offers →</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-border p-12 text-center">
          <p className="font-display text-xl font-light text-foreground/30 mb-2">Partner brands coming soon</p>
          <p className="text-[12px] text-warm-grey tracking-wide">We're onboarding exclusive brands. Stay tuned for special offers.</p>
        </div>
      )}
    </div>
  );
};

export default PartnerPerks;
