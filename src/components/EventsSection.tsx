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

const tags = ["All", "Fashion", "Lifestyle", "Private", "Coming Soon", "London"];

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

const EventsSection = ({ onEventClick }: Props) => {
  const [activeTag, setActiveTag] = useState("All");
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Tag filter
      if (activeTag !== "All") {
        const tagLower = activeTag.toLowerCase();
        const eventFields = `${event.tag} ${event.name} ${event.location} ${event.access}`.toLowerCase();
        if (!eventFields.includes(tagLower)) return false;
      }

      // Search filter
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

      {filteredEvents.length === 0 ? (
        <RevealDiv>
          <div className="text-center py-20">
            <p className="font-display text-2xl font-light text-foreground/30 mb-3">No events found</p>
            <p className="text-[12px] text-warm-grey tracking-wide">Try a different search or filter</p>
          </div>
        </RevealDiv>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {filteredEvents.map((event) => (
            <RevealDiv key={event.name}>
              <div
                onClick={() => onEventClick(event.name, `${event.date} · ${event.location}`)}
                className="bg-background p-10 md:p-12 transition-colors cursor-pointer relative overflow-hidden group hover:bg-[white]"
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
        </div>
      )}

      {/* Social CTA */}
      <RevealDiv>
        <div className="mt-20 md:mt-28 text-center">
          <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-4">Stay Connected</p>
          <h3 className="font-display text-[clamp(24px,2.5vw,36px)] font-light leading-tight mb-3">
            Follow us on socials for first-time updates
          </h3>
          <p className="text-[12px] text-warm-grey tracking-wide mb-8">Be the first to know about new events, drops & exclusive invites.</p>
          <div className="flex justify-center gap-5">
            <a
              href="instagram://user?username=offlist.london"
              onClick={(e) => {
                // Fallback to web if app doesn't open
                setTimeout(() => { window.location.href = "https://instagram.com/offlist.london"; }, 500);
              }}
              className="flex items-center gap-2.5 border border-foreground/15 px-6 py-3 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary group"
            >
              <Instagram size={16} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] tracking-wide-lg uppercase">Instagram</span>
            </a>
            <a
              href="snssdk1233://user/profile/offlist.london"
              onClick={(e) => {
                setTimeout(() => { window.location.href = "https://tiktok.com/@offlist.london"; }, 500);
              }}
              className="flex items-center gap-2.5 border border-foreground/15 px-6 py-3 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary group"
            >
              <TikTokIcon size={16} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] tracking-wide-lg uppercase">TikTok</span>
            </a>
          </div>
        </div>
      </RevealDiv>
    </section>
  );
};

export default EventsSection;