import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import EventConfirmationModal from "@/components/EventConfirmationModal";
import NotificationBell from "@/components/NotificationBell";
import ReferralLeaderboard from "@/components/ReferralLeaderboard";
import MemberPurchases from "@/components/MemberPurchases";
import LoyaltySection from "@/components/dashboard/LoyaltySection";
import PartnerPerks from "@/components/dashboard/PartnerPerks";

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

/* ── skeleton helpers ────────────────────────── */
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`bg-foreground/5 animate-pulse ${className || ""}`} />
);

const EventSkeleton = () => (
  <div className="bg-background p-10 md:p-12 border-b border-r border-border">
    <Skeleton className="w-24 h-3 mb-6" />
    <Skeleton className="w-3/4 h-8 mb-5" />
    <div className="flex flex-col gap-2 mb-9">
      <Skeleton className="w-1/2 h-3" />
      <Skeleton className="w-2/3 h-3" />
      <Skeleton className="w-1/3 h-3" />
    </div>
    <Skeleton className="w-40 h-10" />
  </div>
);

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
  const [multiplierActive, setMultiplierActive] = useState(false);
  const [multiplierEnds, setMultiplierEnds] = useState<string | null>(null);

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

      // Check multiplier
      const [{ data: multActive }, { data: multEnds }] = await Promise.all([
        supabase.from("app_settings").select("value").eq("key", "multiplier_active").single(),
        supabase.from("app_settings").select("value").eq("key", "multiplier_ends_at").single(),
      ]);
      const active = (multActive as any)?.value === true || (multActive as any)?.value === "true";
      const ends = (multEnds as any)?.value;
      if (active && ends && ends !== "null" && new Date(ends) > new Date()) {
        setMultiplierActive(true);
        setMultiplierEnds(ends);
      }

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
      <div className="min-h-screen bg-background">
        <nav className="flex justify-between items-center px-6 md:px-12 py-7">
          <span className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground">Offlist</span>
          <Skeleton className="w-20 h-8" />
        </nav>
        <section className="px-6 md:px-12 py-12">
          <Skeleton className="w-64 h-3 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border mb-14">
            <EventSkeleton />
            <EventSkeleton />
            <EventSkeleton />
          </div>
        </section>
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

  const firstName = profileName
    ? profileName.split(" ")[0].charAt(0).toUpperCase() + profileName.split(" ")[0].slice(1).toLowerCase()
    : "";
  const initials = profileName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const tierConfig: Record<string, { label: string; color: string }> = {
    guest: { label: "Guest", color: "text-warm-grey border-foreground/15" },
    shopper: { label: "Shopper", color: "text-accent border-accent/30" },
    buyer: { label: "Buyer", color: "text-accent border-accent/50" },
    vip: { label: "VIP", color: "text-accent border-accent" },
  };
  const tc = tierConfig[buyerTier.toLowerCase()] || tierConfig.guest;

  return (
    <div className="min-h-screen bg-background">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="sticky top-0 z-50 bg-accent px-6 py-2.5 flex items-center justify-center gap-4">
          <span className="text-[11px] font-semibold text-accent-foreground tracking-wide">
            ADMIN PREVIEW — Viewing as {profileName || "Member"}
          </span>
          <button
            onClick={() => navigate("/admin")}
            className="bg-primary text-primary-foreground text-[10px] tracking-wider uppercase px-4 py-1.5 border-none cursor-pointer hover:bg-foreground/80 transition-colors"
          >
            ← Exit Preview
          </button>
        </div>
      )}

      {/* Double Points Banner */}
      {multiplierActive && (
        <div className="bg-accent/10 border-b border-accent/20 px-6 py-2.5 text-center">
          <span className="text-[11px] text-accent tracking-wide">
            🌟 Double Points Weekend — earn 2x points on all purchases
            {multiplierEnds && ` until ${new Date(multiplierEnds).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`}
          </span>
        </div>
      )}

      {/* ── Sticky Nav matching site aesthetic ──────── */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex justify-between items-center px-6 md:px-12 py-5">
          <a href="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">Offlist</a>
          <div className="flex gap-5 items-center">
            <a href="/profile" className="text-[10px] tracking-wide-lg uppercase text-warm-grey hover:text-foreground transition-colors no-underline hidden md:inline">Profile</a>
            <NotificationBell />
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-foreground/10" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-[11px] text-foreground/40 font-semibold">{initials}</div>
            )}
            <button onClick={handleSignOut} className="text-[10px] tracking-wide-lg uppercase bg-transparent border border-foreground/15 text-foreground px-5 py-2 cursor-pointer transition-colors font-body font-light hover:bg-primary hover:text-primary-foreground hover:border-primary">Sign Out</button>
          </div>
        </div>
      </nav>

      {/* ── Welcome Header — site aesthetic ──────── */}
      <section className="px-6 md:px-12 pt-16 pb-8 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-3">Member Dashboard</p>
            <h1 className="font-display text-[clamp(38px,5vw,64px)] font-light leading-[0.95] tracking-tight">
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h1>
          </div>
          <div className="flex items-center gap-6 pb-2">
            <div className={`border px-4 py-1.5 ${tc.color}`}>
              <span className="text-[10px] tracking-wide-lg uppercase font-semibold">{tc.label}</span>
            </div>
            <div className="text-right">
              <p className="font-display text-[28px] font-light text-foreground leading-none">{totalPoints}</p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-warm-grey">Points</p>
            </div>
            {referralCode && (
              <div className="flex items-center gap-2 border border-foreground/10 px-3 py-1.5">
                <span className="font-mono text-[12px] tracking-wider text-foreground/60">{referralCode}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(referralCode); toast.success("Code copied!"); }}
                  className="text-[9px] text-accent hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
                >Copy</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── EVENTS FIRST — Primary section ──────── */}
      <section className="px-6 md:px-12 py-[72px] border-b border-border">
        <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-3.5">Upcoming</p>
        <h2 className="font-display text-[clamp(32px,3vw,48px)] font-light leading-tight mb-12">Explore Events</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            <EventSkeleton />
            <EventSkeleton />
            <EventSkeleton />
          </div>
        ) : events.length === 0 ? (
          <div className="border border-border p-14 md:p-20 text-center">
            <p className="font-display text-2xl font-light text-foreground/30 mb-2">No events yet</p>
            <p className="text-[12px] text-warm-grey tracking-wide">Check back soon for upcoming events.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3">
            {events.map((event) => {
              const regStatus = registrations.get(event.id);
              const isRegistered = !!regStatus;
              const isLoading = loadingId === event.id;
              const confirmed = regCounts.get(event.id) || 0;
              const isFull = event.capacity ? confirmed >= event.capacity : false;

              return (
                <div key={event.id} className="bg-background p-10 md:p-12 relative overflow-hidden group hover:bg-foreground/[0.02] border-b border-r border-border transition-colors">
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
                        {isFull && <span className="text-accent">Full</span>}
                      </div>
                      <div className="w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isFull ? "bg-accent" : "bg-accent"}`} style={{ width: `${Math.min(100, (confirmed / event.capacity) * 100)}%` }} />
                      </div>
                    </div>
                  )}

                  {isRegistered ? (
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] tracking-wide-md uppercase flex items-center gap-2 ${
                        regStatus === "waitlist" ? "text-warm-grey" : regStatus === "pending" ? "text-foreground/60" : "text-accent"
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

      {/* ── My Purchases ──────── */}
      <section className="px-6 md:px-12 py-[72px] border-b border-border">
        {effectiveUserId && <MemberPurchases userId={effectiveUserId} />}
      </section>

      {/* ── Loyalty & Rewards ──────── */}
      <section className="px-6 md:px-12 py-[72px] border-b border-border">
        {effectiveUserId && (
          <LoyaltySection
            userId={effectiveUserId}
            tier={buyerTier}
            totalPoints={totalPoints}
            purchaseCount={purchaseCount}
            totalSpent={totalSpent}
          />
        )}
      </section>

      {/* ── Referral Leaderboard ──────── */}
      <section className="px-6 md:px-12 py-[72px]">
        <ReferralLeaderboard />
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
