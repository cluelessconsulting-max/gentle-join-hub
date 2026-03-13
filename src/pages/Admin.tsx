import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ADMIN_EMAIL = "clueless.consulting@gmail.com";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  city: string | null;
  age: number | null;
  instagram: string | null;
  tiktok: string | null;
  phone: string | null;
  interests: string[] | null;
  shopping_style: string | null;
  event_frequency: string | null;
  referral: string | null;
  how_heard: string | null;
  application_status: string;
  created_at: string;
}

const Admin = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching profiles:", error);
    } else {
      setProfiles((data as unknown as Profile[]) || []);
    }
    setLoading(false);
  };

  const updateStatus = async (profileId: string, status: string) => {
    setUpdatingId(profileId);
    const { error } = await supabase
      .from("profiles")
      .update({ application_status: status } as any)
      .eq("id", profileId);

    if (error) {
      toast.error("Failed to update status");
      console.error(error);
    } else {
      toast.success(`Application ${status}`);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, application_status: status } : p))
      );
    }
    setUpdatingId(null);
  };

  const filteredProfiles = filter === "all" ? profiles : profiles.filter((p) => p.application_status === filter);

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-700 bg-green-100";
      case "rejected": return "text-red-700 bg-red-100";
      default: return "text-amber-700 bg-amber-100";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-display text-2xl text-foreground/40 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex justify-between items-center px-6 md:px-12 py-7 border-b border-border">
        <a href="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">
          Offlist
        </a>
        <div className="flex gap-5 items-center">
          <span className="text-[10px] tracking-wide-lg uppercase text-accent">Admin</span>
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="text-[10px] tracking-wide-lg uppercase bg-transparent border border-foreground/15 text-foreground px-5 py-2 cursor-pointer transition-colors font-body font-light hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <section className="px-6 md:px-12 py-12">
        <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-3.5">Administration</p>
        <h1 className="font-display text-[clamp(28px,3vw,48px)] font-light leading-tight mb-8">
          Applications ({filteredProfiles.length})
        </h1>

        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] tracking-[0.14em] uppercase px-4 py-[7px] border cursor-pointer transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-foreground/15 text-warm-grey hover:bg-primary hover:text-primary-foreground hover:border-primary"
              }`}
            >
              {f} {f !== "all" && `(${profiles.filter((p) => p.application_status === f).length})`}
              {f === "all" && `(${profiles.length})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-foreground/15">
                {["Name", "City", "Age", "Instagram", "Phone", "Interests", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-[9px] tracking-wide-lg uppercase text-warm-grey font-normal py-3 px-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} className="border-b border-foreground/5 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-3 text-[12px] tracking-wide text-foreground font-light whitespace-nowrap">
                    {profile.full_name || "—"}
                  </td>
                  <td className="py-3 px-3 text-[12px] tracking-wide text-warm-grey font-light">
                    {profile.city || "—"}
                  </td>
                  <td className="py-3 px-3 text-[12px] tracking-wide text-warm-grey font-light">
                    {profile.age || "—"}
                  </td>
                  <td className="py-3 px-3 text-[12px] tracking-wide text-warm-grey font-light">
                    {profile.instagram || "—"}
                  </td>
                  <td className="py-3 px-3 text-[12px] tracking-wide text-warm-grey font-light">
                    {profile.phone || "—"}
                  </td>
                  <td className="py-3 px-3 text-[11px] tracking-wide text-warm-grey font-light max-w-[200px]">
                    {profile.interests?.join(", ") || "—"}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[9px] tracking-wide-lg uppercase px-2.5 py-1 ${statusColor(profile.application_status)}`}>
                      {profile.application_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] tracking-wide text-warm-grey font-light whitespace-nowrap">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1.5">
                      {profile.application_status !== "approved" && (
                        <button
                          onClick={() => updateStatus(profile.id, "approved")}
                          disabled={updatingId === profile.id}
                          className="text-[9px] tracking-wide uppercase px-3 py-1.5 bg-green-800 text-green-100 border-none cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {profile.application_status !== "rejected" && (
                        <button
                          onClick={() => updateStatus(profile.id, "rejected")}
                          disabled={updatingId === profile.id}
                          className="text-[9px] tracking-wide uppercase px-3 py-1.5 bg-red-800 text-red-100 border-none cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProfiles.length === 0 && (
          <p className="text-center text-warm-grey text-[13px] tracking-wide py-16">No applications found.</p>
        )}
      </section>
    </div>
  );
};

export default Admin;
