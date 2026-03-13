import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import RegisterModal from "@/components/RegisterModal";

const Apply = () => {
  const [searchParams] = useSearchParams();
  const referralCode = useMemo(() => searchParams.get("ref") || undefined, [searchParams]);
  const [registerOpen, setRegisterOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header — no navigation links */}
      <header className="px-6 md:px-12 py-7 flex justify-center">
        <span className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground">
          Offlist
        </span>
      </header>

      {/* Hero content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16 text-center">
        <p
          className="text-[10px] tracking-[0.3em] uppercase text-accent mb-6 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          Private Events Network
        </p>
        <h1
          className="font-display text-[clamp(40px,6vw,72px)] font-light leading-[0.95] tracking-tight mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.5s" }}
        >
          Apply for <em className="italic text-accent">access</em>.
        </h1>
        <p
          className="text-[13px] text-warm-grey tracking-wide leading-relaxed max-w-md mb-10 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.65s" }}
        >
          Curated private events and tailored experiences in your city.
          <br />
          Membership is by application only.
        </p>
        <div className="opacity-0 animate-fade-up" style={{ animationDelay: "0.8s" }}>
          <button
            onClick={() => setRegisterOpen(true)}
            className="bg-primary text-primary-foreground border-none px-14 py-[18px] font-body text-[11px] tracking-wide-xl uppercase cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5"
          >
            Start Application →
          </button>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="px-6 py-6 text-center">
        <p className="text-[10px] text-warm-grey/40 tracking-wide">
          © {new Date().getFullYear()} Offlist. All rights reserved.
        </p>
      </footer>

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        referralCode={referralCode}
      />
    </div>
  );
};

export default Apply;
