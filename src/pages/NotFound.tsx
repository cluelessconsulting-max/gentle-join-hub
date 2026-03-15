import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <h1 className="font-display text-[22px] font-light tracking-wide-md uppercase text-foreground mb-10">Offlist</h1>
        <p className="text-[120px] font-display font-light text-foreground/10 leading-none mb-2">404</p>
        <p className="text-[16px] text-foreground tracking-wide font-light mb-8">
          This page doesn't exist — but the party does.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <Link
            to="/"
            className="bg-primary text-primary-foreground px-10 py-3.5 text-[11px] tracking-wide-lg uppercase no-underline transition-all hover:bg-accent font-body font-light inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
