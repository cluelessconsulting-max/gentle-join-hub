import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications((data as any as Notification[]) || []);
    };
    fetch();

    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as any as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications" as any)
      .update({ read: true } as any)
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const typeIcon: Record<string, string> = {
    success: "✓",
    info: "ℹ",
    warning: "⚠",
    error: "✕",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative bg-transparent border border-foreground/15 text-foreground w-10 h-10 flex items-center justify-center cursor-pointer transition-colors hover:bg-foreground/5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-[340px] bg-background border border-foreground/10 shadow-xl max-h-[400px] overflow-y-auto">
            <div className="flex justify-between items-center px-4 py-3 border-b border-foreground/10">
              <span className="text-[10px] tracking-wide-lg uppercase text-warm-grey">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-accent hover:text-foreground bg-transparent border-none cursor-pointer">
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-[12px] text-warm-grey text-center py-8">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-foreground/5 transition-colors ${
                    n.read ? "opacity-60" : "bg-accent/5"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`text-sm mt-0.5 ${n.type === "success" ? "text-accent" : "text-warm-grey"}`}>
                      {typeIcon[n.type] || "•"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground leading-tight">{n.title}</p>
                      <p className="text-[11px] text-warm-grey mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-warm-grey/60 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
