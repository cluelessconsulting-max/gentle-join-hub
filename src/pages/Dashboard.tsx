import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Event {
  id: string;
  tag: string;
  name: string;
  date: string;
  location: string;
  access: string;
  description: string | null;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: eventsData }, { data: regsData }] = await Promise.all([
        supabase.from("events").select("*"),
        supabase.from("guest_list_registrations").select("event_id").eq("user_id", user.id),
      ]);
      setEvents((eventsData as Event[]) || []);
      setRegisteredIds(new Set((regsData || []).map((r: { event_id: string }) => r.event_id)));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleRegister = async (eventId: string) => {
    if (!user) return;
    setLoadingId(eventId);
    const { error } = await supabase.from("guest_list_registrations").insert({
      user_id: user.id,
      event_id: eventId,
    });
    if (error) {
      if (error.code === "23505") {
        toast.info("You're already on the guest list!");
      } else {
        toast.error("Something went wrong. Try again.");
      }
    } else {
      setRegisteredIds((prev) => new Set(prev).add(eventId));
      toast.success("You're on the guest list!");
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-7">
        <a href="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">
          Offlist
        </a>
        <div className="flex gap-5 items-center">
          <span className="text-[11px] tracking-wide text-warm-grey">
            {user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-[10px] tracking-wide-lg uppercase bg-transparent border border-foreground/15 text-foreground px-5 py-2 cursor-pointer transition-colors font-body font-light hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Content */}
      <section className="px-6 md:px-12 py-16">
        <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-3.5">Your Events</p>
        <h1 className="font-display text-[clamp(32px,4vw,56px)] font-light leading-tight mb-14">
          Welcome back
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {events.map((event) => {
            const isRegistered = registeredIds.has(event.id);
            const isLoading = loadingId === event.id;
            return (
              <div key={event.id} className="bg-background p-10 md:p-12 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
                <span className="text-[9px] tracking-wide-lg uppercase text-accent mb-6 block">{event.tag}</span>
                <h3 className="font-display text-[28px] font-light leading-tight mb-5">{event.name}</h3>
                <div className="flex flex-col gap-2 mb-9">
                  {[event.date, event.location, event.access].map((item) => (
                    <span key={item} className="text-[11px] text-warm-grey tracking-wide flex gap-2.5 items-center before:content-['—'] before:text-accent before:text-[9px]">
                      {item}
                    </span>
                  ))}
                </div>

                {isRegistered ? (
                  <span className="text-[10px] tracking-wide-md uppercase text-accent flex items-center gap-2">
                    ✓ On the guest list
                  </span>
                ) : (
                  <button
                    onClick={() => handleRegister(event.id)}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground border-none px-8 py-3.5 font-body text-[10px] tracking-wide-lg uppercase cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5 disabled:bg-warm-grey disabled:translate-y-0 disabled:cursor-default"
                  >
                    {isLoading ? "Joining…" : "Get on the guest list →"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
