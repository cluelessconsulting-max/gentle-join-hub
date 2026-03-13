import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ModalOverlay from "./ModalOverlay";

interface Props {
  open: boolean;
  onClose: () => void;
}

const interests = ["Fashion & Style", "Luxury & Lifestyle", "Art & Design", "Gastronomy & Social Dining", "Fitness & Wellness", "Travel & Culture"];
const shopStyles = [
  { value: "Fashion Fanatic", label: "Fashion Fanatic — trend-driven, always first to discover" },
  { value: "Selective Spender", label: "Selective Spender — quality over quantity, considered purchases" },
  { value: "Occasion Buyer", label: "Occasion Buyer — shops for specific events or moments" },
  { value: "Habitual Buyer", label: "Habitual Buyer — loyal to a few trusted brands" },
  { value: "Social Shopper", label: "Social Shopper — discovers through community and friends" },
];

const RegisterModal = ({ open, onClose }: Props) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [referral, setReferral] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !password || !city) {
      setError("Please fill required fields");
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setTimeout(() => setError(""), 2000);
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: authError } = await signUp(email, password, `${firstName} ${lastName}`);
    if (authError) {
      setError(authError);
      setSubmitting(false);
      setTimeout(() => setError(""), 3000);
    } else {
      // Sync contact to Brevo (fire and forget)
      supabase.functions.invoke('sync-brevo', {
        body: { email, firstName, lastName, city, referral },
      }).catch(err => console.error('Brevo sync error:', err));
      
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setCity("");
      setReferral("");
      setMoreOpen(false);
    }, 300);
  };

  const inputClass = "w-full bg-transparent border-none border-b border-input text-foreground font-body text-[15px] font-light py-2.5 outline-none transition-colors tracking-wide focus:border-accent placeholder:text-foreground/20";

  return (
    <ModalOverlay open={open} onClose={handleClose}>
      {!submitted ? (
        <div className="p-10 md:p-12">
          <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-4">Join Offlist</p>
          <h2 className="font-display text-[34px] font-light leading-tight mb-2.5">Apply for access.</h2>
          <div className="h-9" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <div className="mb-6">
              <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">First Name</label>
              <input className={inputClass} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ borderBottom: "1px solid hsl(var(--input))" }} />
            </div>
            <div className="mb-6">
              <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">Last Name</label>
              <input className={inputClass} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ borderBottom: "1px solid hsl(var(--input))" }} />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">Email</label>
            <input className={inputClass} type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ borderBottom: "1px solid hsl(var(--input))" }} />
          </div>
          <div className="mb-6">
            <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">Password</label>
            <input className={inputClass} type="password" placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={{ borderBottom: "1px solid hsl(var(--input))" }} />
          </div>
          <div className="mb-6">
            <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">City</label>
            <input className={inputClass} placeholder="City you live in" value={city} onChange={(e) => setCity(e.target.value)} style={{ borderBottom: "1px solid hsl(var(--input))" }} />
          </div>
          <div className="mb-6">
            <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">Referred by</label>
            <input className={inputClass} placeholder="Who referred you?" value={referral} onChange={(e) => setReferral(e.target.value)} style={{ borderBottom: "1px solid hsl(var(--input))" }} />
          </div>

          {/* More Info Toggle */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="w-full bg-transparent border border-foreground/15 px-4 py-3.5 font-body text-[10px] tracking-[0.16em] uppercase text-warm-grey cursor-pointer flex justify-between items-center transition-all hover:border-accent hover:text-accent mt-5"
          >
            <span>Add more info about yourself</span>
            <span className={`transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}>↓</span>
          </button>

          {moreOpen && (
            <div className="border border-t-0 border-foreground/10 overflow-hidden">
              <div className="p-5 md:p-7 flex flex-col gap-5">
                <p className="text-[10px] tracking-wide-lg uppercase text-accent">Help us tailor the events we bring you</p>

                <div>
                  <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-3">What are your main interests?</label>
                  <div className="flex flex-col">
                    {interests.map((item) => (
                      <label key={item} className="flex items-center gap-3 py-2 border-b border-foreground/5 cursor-pointer last:border-b-0">
                        <input type="checkbox" className="appearance-none w-3.5 h-3.5 border border-foreground/25 shrink-0 cursor-pointer relative checked:bg-accent checked:border-accent transition-all" />
                        <span className="text-xs tracking-wide text-foreground">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-3">What best describes your shopping style?</label>
                  <div className="flex flex-col">
                    {shopStyles.map((item) => (
                      <label key={item.value} className="flex items-center gap-3 py-2 border-b border-foreground/5 cursor-pointer last:border-b-0">
                        <input type="radio" name="shopProfile" className="appearance-none w-3.5 h-3.5 border border-foreground/25 rounded-full shrink-0 cursor-pointer relative checked:border-accent transition-all" />
                        <span className="text-xs tracking-wide text-foreground leading-snug">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">How often do you attend events?</label>
                  <select className={`${inputClass} cursor-pointer`} style={{ borderBottom: "1px solid hsl(var(--input))" }}>
                    <option value="">Select frequency</option>
                    <option>Several times a week</option>
                    <option>Once a week</option>
                    <option>A few times a month</option>
                    <option>Occasionally</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2">How did you hear about Offlist?</label>
                  <select className={`${inputClass} cursor-pointer`} style={{ borderBottom: "1px solid hsl(var(--input))" }}>
                    <option value="">Select</option>
                    <option>From a friend</option>
                    <option>Instagram</option>
                    <option>At an event</option>
                    <option>QR Code</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-[11px] text-destructive tracking-wide mt-3">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground border-none py-[18px] font-body text-[11px] tracking-wide-lg uppercase cursor-pointer mt-7 transition-all hover:bg-accent hover:-translate-y-0.5 disabled:bg-warm-grey disabled:translate-y-0 disabled:cursor-default"
          >
            {submitting ? "Submitting…" : "Submit →"}
          </button>
        </div>
      ) : (
        <div className="py-20 px-12 text-center animate-fade-up">
          <div className="font-display text-[56px] text-accent mb-5 leading-none">◆</div>
          <h2 className="font-display text-[38px] font-light mb-4">You're on the list.</h2>
          <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide">
            Welcome to Offlist.
            <br />
            Check your email to confirm your account.
          </p>
        </div>
      )}
    </ModalOverlay>
  );
};

export default RegisterModal;
