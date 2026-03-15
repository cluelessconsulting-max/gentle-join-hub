import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="px-6 md:px-12 py-9 md:py-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-3 text-center">
    <div className="font-display text-[22px] font-light tracking-[0.12em]">Offlist</div>
    <div className="flex items-center gap-4">
      <Link to="/privacy" className="text-[10px] text-warm-grey tracking-wide hover:text-foreground transition-colors no-underline">Privacy Policy</Link>
      <span className="text-warm-grey/30">·</span>
      <Link to="/terms" className="text-[10px] text-warm-grey tracking-wide hover:text-foreground transition-colors no-underline">Terms of Service</Link>
    </div>
    <p className="text-[10px] text-warm-grey tracking-[0.1em]">© 2026 Offlist · London</p>
  </footer>
);

export default Footer;
