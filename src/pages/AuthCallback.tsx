import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: { session } } = await supabase.auth.getSession();
      navigate(session ? "/dashboard" : "/", { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-display text-[42px] font-light text-foreground mb-6">Offlist</h1>
        <div className="w-6 h-6 mx-auto border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
};

export default AuthCallback;
