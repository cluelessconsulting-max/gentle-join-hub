import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const { action, slug, password } = body;

    // Create brand partner (admin action)
    if (action === "create_brand") {
      const encoder = new TextEncoder();
      const data = encoder.encode(body.password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const { error } = await supabase.from("brand_partners").insert({
        name: body.name,
        slug: body.slug,
        contact_email: body.contact_email,
        logo_url: body.logo_url || null,
        password_hash: hashHex,
      });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Brand login verification
    if (!slug || !password) {
      return new Response(JSON.stringify({ error: "Missing credentials" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash provided password
    const encoder = new TextEncoder();
    const pwData = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", pwData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Verify
    const { data: brand } = await supabase
      .from("brand_partners")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .single();

    if (!brand || brand.password_hash !== hashHex) {
      return new Response(JSON.stringify({ success: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If just login verification
    if (action !== "get_data") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get brand data — purchases through their discount codes
    const { data: codes } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("user_id", brand.id);

    const codeIds = (codes || []).map((c: any) => c.id);

    let buyers: any[] = [];
    let totalRevenue = 0;
    const monthlyMap: Record<string, { count: number; revenue: number }> = {};

    if (codeIds.length > 0) {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("amount, purchase_date, user_id, discount_code_id")
        .in("discount_code_id", codeIds);

      if (purchases && purchases.length > 0) {
        const userIds = [...new Set(purchases.map((p: any) => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, city, buyer_tier")
          .in("user_id", userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

        buyers = purchases.map((p: any) => {
          const prof = profileMap.get(p.user_id);
          return {
            full_name: prof?.full_name || null,
            city: prof?.city || null,
            buyer_tier: prof?.buyer_tier || "guest",
            amount: p.amount,
            purchase_date: p.purchase_date,
          };
        });

        totalRevenue = purchases.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        // Monthly aggregation
        purchases.forEach((p: any) => {
          const month = new Date(p.purchase_date).toLocaleDateString("en", { month: "short", year: "2-digit" });
          if (!monthlyMap[month]) monthlyMap[month] = { count: 0, revenue: 0 };
          monthlyMap[month].count++;
          monthlyMap[month].revenue += Number(p.amount);
        });
      }
    }

    const monthlyData = Object.entries(monthlyMap).map(([month, d]) => ({ month, ...d }));

    return new Response(
      JSON.stringify({
        success: true,
        buyers,
        discountCodes: codes || [],
        stats: { totalBuyers: buyers.length, totalRevenue },
        monthlyData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
