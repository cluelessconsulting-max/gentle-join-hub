import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ModalOverlay from "./ModalOverlay";

interface Props {
  open: boolean;
  onClose: () => void;
  referralCode?: string;
}

const interestOptions = [
  "Fashion & Style",
  "Music & Nightlife",
  "Art & Design",
  "Gastronomy & Social Dining",
  "Fitness & Wellness",
  "Travel & Culture",
  "Luxury & Lifestyle",
];

const shopStyles = [
  { value: "Fashion Fanatic", label: "Fashion Fanatic — trend-driven, always first to discover" },
  { value: "Selective Spender", label: "Selective Spender — quality over quantity" },
  { value: "Occasion Buyer", label: "Occasion Buyer — shops for specific events" },
  { value: "Habitual Buyer", label: "Habitual Buyer — loyal to trusted brands" },
  { value: "Social Shopper", label: "Social Shopper — discovers through community" },
];

const industryOptions = [
  "Fashion & Retail", "Finance & Investments", "Tech & Startups",
  "Creative & Media", "Real Estate", "Hospitality & F&B",
  "Law & Consulting", "Healthcare", "Entertainment & Music", "Other",
];

const howHeardOptions = ["From a friend", "Instagram", "TikTok", "At an event", "QR Code", "Other"];

const RegisterModal = ({ open, onClose, referralCode }: Props) => {
  const [step, setStep] = useState(1);
  const [skipped, setSkipped] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [referral, setReferral] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [shoppingStyle, setShoppingStyle] = useState("");
  const [eventFrequency, setEventFrequency] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [idealNightOut, setIdealNightOut] = useState("");
  const [favouriteNeighbourhoods, setFavouriteNeighbourhoods] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteRequired, setInviteRequired] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();

  // Check if invite-only mode is enabled
  useEffect(() => {
    const checkInviteMode = async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "invite_only")
        .single();
      if (data) {
        setInviteRequired((data as any).value?.enabled === true);
      }
    };
    checkInviteMode();
  }, [open]);

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const validateStep1 = async () => {
    if (!firstName || !lastName || !email || !password || !phone || !city) {
      setError("Please fill all required fields");
      setTimeout(() => setError(""), 2500);
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setTimeout(() => setError(""), 2500);
      return false;
    }
    const cleanPhone = phone.replace(/[\s()-]/g, '');
    if (!/^\+\d{7,15}$/.test(cleanPhone)) {
      setError("Please enter a valid phone number with country code (e.g. +44...)");
      setTimeout(() => setError(""), 3000);
      return false;
    }
    // Validate invite code if required
    if (inviteRequired) {
      if (!inviteCode.trim()) {
        setError("An invite code is required to join");
        setTimeout(() => setError(""), 2500);
        return false;
      }
      const { data } = await supabase
        .from("invites" as any)
        .select("id")
        .eq("code", inviteCode.trim().toUpperCase())
        .is("used_by", null)
        .single();
      if (!data) {
        setError("Invalid or already used invite code");
        setTimeout(() => setError(""), 3000);
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (await validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (isSkip = false) => {
    setSubmitting(true);
    setError("");

    const fullName = `${firstName} ${lastName}`;
    const { error: authError } = await signUp(email, password, fullName);

    if (authError) {
      setError(authError);
      setSubmitting(false);
      setTimeout(() => setError(""), 3000);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profileData: Record<string, any> = {
        full_name: fullName,
        city,
        age: age ? parseInt(age) : null,
        instagram: instagram || null,
        tiktok: tiktok || null,
        phone: phone || null,
        referral: referral || null,
        favourite_neighbourhoods: favouriteNeighbourhoods || null,
        application_status: "pending",
      };

      if (!isSkip) {
        profileData.interests = interests;
        profileData.shopping_style = shoppingStyle || null;
        profileData.event_frequency = eventFrequency || null;
        profileData.how_heard = howHeard || null;
        profileData.job_title = jobTitle || null;
        profileData.industry = industry || null;
        profileData.travel_style = travelStyle || null;
        profileData.ideal_night_out = idealNightOut || null;
      }

      await supabase.from("profiles").update(profileData as any).eq("user_id", user.id);

      // Claim invite code if provided
      if (inviteCode.trim()) {
        await supabase.rpc("claim_invite" as any, {
          p_code: inviteCode.trim().toUpperCase(),
          p_user_id: user.id,
        });
      }

      // Set referral if came via ?ref= link
      if (referralCode) {
        await supabase.rpc("set_referral" as any, {
          p_user_id: user.id,
          p_referral_code: referralCode.toUpperCase(),
        });
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-application-email", {
          body: { email, firstName, skipped: isSkip },
        });
      } catch (e) {
        console.error("Email send error:", e);
      }
    }

    setSkipped(isSkip);
    setSubmitted(true);
    setSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false); setSkipped(false);
      setStep(1);
      setFirstName(""); setLastName(""); setEmail(""); setPassword("");
      setPhone(""); setCity(""); setAge(""); setInstagram(""); setTiktok("");
      setReferral(""); setInterests([]); setShoppingStyle(""); setEventFrequency("");
      setHowHeard(""); setJobTitle(""); setIndustry(""); setTravelStyle("");
      setIdealNightOut(""); setFavouriteNeighbourhoods(""); setInviteCode("");
    }, 300);
  };

  const inputClass =
    "w-full bg-transparent border-none text-foreground font-body text-[16px] md:text-[15px] font-light py-2.5 outline-none transition-colors tracking-wide focus:border-accent placeholder:text-foreground/20";
  const labelClass = "block text-[12px] md:text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2";
  const borderStyle = { borderBottom: "1px solid hsl(var(--input))" };

  return (
    <ModalOverlay open={open} onClose={handleClose}>
      {submitted ? (
        <div className="py-20 px-12 text-center animate-fade-up">
          <div className="font-display text-[56px] text-accent mb-5 leading-none">◆</div>
          <h2 className="font-display text-[38px] font-light mb-4">Application received.</h2>
          <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide">
            Welcome to Offlist.
            <br />
            Check your email to confirm your account.
            <br />
            We'll review your application and get back to you shortly.
          </p>
        </div>
      ) : step === 1 ? (
        <div className="p-10 md:p-12">
          <p className="text-[12px] md:text-[10px] tracking-[0.24em] uppercase text-accent mb-4">Step 1 of 2</p>
          <h2 className="font-display text-[38px] md:text-[34px] font-light leading-tight mb-2.5">Apply for access.</h2>
          <div className="h-7" />

          {inviteRequired && (
            <div className="mb-5">
              <label className={labelClass}>Invite Code *</label>
              <p className="text-[10px] text-warm-grey/70 tracking-wide mb-1.5">Offlist is invite-only. Enter the code you received.</p>
              <input
                className={inputClass}
                placeholder="Enter your invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                style={borderStyle}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <div className="mb-5">
              <label className={labelClass}>First Name *</label>
              <input className={inputClass} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={borderStyle} />
            </div>
            <div className="mb-5">
              <label className={labelClass}>Last Name *</label>
              <input className={inputClass} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} style={borderStyle} />
            </div>
          </div>

          <div className="mb-5">
            <label className={labelClass}>Email *</label>
            <input className={inputClass} type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={borderStyle} />
          </div>

          <div className="mb-5">
            <label className={labelClass}>Password *</label>
            <input className={inputClass} type="password" placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={borderStyle} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <div className="mb-5">
              <label className={labelClass}>City *</label>
              <input className={inputClass} placeholder="City you live in" value={city} onChange={(e) => setCity(e.target.value)} style={borderStyle} />
            </div>
            <div className="mb-5">
              <label className={labelClass}>Age</label>
              <input className={inputClass} type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} style={borderStyle} />
            </div>
          </div>

          {city.toLowerCase().includes("london") && (
            <div className="mb-5">
              <label className={labelClass}>Area / Neighbourhood</label>
              <input className={inputClass} placeholder="e.g. Shoreditch, Chelsea, Notting Hill..." value={favouriteNeighbourhoods} onChange={(e) => setFavouriteNeighbourhoods(e.target.value)} style={borderStyle} />
            </div>
          )}

          <div className="mb-5">
            <label className={labelClass}>Phone Number *</label>
            <p className="text-[10px] text-warm-grey/70 tracking-wide mb-1.5">Include country code (e.g. +44, +1, +39). Required for guest list confirmations.</p>
            <input
              className={inputClass}
              type="tel"
              placeholder="+44 7700 000000"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9+\s()-]/g, '');
                setPhone(val);
              }}
              onFocus={() => {
                if (!phone) {
                  const cityLower = city.toLowerCase().trim();
                  const prefixMap: Record<string, string> = {
                    london: '+44 ', uk: '+44 ', manchester: '+44 ', birmingham: '+44 ', edinburgh: '+44 ', bristol: '+44 ', leeds: '+44 ', liverpool: '+44 ', glasgow: '+44 ',
                    milano: '+39 ', milan: '+39 ', roma: '+39 ', rome: '+39 ', firenze: '+39 ', florence: '+39 ', napoli: '+39 ', torino: '+39 ', turin: '+39 ', bologna: '+39 ', venezia: '+39 ', venice: '+39 ',
                    paris: '+33 ', lyon: '+33 ', marseille: '+33 ', nice: '+33 ',
                    'new york': '+1 ', 'los angeles': '+1 ', miami: '+1 ', chicago: '+1 ', 'san francisco': '+1 ',
                    dubai: '+971 ', 'abu dhabi': '+971 ',
                    berlin: '+49 ', munich: '+49 ', hamburg: '+49 ', frankfurt: '+49 ',
                    madrid: '+34 ', barcelona: '+34 ',
                    amsterdam: '+31 ',
                    lisbon: '+351 ', lisboa: '+351 ',
                    zurich: '+41 ', geneva: '+41 ',
                  };
                  const prefix = Object.entries(prefixMap).find(([key]) => cityLower.includes(key));
                  if (prefix) setPhone(prefix[1]);
                }
              }}
              style={borderStyle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <div className="mb-5">
              <label className={labelClass}>Instagram</label>
              <p className="text-[10px] text-warm-grey/70 tracking-wide mb-1.5">Handle or profile link</p>
              <input className={inputClass} placeholder="@handle or instagram.com/..." value={instagram} onChange={(e) => setInstagram(e.target.value)} style={borderStyle} />
            </div>
            <div className="mb-5">
              <label className={labelClass}>TikTok</label>
              <p className="text-[10px] text-warm-grey/70 tracking-wide mb-1.5">Handle or profile link</p>
              <input className={inputClass} placeholder="@handle or tiktok.com/..." value={tiktok} onChange={(e) => setTiktok(e.target.value)} style={borderStyle} />
            </div>
          </div>

          <div className="mb-5">
            <label className={labelClass}>Referred by</label>
            <input className={inputClass} placeholder="Who referred you?" value={referral} onChange={(e) => setReferral(e.target.value)} style={borderStyle} />
          </div>

          {error && <p className="text-[11px] text-destructive tracking-wide mt-2">{error}</p>}

          <button
            onClick={handleNext}
            className="w-full bg-primary text-primary-foreground border-none py-[18px] font-body text-[11px] tracking-wide-lg uppercase cursor-pointer mt-6 transition-all hover:bg-accent hover:-translate-y-0.5"
          >
            Continue →
          </button>
        </div>
      ) : (
        <div className="p-10 md:p-12">
          <p className="text-[12px] md:text-[10px] tracking-[0.24em] uppercase text-accent mb-4">Step 2 of 2</p>
          <h2 className="font-display text-[38px] md:text-[34px] font-light leading-tight mb-2.5">Tell us about you.</h2>
          <p className="text-[13px] md:text-[11px] text-warm-grey tracking-wide mb-7">Help us tailor the events we bring you</p>

          {/* Interests */}
          <div className="mb-6">
            <label className={labelClass}>What are your main interests?</label>
            <div className="flex flex-col">
              {interestOptions.map((item) => (
                <label key={item} className="flex items-center gap-3 py-2 border-b border-foreground/5 cursor-pointer last:border-b-0">
                  <input
                    type="checkbox"
                    checked={interests.includes(item)}
                    onChange={() => toggleInterest(item)}
                    className="appearance-none w-3.5 h-3.5 border border-foreground/25 shrink-0 cursor-pointer relative checked:bg-accent checked:border-accent transition-all"
                  />
                  <span className="text-xs tracking-wide text-foreground">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-border mb-6" />

          {/* Shopping Style */}
          <div className="mb-6">
            <label className={labelClass}>What best describes your shopping style?</label>
            <div className="flex flex-col">
              {shopStyles.map((item) => (
                <label key={item.value} className="flex items-center gap-3 py-2 border-b border-foreground/5 cursor-pointer last:border-b-0">
                  <input
                    type="radio"
                    name="shopStyle"
                    checked={shoppingStyle === item.value}
                    onChange={() => setShoppingStyle(item.value)}
                    className="appearance-none w-3.5 h-3.5 border border-foreground/25 rounded-full shrink-0 cursor-pointer relative checked:border-accent transition-all"
                  />
                  <span className="text-xs tracking-wide text-foreground leading-snug">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-border mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <div className="mb-6">
              <label className={labelClass}>Your industry / job role</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={`${inputClass} cursor-pointer`}
                style={borderStyle}
              >
                <option value="">Select</option>
                {industryOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className={labelClass}>How did you hear about Offlist?</label>
              <select
                value={howHeard}
                onChange={(e) => setHowHeard(e.target.value)}
                className={`${inputClass} cursor-pointer`}
                style={borderStyle}
              >
                <option value="">Select</option>
                {howHeardOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-[11px] text-destructive tracking-wide mt-2">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-transparent border border-foreground/15 text-foreground py-[18px] font-body text-[11px] tracking-wide-lg uppercase cursor-pointer transition-all hover:border-accent hover:text-accent"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-[2] bg-primary text-primary-foreground border-none py-[18px] font-body text-[11px] tracking-wide-lg uppercase cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5 disabled:bg-warm-grey disabled:translate-y-0 disabled:cursor-default"
            >
              {submitting ? "Submitting…" : "Submit Application →"}
            </button>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
};

export default RegisterModal;
