import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ModalOverlay from "./ModalOverlay";

interface Props {
  open: boolean;
  onClose: () => void;
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

const travelOptions = [
  { value: "Boutique Hotels", label: "Boutique hotels in hidden gems" },
  { value: "Five Star Resorts", label: "Five-star resorts & beach clubs" },
  { value: "Private Villas", label: "Private villas & members-only retreats" },
  { value: "City Explorer", label: "Spontaneous city breaks & Airbnbs" },
  { value: "Adventure Travel", label: "Adventure & off-the-grid experiences" },
];

const nightOutOptions = [
  { value: "Intimate Dinner", label: "Intimate dinner at a reservation-only spot" },
  { value: "Rooftop Cocktails", label: "Rooftop cocktails & late-night DJ sets" },
  { value: "Private Members Club", label: "Private members' club with close friends" },
  { value: "Gallery & Culture", label: "Gallery opening followed by wine bar" },
  { value: "House Party", label: "House party or underground event" },
];

const frequencyOptions = ["Several times a week", "Once a week", "A few times a month", "Occasionally"];
const howHeardOptions = ["From a friend", "Instagram", "TikTok", "At an event", "QR Code", "Other"];

const RegisterModal = ({ open, onClose }: Props) => {
  const [step, setStep] = useState(1);
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
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const validateStep1 = () => {
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
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
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

    // Get the newly created user to update their profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        full_name: fullName,
        city,
        age: age ? parseInt(age) : null,
        instagram: instagram || null,
        tiktok: tiktok || null,
        phone: phone || null,
        interests,
        shopping_style: shoppingStyle || null,
        event_frequency: eventFrequency || null,
        referral: referral || null,
        how_heard: howHeard || null,
        job_title: jobTitle || null,
        industry: industry || null,
        travel_style: travelStyle || null,
        ideal_night_out: idealNightOut || null,
        favourite_neighbourhoods: favouriteNeighbourhoods || null,
        application_status: "pending",
      }).eq("user_id", user.id);
    }

    // Sync to Brevo
    supabase.functions.invoke("sync-brevo", {
      body: {
        email,
        firstName,
        lastName,
        city,
        age: age || "",
        instagram: instagram || "",
        tiktok: tiktok || "",
        phone: phone || "",
        interests: interests.join(", "),
        shoppingStyle: shoppingStyle || "",
        eventFrequency: eventFrequency || "",
        referral: referral || "",
        howHeard: howHeard || "",
        jobTitle: jobTitle || "",
        industry: industry || "",
        travelStyle: travelStyle || "",
        idealNightOut: idealNightOut || "",
        favouriteNeighbourhoods: favouriteNeighbourhoods || "",
      },
    }).catch((err) => console.error("Brevo sync error:", err));

    setSubmitted(true);
    setSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setStep(1);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setCity("");
      setAge("");
      setInstagram("");
      setTiktok("");
      setReferral("");
      setInterests([]);
      setShoppingStyle("");
      setEventFrequency("");
      setHowHeard("");
      setJobTitle("");
      setIndustry("");
      setTravelStyle("");
      setIdealNightOut("");
      setFavouriteNeighbourhoods("");
    }, 300);
  };

  const inputClass =
    "w-full bg-transparent border-none text-foreground font-body text-[15px] font-light py-2.5 outline-none transition-colors tracking-wide focus:border-accent placeholder:text-foreground/20";
  const labelClass = "block text-[10px] tracking-wide-lg uppercase text-warm-grey mb-2";
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
          <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-4">Step 1 of 2</p>
          <h2 className="font-display text-[34px] font-light leading-tight mb-2.5">Apply for access.</h2>
          <div className="h-7" />

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

          <div className="mb-5">
            <label className={labelClass}>Phone Number *</label>
            <p className="text-[10px] text-warm-grey/70 tracking-wide mb-1.5">For guest list confirmations and event details</p>
            <input className={inputClass} type="tel" placeholder="+44 7700 000000" value={phone} onChange={(e) => setPhone(e.target.value)} style={borderStyle} />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <div className="mb-5">
              <label className={labelClass}>Instagram Handle</label>
              <input className={inputClass} placeholder="@yourhandle" value={instagram} onChange={(e) => setInstagram(e.target.value)} style={borderStyle} />
            </div>
            <div className="mb-5">
              <label className={labelClass}>TikTok Handle</label>
              <input className={inputClass} placeholder="@yourhandle (optional)" value={tiktok} onChange={(e) => setTiktok(e.target.value)} style={borderStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <div className="mb-5">
              <label className={labelClass}>What do you do?</label>
              <input className={inputClass} placeholder="e.g. Creative Director, Founder..." value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} style={borderStyle} />
            </div>
            <div className="mb-5">
              <label className={labelClass}>Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={`${inputClass} cursor-pointer`} style={borderStyle}>
                <option value="">Select your world</option>
                {industryOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
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
          <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-4">Step 2 of 2</p>
          <h2 className="font-display text-[34px] font-light leading-tight mb-2.5">Tell us about you.</h2>
          <p className="text-[11px] text-warm-grey tracking-wide mb-7">Help us tailor the events we bring you</p>

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

          {/* Event Frequency */}
          <div className="mb-6">
            <label className={labelClass}>How often do you attend events?</label>
            <select
              value={eventFrequency}
              onChange={(e) => setEventFrequency(e.target.value)}
              className={`${inputClass} cursor-pointer`}
              style={borderStyle}
            >
              <option value="">Select frequency</option>
              {frequencyOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* How Heard */}
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
