import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import EventConfirmationModal from "@/components/EventConfirmationModal";
import NotificationBell from "@/components/NotificationBell";
import ReferralLeaderboard from "@/components/ReferralLeaderboard";
import MemberPurchases from "@/components/MemberPurchases";
import DashboardHero from "@/components/dashboard/DashboardHero";
import LoyaltySection from "@/components/dashboard/LoyaltySection";

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
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Map<string, string>>(new Map());
  const [regCounts, setRegCounts] = useState<Map<string, number>>(new Map());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [membershipType, setMembershipType] = useState<string>("free");
  const [buyerTier, setBuyerTier] = useState<string>("guest");
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [purchaseCount, setPurchaseCount] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ eventName: string; status: string } | null>(null);

  // Impersonation mode
  const impersonateUserId = searchParams.get("impersonate");
  const isImpersonating = !!impersonateUserId;
  const effectiveUserId = impersonateUserId || user?.id;

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
    if (!authLoading && user?.email === "clueless.consulting@gmail.com" && !isImpersonating) navigate("/admin");
  }, [user, authLoading, navigate, isImpersonating]);

  useEffect(() => {
    if (!effectiveUserId) return;
    const fetchData = async () => {
      const [{ data: eventsData }, { data: regsData }, { data: profileData }, { data: allRegs }] = await Promise.all([
        supabase.from("events").select("*"),
        supabase.from("event_registrations" as any).select("event_id, status").eq("user_id", effectiveUserId),
        supabase.from("profiles").select("application_status, full_name, referral_code, membership_type, buyer_tier, total_points, avatar_url").eq("user_id", effectiveUserId).single(),
        supabase.from("event_registrations" as any).select("event_id, status"),
      ]);
      setEvents((eventsData as Event[]) || []);

      const regMap = new Map<string, string>();
      ((regsData as any) || []).forEach((r: Registration) => regMap.set(r.event_id, r.status));
      setRegistrations(regMap);

      const counts = new Map<string, number>();
      ((allRegs as any) || []).forEach((r: Registration) => {
        if (r.status === "confirmed") counts.set(r.event_id, (counts.get(r.event_id) || 0) + 1);
      });
      setRegCounts(counts);

      setApplicationStatus((profileData as any)?.application_status || "pending");
      setReferralCode((profileData as any)?.referral_code || null);
      setProfileName((profileData as any)?.full_name || null);
      setMembershipType((profileData as any)?.membership_type || "free");
      setBuyerTier((profileData as any)?.buyer_tier || "guest");
      setTotalPoints((profileData as any)?.total_points || 0);
      setAvatarUrl((profileData as any)?.avatar_url || null);

      const { data: purchasesData } = await supabase
        .from("purchases" as any)
        .select("amount")
        .eq("user_id", effectiveUserId);
      const pData = (purchasesData as any[]) || [];
      setPurchaseCount(pData.length);
      setTotalSpent(pData.reduce((s: number, p: any) => s + Number(p.amount), 0));

      setLoading(false);
    };
    fetchData();
  }, [effectiveUserId]);

  const handleRegister = async (event: Event) => {
    if (!user || isImpersonating) return;
    setLoadingId(event.id);
    const { data, error } = await supabase.rpc("register_for_event" as any, { p_user_id: user.id, p_event_id: event.id });
    if (error) {
      if (error.code === "23505") toast.info("You're already registered!");
      else toast.error("Something went wrong. Try again.");
    } else {
      const status = data as string;
      setRegistrations((prev) => new Map(prev).set(event.id, status));
      setConfirmModal({ eventName: event.name, status });

      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).single();
      supabase.functions.invoke("send-registration-email", {
        body: { email: user.email, firstName: (profile as any)?.full_name?.split(" ")[0] || "", eventName: event.name, eventDate: event.date, eventLocation: event.location, status },
      });
    }
    setLoadingId(null);
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-display text-2xl text-foreground/40 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!isImpersonating && applicationStatus !== "approved") {
    return (
      <div className="min-h-screen bg-background">
        <nav className="flex justify-between items-center px-6 md:px-12 py-7">
          <a href="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">Offlist</a>
          <button onClick={handleSignOut} className="text-[10px] tracking-wide-lg uppercase bg-transparent border border-foreground/15 text-foreground px-5 py-2 cursor-pointer transition-colors font-body font-light hover:bg-primary hover:text-primary-foreground hover:border-primary">Sign Out</button>
        </nav>
        <section className="px-6 md:px-12 py-24 text-center max-w-xl mx-auto">
          {applicationStatus === "rejected" ? (
            <>
              <div className="w-16 h-16 mx-auto mb-8 rounded-full bg-destructive/10 flex items-center justify-center"><span className="text-destructive text-2xl">✕</span></div>
              <h1 className="font-display text-[38px] font-light mb-5">Application not approved.</h1>
              <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide">Unfortunately, your application wasn't approved at this time.<br />Feel free to reach out if you have any questions.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-8 rounded-full bg-accent/15 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="font-display text-[38px] font-light mb-5">Your application has been submitted.</h1>
              <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide mb-8">You will be notified about the status of your application.<br />In the meantime, follow us on social media.</p>
              <div className="flex justify-center gap-4">
                <a href="https://www.instagram.com/offlist.network/" target="_blank" rel="noopener noreferrer" className="inline-block bg-primary text-primary-foreground text-[10px] tracking-wide-lg uppercase px-7 py-3 no-underline transition-all hover:bg-accent hover:-translate-y-0.5">Instagram</a>
                <a href="https://www.tiktok.com/@off.list.network" target="_blank" rel="noopener noreferrer" className="inline-block bg-primary text-primary-foreground text-[10px] tracking-wide-lg uppercase px-7 py-3 no-underline transition-all hover:bg-accent hover:-translate-y-0.5">TikTok</a>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  const initials = profileName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-background">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-2.5 flex items-center justify-center gap-4">
          <span className="text-[12px] font-semibold text-black tracking-wide">
            ADMIN PREVIEW — Viewing as {profileName || "Member"} ({user?.email})
          </span>
          <button
            onClick={() => navigate("/admin")}
            className="bg-black text-white text-[10px] tracking-wider uppercase px-4 py-1.5 border-none cursor-pointer rounded hover:bg-black/80"
          >
            ← Exit Preview
          </button>
        </div>
      )}

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-foreground/5">
        <div className="flex justify-between items-center px-6 md:px-12 py-4">
          <a href="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">Offlist</a>
          <div className="flex gap-4 items-center">
            <a href="/profile" className="text-[10px] tracking-wide-lg uppercase text-warm-grey hover:text-foreground transition-colors no-underline hidden md:inline">Profile</a>
            <NotificationBell />
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-foreground/10" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-[11px] text-foreground/50 font-semibold">{initials}</div>
            )}
            <button onClick={handleSignOut} className="text-[10px] tracking-wide-lg uppercase bg-transparent border border-foreground/15 text-foreground px-5 py-2 cursor-pointer transition-colors font-body font-light hover:bg-primary hover:text-primary-foreground hover:border-primary">Sign Out</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <DashboardHero
        profileName={profileName}
        tier={buyerTier}
        totalPoints={totalPoints}
        purchaseCount={purchaseCount}
        totalSpent={totalSpent}
        referralCode={referralCode}
      />

      <section className="px-6 md:px-12 py-12">
        {/* Loyalty Section */}
        {effectiveUserId && (
          <LoyaltySection
            userId={effectiveUserId}
            tier={buyerTier}
            totalPoints={totalPoints}
            purchaseCount={purchaseCount}
            totalSpent={totalSpent}
          />
        )}

        {effectiveUserId && <MemberPurchases userId={effectiveUserId} />}

        <ReferralLeaderboard />

        {/* Events */}
        <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-6">Upcoming Events</p>
        {events.length === 0 ? (
          <div className="bg-foreground/5 border border-foreground/10 p-12 text-center mb-14">
            <p className="text-[13px] text-warm-grey">No events available right now.</p>
            <p className="text-[11px] text-foreground/30 mt-1">Check back soon for upcoming events.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border mb-14">
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
                        <div className={`h-full rounded-full transition-all ${isFull ? "bg-amber-500" : "bg-accent"}`} style={{ width: `${Math.min(100, (confirmed / event.capacity) * 100)}%` }} />
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
                      {!isImpersonating && (
                        <button
                          onClick={async () => {
                            if (!user) return;
                            const { error } = await supabase.from("event_registrations" as any).delete().eq("user_id", user.id).eq("event_id", event.id);
                            if (error) { toast.error("Failed to cancel"); }
                            else {
                              toast.success("Registration cancelled");
                              setRegistrations((prev) => { const next = new Map(prev); next.delete(event.id); return next; });
                            }
                          }}
                          className="text-[10px] text-warm-grey hover:text-foreground transition-colors cursor-pointer bg-transparent border-none underline"
                        >Cancel</button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(event)}
                      disabled={isLoading || isImpersonating}
                      title={isImpersonating ? "Disabled in preview mode" : undefined}
                      className="bg-primary text-primary-foreground border-none px-8 py-3.5 font-body text-[10px] tracking-wide-lg uppercase cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5 disabled:bg-warm-grey disabled:translate-y-0 disabled:cursor-default"
                    >
                      {isLoading ? "Joining…" : isFull ? "Join Waitlist →" : "Get on the guest list →"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
