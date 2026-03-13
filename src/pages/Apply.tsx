import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Hero from "@/components/Hero";
import EventsSection from "@/components/EventsSection";
import Footer from "@/components/Footer";
import RegisterModal from "@/components/RegisterModal";
import SignInModal from "@/components/SignInModal";
import EventAccessModal from "@/components/EventAccessModal";

const Apply = () => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [eventModal, setEventModal] = useState<{ title: string; date: string } | null>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const referralCode = useMemo(() => searchParams.get("ref") || undefined, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const openRegister = () => { setSignInOpen(false); setEventModal(null); setRegisterOpen(true); };
  const openSignIn = () => { setRegisterOpen(false); setEventModal(null); setSignInOpen(true); };

  return (
    <>
      {/* Standalone navbar — no links to main site */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-5 bg-background/80 backdrop-blur-md transition-transform duration-300">
        <span className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground">
          Offlist
        </span>
        <div className="flex gap-5 items-center">
          <button
            onClick={openSignIn}
            className="text-[10px] tracking-wide-md uppercase text-foreground opacity-45 hover:opacity-100 transition-opacity cursor-pointer border-none bg-transparent font-body font-light"
          >
            Sign In
          </button>
          <button
            onClick={openRegister}
            className="bg-primary text-primary-foreground border-none px-6 py-2.5 font-body text-[10px] tracking-wide-lg uppercase cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5"
          >
            Apply
          </button>
        </div>
      </nav>

      <Hero onRegister={openRegister} onSignIn={openSignIn} />
      <EventsSection onEventClick={(name, date) => setEventModal({ title: name, date })} />
      <Footer />

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} referralCode={referralCode} />
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} onSwitchToRegister={openRegister} />
      <EventAccessModal
        open={!!eventModal}
        onClose={() => setEventModal(null)}
        title={eventModal?.title || ""}
        date={eventModal?.date || ""}
        onRegister={openRegister}
        onSignIn={openSignIn}
      />
    </>
  );
};

export default Apply;
