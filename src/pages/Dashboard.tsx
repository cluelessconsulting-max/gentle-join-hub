import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import EventConfirmationModal from "@/components/EventConfirmationModal";
import NotificationBell from "@/components/NotificationBell";
import ReferralLeaderboard from "@/components/ReferralLeaderboard";
import MemberPurchases from "@/components/MemberPurchases";
import TierProgress from "@/components/TierProgress";

interface Event {
  id: string;
  tag: string;
  name: string;
  date: string;
  location: string;
  access: string;
  description: string | null;
  capacity: number | null;
}

interface Registration {
  event_id: string;
  status: string;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Map<string, string>>(new Map());
  const [regCounts, setRegCounts] = useState<Map<string, number>>(new Map());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [membershipType, setMembershipType] = useState<string>("free");
  const [confirmModal, setConfirmModal] = useState<{ eventName: string; status: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
    if (!authLoading && user?.email === "clueless.consulting@gmail.com") {
      navigate("/admin");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: eventsData }, { data: regsData }, { data: profileData }, { data: allRegs }] = await Promise.all([
        supabase.from("events").select("*"),
        supabase.from("event_registrations" as any).select("event_id, status").eq("user_id", user.id),
        supabase.from("profiles").select("application_status, full_name, referral_code, membership_type").eq("user_id", user.id).single(),
        supabase.from("event_registrations" as any).select("event_id, status"),
      ]);
      setEvents((eventsData as Event[]) || []);

      const regMap = new Map<string, string>();
      ((regsData as any) || []).forEach((r: Registration) => regMap.set(r.event_id, r.status));
      setRegistrations(regMap);

      const counts = new Map<string, number>();
      ((allRegs as any) || []).forEach((r: Registration) => {
        if (r.status === "confirmed") {
          counts.set(r.event_id, (counts.get(r.event_id) || 0) + 1);
        }
      });
      setRegCounts(counts);

