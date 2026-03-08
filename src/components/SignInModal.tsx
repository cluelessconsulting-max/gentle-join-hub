import { useState } from "react";
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
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

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

        <div className="mb-6">
          <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">Email</label>
          <input className={inputClass} type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ borderBottom: "1px solid hsl(var(--input))" }} />
        </div>
        <div className="mb-6">
          <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">Password</label>
          <input className={inputClass} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ borderBottom: "1px solid hsl(var(--input))" }} />
        </div>

        {error && (
          <p className="text-[11px] text-destructive tracking-wide mb-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
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
