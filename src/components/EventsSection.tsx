import { useState, useEffect, useRef, useMemo } from "react";
import { Instagram } from "lucide-react";

interface Event {
  tag: string;
  name: string;
  date: string;
  location: string;
  access: string;
}

const events: Event[] = [
  { tag: "Party · Soirée", name: "Private Party", date: "27 March 2026", location: "Mayfair, London", access: "Tickets available" },
  { tag: "Private · Fashion", name: "Private Shopping Session", date: "March 2026", location: "Marylebone, London", access: "Invitation only" },
  { tag: "Lifestyle · Morning", name: "Fashion Breakfast", date: "April 2026", location: "Central London", access: "Limited seats" },
  { tag: "Coming Soon · Exclusive", name: "Brand Launch", date: "Spring 2026", location: "London", access: "Members only" },
];

const tags = ["All", "Fashion", "Lifestyle", "Private", "Coming Soon", "London", "Paris", "Milan"];

interface Props {
  onEventClick: (name: string, date: string) => void;
}

const RevealDiv = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-[900ms] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"} ${className || ""}`}>
      {children}
    </div>
  );
};

const TikTokIcon = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const SocialCTA = () => (
  <div className="bg-background p-10 md:p-12 flex flex-col justify-center items-center text-center">
    <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-4">Stay Connected</p>
    <h3 className="font-display text-[22px] font-light leading-tight mb-2">
      Follow us for first-time updates
    </h3>
    <p className="text-[11px] text-warm-grey tracking-wide mb-6 max-w-[220px]">
      New events, drops & exclusive invites.
    </p>
    <div className="flex gap-3">
      <a
        href="instagram://user?username=offlist.london"
        onClick={() => {
          setTimeout(() => { window.location.href = "https://instagram.com/offlist.london"; }, 500);
        }}
        className="flex items-center gap-2 border border-foreground/15 px-4 py-2.5 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary group"
      >
        <Instagram size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
        <span className="text-[9px] tracking-wide-lg uppercase">Instagram</span>
      </a>
      <a
        href="snssdk1233://user/profile/offlist.london"
        onClick={() => {
          setTimeout(() => { window.location.href = "https://tiktok.com/@offlist.london"; }, 500);
        }}
        className="flex items-center gap-2 border border-foreground/15 px-4 py-2.5 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary group"
      >
        <TikTokIcon size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
        <span className="text-[9px] tracking-wide-lg uppercase">TikTok</span>
      </a>
    </div>
  </div>
);

