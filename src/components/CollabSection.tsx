import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const roles = [
  "Photographer",
  "Content Creator",
  "Model",
  "Actress / Actor",
  "Stylist",
  "Makeup Artist",
  "DJ / Musician",
  "Other",
];

const CollabSection = () => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "",
    portfolio_url: "",
    message: "",
    city: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.role) return;
    setSubmitting(true);

    const { error } = await supabase.from("collaboration_requests" as any).insert({
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      portfolio_url: form.portfolio_url || null,
      message: form.message || null,
      city: form.city || null,
    } as any);

    if (error) {
      toast.error("Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
      toast.success("Request submitted!");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <section className="px-6 md:px-12 py-[72px] md:py-[100px] border-t border-border" id="collab">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-8 rounded-full bg-accent/15 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-display text-[28px] font-light mb-4">Thank you for your interest.</h3>
          <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide">
            We've received your collaboration request. Our team will review it and get back to you shortly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 md:px-12 py-[72px] md:py-[100px] border-t border-border" id="collab">
      <div className="max-w-2xl">
        <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-3.5">Collaborate</p>
        <h2 className="font-display text-[clamp(32px,3vw,48px)] font-light leading-tight mb-4">Work With Us</h2>
        <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide mb-3 max-w-lg">
          We're looking for partners across all industries for fashion-related events and beyond.
          Photographers, content creators, models, stylists — if you're based in London or able to access London, we want to hear from you.
        </p>
        <p className="text-[11px] text-foreground/40 tracking-wide mb-10">
          Attach your portfolio or link to your business below.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md">
          <input
            type="text"
            placeholder="Full name *"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="bg-transparent border border-foreground/15 text-foreground px-4 py-3.5 text-[12px] tracking-wide outline-none font-body transition-colors focus:border-accent placeholder:text-foreground/25"
          />
          <input
            type="email"
            placeholder="Email *"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="bg-transparent border border-foreground/15 text-foreground px-4 py-3.5 text-[12px] tracking-wide outline-none font-body transition-colors focus:border-accent placeholder:text-foreground/25"
          />

          <div>
            <p className="text-[10px] tracking-wide-lg uppercase text-warm-grey mb-3">Your role *</p>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`text-[10px] tracking-[0.14em] uppercase px-4 py-[7px] border cursor-pointer transition-all ${
                    form.role === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-foreground/15 text-warm-grey hover:border-foreground/30"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="City (e.g. London)"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="bg-transparent border border-foreground/15 text-foreground px-4 py-3.5 text-[12px] tracking-wide outline-none font-body transition-colors focus:border-accent placeholder:text-foreground/25"
          />

          <input
            type="url"
            placeholder="Portfolio or website link"
            value={form.portfolio_url}
            onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
            className="bg-transparent border border-foreground/15 text-foreground px-4 py-3.5 text-[12px] tracking-wide outline-none font-body transition-colors focus:border-accent placeholder:text-foreground/25"
          />

          <textarea
            placeholder="Tell us about yourself and how you'd like to collaborate…"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="bg-transparent border border-foreground/15 text-foreground px-4 py-3.5 text-[12px] tracking-wide outline-none font-body transition-colors focus:border-accent placeholder:text-foreground/25 resize-y"
          />

          <button
            type="submit"
            disabled={submitting || !form.full_name || !form.email || !form.role}
            className="bg-primary text-primary-foreground border-none px-12 py-[17px] font-body text-[11px] tracking-wide-xl uppercase cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 disabled:cursor-default self-start"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default CollabSection;
