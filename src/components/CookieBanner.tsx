import { useState, useEffect } from "react";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  const handle = (choice: string) => {
    localStorage.setItem("cookie-consent", choice);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-primary text-primary-foreground px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-[12px] font-light tracking-wide text-center sm:text-left">
        We use cookies to improve your experience. By continuing, you agree to our{" "}
        <a href="/privacy" target="_blank" className="underline text-accent">Privacy Policy</a>.
      </p>
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={() => handle("declined")}
          className="text-[11px] tracking-wide uppercase text-primary-foreground/60 hover:text-primary-foreground transition-colors bg-transparent border-none cursor-pointer font-body"
        >
          Decline
        </button>
        <button
          onClick={() => handle("accepted")}
          className="text-[11px] tracking-wide-lg uppercase bg-primary-foreground text-primary px-6 py-2 cursor-pointer border-none font-body font-light transition-all hover:bg-accent hover:text-accent-foreground"
        >
          Accept
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
