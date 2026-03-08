interface HeroProps {
  onRegister: () => void;
  onSignIn: () => void;
}

const Hero = ({ onRegister, onSignIn }: HeroProps) => {
  return (
    <section className="min-h-screen grid grid-cols-1 md:grid-cols-2 relative overflow-hidden">
      <div className="flex flex-col justify-center px-6 md:px-12 pt-28 md:pt-36 pb-20">
        <h1
          className="font-display text-[clamp(60px,7vw,104px)] font-light leading-[0.93] tracking-tight mb-14 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.5s" }}
        >
          Private
          <br />
          <em className="italic text-accent">Events</em>
          <br />
          Network.
        </h1>
        <div className="flex gap-5 items-center opacity-0 animate-fade-up" style={{ animationDelay: "0.7s" }}>
          <button
            onClick={onRegister}
            className="bg-primary text-primary-foreground border-none px-12 py-[18px] font-body text-[11px] tracking-wide-xl uppercase cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5"
          >
            Register
          </button>
          <button
            onClick={onSignIn}
            className="text-[10px] tracking-wide-md uppercase text-foreground opacity-45 hover:opacity-100 transition-opacity cursor-pointer border-none bg-transparent font-body font-light flex items-center gap-1.5 after:content-['→']"
          >
            Sign In
          </button>
        </div>
      </div>
      <div className="hidden md:block relative overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2420] via-[#3a322b] to-[#2a2218]" />
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center px-12">
          <p className="font-display text-[26px] font-light italic text-primary-foreground leading-relaxed opacity-80 text-center">
            Access to curated private events.
          </p>
        </div>

        {/* Scrolling cities ticker at bottom */}
        <div className="absolute bottom-12 left-0 right-0 overflow-hidden">
          <div className="flex whitespace-nowrap animate-[ticker_12s_linear_infinite]">
            {[...Array(3)].map((_, i) => (
              <span key={i} className="font-display text-[13px] font-light tracking-[0.3em] uppercase mx-0" style={{ color: "rgba(245,240,232,0.25)" }}>
                London&nbsp;&nbsp;·&nbsp;&nbsp;Paris&nbsp;&nbsp;·&nbsp;&nbsp;Milan&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;London&nbsp;&nbsp;·&nbsp;&nbsp;Paris&nbsp;&nbsp;·&nbsp;&nbsp;Milan&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
