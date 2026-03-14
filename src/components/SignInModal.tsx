import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ModalOverlay from "./ModalOverlay";

interface Props {
  open: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const SignInModal = ({ open, onClose, onSwitchToRegister }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("offlist_remember");
    if (saved) {
      const { email: savedEmail } = JSON.parse(saved);
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const inputClass = "w-full bg-transparent border-none text-foreground font-body text-[15px] font-light py-2.5 outline-none transition-colors tracking-wide focus:border-accent placeholder:text-foreground/20";

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill all fields");
      setTimeout(() => setError(""), 2000);
      return;
    }
    setSigning(true);
    setError("");
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError);
      setSigning(false);
      setTimeout(() => setError(""), 3000);
    } else {
      if (rememberMe) {
        localStorage.setItem("offlist_remember", JSON.stringify({ email }));
      } else {
        localStorage.removeItem("offlist_remember");
      }
      setSigning(false);
      onClose();
      navigate("/dashboard");
    }
  };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="p-10 md:p-12">
        <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-4">Welcome back</p>
        <h2 className="font-display text-[34px] font-light leading-tight mb-2.5">Sign in.</h2>
        <div className="h-9" />

        <form autoComplete="on" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="mb-6">
            <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">Email</label>
            <input className={inputClass} type="email" name="email" autoComplete="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ borderBottom: "1px solid hsl(var(--input))" }} />
          </div>
          <div className="mb-6">
            <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">Password</label>
            <input className={inputClass} type="password" name="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ borderBottom: "1px solid hsl(var(--input))" }} />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer mb-2 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 accent-accent cursor-pointer"
            />
            <span className="text-[11px] tracking-wide text-warm-grey">Remember me</span>
          </label>

          <p className="text-right mb-4">
            <span
              className="text-[11px] text-warm-grey tracking-wide cursor-pointer underline hover:text-foreground transition-colors"
              onClick={async () => {
                if (!email) {
                  setError("Enter your email first");
                  setTimeout(() => setError(""), 2000);
                  return;
                }
                const { error: err } = await resetPassword(email);
                if (err) {
                  setError(err);
                  setTimeout(() => setError(""), 3000);
                } else {
                  setResetSent(true);
                  setTimeout(() => setResetSent(false), 5000);
                }
              }}
            >
              Forgot password?
            </span>
          </p>

          {resetSent && (
            <p className="text-[11px] text-accent tracking-wide mb-3">
              Reset link sent — check your inbox.
            </p>
          )}

          {error && (
            <p className="text-[11px] text-destructive tracking-wide mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={signing}
            className="w-full bg-primary text-primary-foreground border-none py-[18px] font-body text-[11px] tracking-wide-lg uppercase cursor-pointer mt-3 transition-all hover:bg-accent hover:-translate-y-0.5 disabled:bg-warm-grey disabled:translate-y-0 disabled:cursor-default"
          >
            {signing ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <p className="text-center mt-5 text-[11px] text-warm-grey tracking-wide">
          No account?{" "}
          <span className="cursor-pointer underline text-foreground" onClick={() => { onClose(); setTimeout(onSwitchToRegister, 120); }}>
            Apply here
          </span>
        </p>
      </div>
    </ModalOverlay>
  );
};

export default SignInModal;
