import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onRegister: () => void;
  onSignIn: () => void;
}

const Navbar = ({ onRegister, onSignIn }: NavbarProps) => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY && y > 80);
      setScrolled(y > 60);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-6 md:px-12 py-7 transition-all duration-400 ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } ${scrolled ? "backdrop-blur-xl bg-background/90" : ""}`}
      >
        <a href="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">
          Offlist
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-5 items-center">
          {user ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="text-[11px] tracking-wide-md uppercase text-foreground opacity-45 hover:opacity-100 transition-opacity cursor-pointer border-none bg-transparent font-body font-light"
              >
                Dashboard
              </button>
              <button
                onClick={async () => { await signOut(); navigate("/"); }}
                className="text-[10px] tracking-wide-lg uppercase bg-primary text-primary-foreground px-6 py-2.5 cursor-pointer transition-colors border-none font-body font-light hover:bg-accent"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onSignIn}
                className="text-[11px] tracking-wide-md uppercase text-foreground opacity-45 hover:opacity-100 transition-opacity cursor-pointer border-none bg-transparent font-body font-light"
              >
                Sign In
              </button>
              <button
                onClick={onRegister}
                className="text-[10px] tracking-wide-lg uppercase bg-primary text-primary-foreground px-6 py-2.5 cursor-pointer transition-colors border-none font-body font-light hover:bg-accent"
              >
                Apply
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden bg-transparent border-none text-foreground cursor-pointer p-1"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-[280px] bg-background shadow-xl p-8 flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-10">
              <span className="font-display text-[20px] font-light tracking-wide-md uppercase">Offlist</span>
              <button onClick={() => setMenuOpen(false)} className="bg-transparent border-none text-foreground cursor-pointer" aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {user ? (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}
                    className="text-left text-[12px] tracking-wide-lg uppercase text-foreground bg-transparent border-none cursor-pointer font-body py-2"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={async () => { setMenuOpen(false); await signOut(); navigate("/"); }}
                    className="text-left text-[12px] tracking-wide-lg uppercase text-warm-grey bg-transparent border-none cursor-pointer font-body py-2"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); onRegister(); }}
                    className="bg-primary text-primary-foreground py-3 text-[11px] tracking-wide-lg uppercase border-none cursor-pointer font-body font-light"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onSignIn(); }}
                    className="bg-transparent border border-foreground/15 text-foreground py-3 text-[11px] tracking-wide-lg uppercase cursor-pointer font-body font-light"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