const EventsSection = ({ onEventClick }: Props) => {
  const [activeTag, setActiveTag] = useState("All");
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (activeTag !== "All") {
        const tagLower = activeTag.toLowerCase();
        const eventFields = `${event.tag} ${event.name} ${event.location} ${event.access}`.toLowerCase();
        if (!eventFields.includes(tagLower)) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const searchable = `${event.tag} ${event.name} ${event.date} ${event.location} ${event.access}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [activeTag, search]);

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    if (tag === "All") {
      setSearch("");
    }
  };

  const noResults = filteredEvents.length === 0;

  // Calculate grid: events + social card fills the row
  // On md+ we use 3 columns. Social card always takes the last slot.
  const totalCells = filteredEvents.length + 1; // +1 for social card
  // Pad to fill the 3-col row if needed (on desktop)
  const remainder = totalCells % 3;
  const socialColSpan = remainder === 0 ? 1 : (3 - (filteredEvents.length % 3));

  return (
    <section className="px-6 md:px-12 py-[72px] md:py-[100px] border-t border-border" id="events">
      <RevealDiv>
        <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-3.5">Upcoming</p>
      </RevealDiv>
      <RevealDiv>
        <h2 className="font-display text-[clamp(32px,3vw,48px)] font-light leading-tight mb-12">Explore Events</h2>
      </RevealDiv>

      <div className="flex items-center border-b border-foreground/20 pb-3 mb-10 max-w-[680px]">
        <span className="text-[10px] tracking-wide-lg uppercase text-warm-grey whitespace-nowrap mr-7 shrink-0">Search</span>
        <input
          type="text"
          className="flex-1 border-none outline-none font-display text-2xl font-light text-foreground bg-transparent tracking-wide placeholder:text-foreground/20"
          placeholder="Event, brand, location…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setActiveTag("All"); }}
        />
        {search && (
          <button
            onClick={() => { setSearch(""); setActiveTag("All"); }}
            className="bg-transparent border-none cursor-pointer text-xs text-warm-grey p-1 hover:text-foreground transition-colors mr-2"
          >
            ✕
          </button>
        )}
        <span className="text-lg text-accent p-1">→</span>
      </div>

      <div className="flex gap-2 flex-wrap mb-14">
        {tags.map((tag) => (
          <span
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`text-[10px] tracking-[0.14em] uppercase px-4 py-[7px] border cursor-pointer transition-all ${
              activeTag === tag ? "bg-primary text-primary-foreground border-primary" : "border-foreground/15 text-warm-grey hover:bg-primary hover:text-primary-foreground hover:border-primary"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      {noResults ? (
        /* When no events match, show social CTA as the main content */
        <RevealDiv>
          <div className="border border-border">
            <div className="p-14 md:p-20 text-center">
              <p className="font-display text-2xl font-light text-foreground/30 mb-2">No events yet</p>
              <p className="text-[12px] text-warm-grey tracking-wide mb-10">
                {activeTag !== "All" ? `No ${activeTag} events at the moment.` : "Try a different search or filter."}
              </p>
              <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-4">Stay Connected</p>
              <h3 className="font-display text-[clamp(22px,2vw,32px)] font-light leading-tight mb-2">
                Follow us for first-time updates
              </h3>
              <p className="text-[11px] text-warm-grey tracking-wide mb-7">New events, drops & exclusive invites.</p>
              <div className="flex justify-center gap-4">
                <a
                  href="instagram://user?username=offlist.london"
                  onClick={() => { setTimeout(() => { window.location.href = "https://instagram.com/offlist.london"; }, 500); }}
                  className="flex items-center gap-2 border border-foreground/15 px-5 py-2.5 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary group"
                >
                  <Instagram size={15} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] tracking-wide-lg uppercase">Instagram</span>
                </a>
                <a
                  href="snssdk1233://user/profile/offlist.london"
                  onClick={() => { setTimeout(() => { window.location.href = "https://tiktok.com/@offlist.london"; }, 500); }}
                  className="flex items-center gap-2 border border-foreground/15 px-5 py-2.5 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary group"
                >
                  <TikTokIcon size={15} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] tracking-wide-lg uppercase">TikTok</span>
                </a>
              </div>
            </div>
          </div>
        </RevealDiv>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3">
          {filteredEvents.map((event) => (
            <RevealDiv key={event.name}>
              <div
                onClick={() => onEventClick(event.name, `${event.date} · ${event.location}`)}
                className="bg-background p-10 md:p-12 transition-colors cursor-pointer relative overflow-hidden group hover:bg-foreground/[0.02] border-b border-r border-border"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
                <span className="text-[9px] tracking-wide-lg uppercase text-accent mb-6 block">{event.tag}</span>
                <h3 className="font-display text-[28px] font-light leading-tight mb-5">{event.name}</h3>
                <div className="flex flex-col gap-2 mb-9">
                  {[event.date, event.location, event.access].map((item) => (
                    <span key={item} className="text-[11px] text-warm-grey tracking-wide flex gap-2.5 items-center before:content-['—'] before:text-accent before:text-[9px]">
                      {item}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] tracking-wide-md uppercase text-foreground opacity-35 flex items-center gap-2 transition-all group-hover:opacity-100 group-hover:text-accent after:content-['→']">
                  View Event
                </span>
              </div>
            </RevealDiv>
          ))}
          {/* Social CTA fills remaining grid space */}
          <RevealDiv className={socialColSpan > 1 ? `md:col-span-${socialColSpan}` : ""} style={undefined}>
            <div className={`border-b border-border h-full ${socialColSpan > 1 ? "" : "border-r"}`}>
              <SocialCTA />
            </div>
          </RevealDiv>
        </div>
      )}
    </section>
  );
};

export default EventsSection;