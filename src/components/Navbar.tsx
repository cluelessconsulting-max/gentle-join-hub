import { useEffect, useState } from "react";

interface NavbarProps {
  onRegister: () => void;
  onSignIn: () => void;
}

const Navbar = ({ onRegister, onSignIn }: NavbarProps) => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-6 md:px-12 py-7 transition-all duration-400 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${scrolled ? "backdrop-blur-xl bg-background/90" : ""}`}
    >
      <a href="#" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">
        Offlist
      </a>
      <div className="flex gap-5 items-center">
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
          Register
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
