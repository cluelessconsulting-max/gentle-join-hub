import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import EventsSection from "@/components/EventsSection";
import Footer from "@/components/Footer";
import RegisterModal from "@/components/RegisterModal";
import SignInModal from "@/components/SignInModal";
import EventAccessModal from "@/components/EventAccessModal";

const Index = () => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [eventModal, setEventModal] = useState<{ title: string; date: string } | null>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const referralCode = useMemo(() => searchParams.get("ref") || undefined, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      if (user.email === "clueless.consulting@gmail.com") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, loading, navigate]);

  const openRegister = () => { setSignInOpen(false); setEventModal(null); setRegisterOpen(true); };
  const openSignIn = () => { setRegisterOpen(false); setEventModal(null); setSignInOpen(true); };

  return (
    <>
      <Navbar onRegister={openRegister} onSignIn={openSignIn} />
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

export default Index;
