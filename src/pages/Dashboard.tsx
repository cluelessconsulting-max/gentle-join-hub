import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import EventConfirmationModal from "@/components/EventConfirmationModal";

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
  const [confirmModal, setConfirmModal] = useState<{ eventName: string; status: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: eventsData }, { data: regsData }, { data: profileData }, { data: allRegs }] = await Promise.all([
        supabase.from("events").select("*"),
        supabase.from("event_registrations" as any).select("event_id, status").eq("user_id", user.id),
        supabase.from("profiles").select("application_status, full_name, referral_code").eq("user_id", user.id).single(),
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
          <div className="font-display text-[56px] text-accent mb-6 leading-none">◆</div>
          {applicationStatus === "rejected" ? (
            <>
              <h1 className="font-display text-[38px] font-light mb-5">Application not approved.</h1>
              <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide">Unfortunately, your application wasn't approved at this time.<br />Feel free to reach out if you have any questions.</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-[38px] font-light mb-5">Application pending.</h1>
              <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide">Your application is under review.<br />We'll notify you once it's been approved.</p>
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
        <div className="flex gap-5 items-center">
          <span className="text-[11px] tracking-wide text-warm-grey">{user?.email}</span>
          <button onClick={handleSignOut} className="text-[10px] tracking-wide-lg uppercase bg-transparent border border-foreground/15 text-foreground px-5 py-2 cursor-pointer transition-colors font-body font-light hover:bg-primary hover:text-primary-foreground hover:border-primary">Sign Out</button>
        </div>
      </nav>

      <section className="px-6 md:px-12 py-16">
        <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-3.5">Your Events</p>
        <h1 className="font-display text-[clamp(32px,4vw,56px)] font-light leading-tight mb-14">Welcome back</h1>

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
                  <span className={`text-[10px] tracking-wide-md uppercase flex items-center gap-2 ${
                    regStatus === "waitlist" ? "text-amber-500" : "text-accent"
                  }`}>
                    {regStatus === "waitlist" ? "⏳ On the waitlist" : "✓ On the guest list"}
                  </span>
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
