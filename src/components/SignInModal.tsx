import { useState } from "react";
import ModalOverlay from "./ModalOverlay";

interface Props {
  open: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const SignInModal = ({ open, onClose, onSwitchToRegister }: Props) => {
  const [signing, setSigning] = useState(false);

  const inputClass = "w-full bg-transparent border-none text-foreground font-body text-[15px] font-light py-2.5 outline-none transition-colors tracking-wide focus:border-accent placeholder:text-foreground/20";

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="p-10 md:p-12">
        <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-4">Welcome back</p>
        <h2 className="font-display text-[34px] font-light leading-tight mb-2.5">Sign in.</h2>
        <div className="h-9" />

        <div className="mb-6">
          <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">Email</label>
          <input className={inputClass} type="email" placeholder="your@email.com" style={{ borderBottom: "1px solid hsl(var(--input))" }} />
        </div>
        <div className="mb-6">
          <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">Password</label>
          <input className={inputClass} type="password" placeholder="••••••••" style={{ borderBottom: "1px solid hsl(var(--input))" }} />
        </div>

        <button
          onClick={() => { setSigning(true); setTimeout(() => setSigning(false), 1500); }}
          disabled={signing}
          className="w-full bg-primary text-primary-foreground border-none py-[18px] font-body text-[11px] tracking-wide-lg uppercase cursor-pointer mt-3 transition-all hover:bg-accent hover:-translate-y-0.5 disabled:bg-warm-grey disabled:translate-y-0 disabled:cursor-default"
        >
          {signing ? "Signing in…" : "Sign In →"}
        </button>

        <p className="text-center mt-5 text-[11px] text-warm-grey tracking-wide">
          No account?{" "}
          <span className="cursor-pointer underline text-foreground" onClick={() => { onClose(); setTimeout(onSwitchToRegister, 120); }}>
            Register here
          </span>
        </p>
      </div>
    </ModalOverlay>
  );
};

export default SignInModal;