      setApplicationStatus((profileData as any)?.application_status || "pending");
      setReferralCode((profileData as any)?.referral_code || null);
      setProfileName((profileData as any)?.full_name || null);
      setMembershipType((profileData as any)?.membership_type || "free");
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleRegister = async (event: Event) => {
    if (!user) return;
    setLoadingId(event.id);

    const { data, error } = await supabase.rpc("register_for_event" as any, {
      p_user_id: user.id,
      p_event_id: event.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast.info("You're already registered!");
      } else {
        toast.error("Something went wrong. Try again.");
      }
    } else {
      const status = data as string;
      setRegistrations((prev) => new Map(prev).set(event.id, status));

      // Show confirmation modal
      setConfirmModal({ eventName: event.name, status });

      // Send confirmation email in background
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      supabase.functions.invoke("send-registration-email", {
        body: {
          email: user.email,
          firstName: (profile as any)?.full_name?.split(" ")[0] || "",
          eventName: event.name,
          eventDate: event.date,
          eventLocation: event.location,
          status,
        },
      });
    }
    setLoadingId(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-display text-2xl text-foreground/40 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (applicationStatus !== "approved") {
    return (
      <div className="min-h-screen bg-background">
        <nav className="flex justify-between items-center px-6 md:px-12 py-7">
          <a href="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">Offlist</a>
          <button onClick={handleSignOut} className="text-[10px] tracking-wide-lg uppercase bg-transparent border border-foreground/15 text-foreground px-5 py-2 cursor-pointer transition-colors font-body font-light hover:bg-primary hover:text-primary-foreground hover:border-primary">Sign Out</button>
        </nav>
        <section className="px-6 md:px-12 py-24 text-center max-w-xl mx-auto">
          {applicationStatus === "rejected" ? (
            <>
              <div className="w-16 h-16 mx-auto mb-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive text-2xl">✕</span>
              </div>
              <h1 className="font-display text-[38px] font-light mb-5">Application not approved.</h1>
              <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide">Unfortunately, your application wasn't approved at this time.<br />Feel free to reach out if you have any questions.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-8 rounded-full bg-accent/15 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-display text-[38px] font-light mb-5">Your application has been submitted.</h1>
              <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide mb-8">
                You will be notified about the status of your application.<br />
                In the meantime, follow us on social media.
              </p>
              <div className="flex justify-center gap-4">
                <a
                  href="https://www.instagram.com/offlist.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-primary text-primary-foreground text-[10px] tracking-wide-lg uppercase px-7 py-3 no-underline transition-all hover:bg-accent hover:-translate-y-0.5"
                >
                  Instagram
                </a>
                <a
                  href="https://www.tiktok.com/@off.list.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-primary text-primary-foreground text-[10px] tracking-wide-lg uppercase px-7 py-3 no-underline transition-all hover:bg-accent hover:-translate-y-0.5"
                >
                  TikTok
                </a>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex justify-between items-center px-6 md:px-12 py-7">
        <a href="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">Offlist</a>
        <div className="flex gap-4 items-center">
          <a href="/profile" className="text-[10px] tracking-wide-lg uppercase text-warm-grey hover:text-foreground transition-colors no-underline hidden md:inline">Profile</a>
          <span className="text-[11px] tracking-wide text-warm-grey hidden md:inline">{user?.email}</span>
          <NotificationBell />
          <button onClick={handleSignOut} className="text-[10px] tracking-wide-lg uppercase bg-transparent border border-foreground/15 text-foreground px-5 py-2 cursor-pointer transition-colors font-body font-light hover:bg-primary hover:text-primary-foreground hover:border-primary">Sign Out</button>
        </div>
      </nav>

      <section className="px-6 md:px-12 py-16">
        <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-3.5">Your Events</p>
        <h1 className="font-display text-[clamp(32px,4vw,56px)] font-light leading-tight mb-6">Welcome back{profileName ? `, ${profileName.split(" ")[0].charAt(0).toUpperCase() + profileName.split(" ")[0].slice(1).toLowerCase()}` : ""}</h1>

        {referralCode && (
          <div className="mb-14 flex items-center gap-4">
            <div className="bg-foreground/5 border border-foreground/10 px-5 py-3 inline-flex items-center gap-3">
              <span className="text-[10px] tracking-wide-lg uppercase text-warm-grey">Your Code</span>
              <span className="font-display text-[15px] tracking-wider text-accent">{referralCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  toast.success("Code copied!");
                }}
                className="text-[10px] text-warm-grey hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Membership Section */}
        <div className="mb-14 bg-foreground/5 border border-foreground/10 p-6 md:p-8">
          <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-2">Your Membership</p>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-display text-[20px] capitalize text-foreground">{membershipType}</span>
            <span className={`text-[9px] tracking-wide-lg uppercase px-2.5 py-1 rounded-full font-semibold ${
              membershipType === "vip" ? "bg-amber-500/15 text-amber-400" :
              membershipType === "premium" ? "bg-purple-500/15 text-purple-400" :
              "bg-foreground/10 text-warm-grey"
            }`}>
              {membershipType === "free" ? "Free Tier" : membershipType === "premium" ? "Premium" : "VIP"}
            </span>
          </div>
          {membershipType === "free" && (
            <p className="text-[12px] text-warm-grey leading-relaxed">
              Upgrade to Premium for priority event access and exclusive previews. Contact us for more info.
            </p>
          )}
        </div>

        <ReferralLeaderboard />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {events.map((event) => {
            const regStatus = registrations.get(event.id);
            const isRegistered = !!regStatus;
            const isLoading = loadingId === event.id;
            const confirmed = regCounts.get(event.id) || 0;
            const isFull = event.capacity ? confirmed >= event.capacity : false;

            return (
              <div key={event.id} className="bg-background p-10 md:p-12 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
                <span className="text-[9px] tracking-wide-lg uppercase text-accent mb-6 block">{event.tag}</span>
                <h3 className="font-display text-[28px] font-light leading-tight mb-5">{event.name}</h3>
                <div className="flex flex-col gap-2 mb-4">
                  {[event.date, event.location, event.access].map((item) => (
                    <span key={item} className="text-[11px] text-warm-grey tracking-wide flex gap-2.5 items-center before:content-['—'] before:text-accent before:text-[9px]">{item}</span>
                  ))}
                </div>

                {event.capacity && (
                  <div className="mb-5">
                    <div className="flex justify-between text-[10px] text-warm-grey mb-1">
                      <span>{confirmed} / {event.capacity} spots</span>
                      {isFull && <span className="text-amber-500">Full</span>}
                    </div>
                    <div className="w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? "bg-amber-500" : "bg-accent"}`}
                        style={{ width: `${Math.min(100, (confirmed / event.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {isRegistered ? (
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] tracking-wide-md uppercase flex items-center gap-2 ${
                      regStatus === "waitlist" ? "text-amber-500" : regStatus === "pending" ? "text-foreground/60" : "text-accent"
                    }`}>
                      {regStatus === "waitlist" ? "⏳ On the waitlist" : regStatus === "pending" ? "⏳ Request Submitted — Pending" : "✓ Confirmed"}
                    </span>
                    <button
                      onClick={async () => {
                        if (!user) return;
                        const { error } = await supabase
                          .from("event_registrations" as any)
                          .delete()
                          .eq("user_id", user.id)
                          .eq("event_id", event.id);
                        if (error) {
                          toast.error("Failed to cancel");
                        } else {
                          toast.success("Registration cancelled");
                          setRegistrations((prev) => {
                            const next = new Map(prev);
                            next.delete(event.id);
                            return next;
                          });
                        }
                      }}
                      className="text-[10px] text-warm-grey hover:text-foreground transition-colors cursor-pointer bg-transparent border-none underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRegister(event)}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground border-none px-8 py-3.5 font-body text-[10px] tracking-wide-lg uppercase cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5 disabled:bg-warm-grey disabled:translate-y-0 disabled:cursor-default"
                  >
                    {isLoading ? "Joining…" : isFull ? "Join Waitlist →" : "Get on the guest list →"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <EventConfirmationModal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        eventName={confirmModal?.eventName || ""}
        status={confirmModal?.status || "confirmed"}
      />
    </div>
  );
};

export default Dashboard;
