import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const inputClass =
    "w-full bg-transparent border-none text-foreground font-body text-[15px] font-light py-2.5 outline-none transition-colors tracking-wide focus:border-accent placeholder:text-foreground/20";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    const { error: err } = await updatePassword(password);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <span className="font-display text-[18px] tracking-[0.24em] uppercase text-foreground">
            OFFLIST
          </span>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-4">
              Done
            </p>
            <h2 className="font-display text-[28px] font-light leading-tight mb-4">
              Password updated.
            </h2>
            <p className="text-[13px] text-muted-foreground tracking-wide">
              Redirecting to dashboard…
            </p>
          </div>
        ) : (
          <>
            <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-4 text-center">
              Reset Password
            </p>
            <h2 className="font-display text-[28px] font-light leading-tight mb-8 text-center">
              Set your new password.
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                  New Password
                </label>
                <input
                  className={inputClass}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ borderBottom: "1px solid hsl(var(--input))" }}
                />
              </div>
              <div className="mb-6">
                <label className="block text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  className={inputClass}
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={{ borderBottom: "1px solid hsl(var(--input))" }}
                />
              </div>

              {error && (
                <p className="text-[11px] text-destructive tracking-wide mb-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground border-none py-[18px] font-body text-[11px] tracking-widest uppercase cursor-pointer mt-3 transition-all hover:bg-accent hover:-translate-y-0.5 disabled:bg-muted disabled:translate-y-0 disabled:cursor-default"
              >
                {loading ? "Updating…" : "Update Password →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
