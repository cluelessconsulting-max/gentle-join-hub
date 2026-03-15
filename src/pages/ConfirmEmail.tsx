import { useNavigate } from "react-router-dom";

const ConfirmEmail = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <h1 className="font-display text-[42px] font-light text-foreground mb-2">Offlist</h1>
        <div className="h-px w-12 mx-auto bg-accent my-6" />
        <div className="text-[48px] mb-4">✓</div>
        <h2 className="font-display text-[28px] font-light text-foreground mb-3">Email confirmed!</h2>
        <p className="text-[13px] text-warm-grey tracking-wide mb-8">Welcome to OFFLIST. Your email has been verified.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-primary text-primary-foreground px-10 py-3.5 text-[11px] tracking-wide-lg uppercase border-none cursor-pointer transition-all hover:bg-accent font-body font-light"
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
};

export default ConfirmEmail;
