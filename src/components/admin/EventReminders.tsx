import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScheduledEmail {
  id: string;
  event_id: string;
  send_at: string;
  subject: string;
  body: string;
  status: string;
}

interface Props {
  eventId: string;
  eventName: string;
  eventDate: string;
}

const DEFAULT_REMINDERS = [
  { label: "7 days before", days: 7, subject: "Reminder: [EVENT] is next week", body: "Just a reminder that [EVENT] is coming up next week. We look forward to seeing you there." },
  { label: "1 day before", days: 1, subject: "Tomorrow: [EVENT] — Here's what you need to know", body: "Tomorrow is the day! [EVENT] is happening and we can't wait to see you. Make sure you arrive on time." },
  { label: "Day of", days: 0, subject: "Today: [EVENT] — We'll see you there", body: "Today is the day! [EVENT] starts soon. See you there." },
];

const EventReminders = ({ eventId, eventName, eventDate }: Props) => {
  const [reminders, setReminders] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [editableReminders, setEditableReminders] = useState(
    DEFAULT_REMINDERS.map((r) => ({
      ...r,
      enabled: true,
      subject: r.subject.replace("[EVENT]", eventName),
      body: r.body.replace(/\[EVENT\]/g, eventName),
    }))
  );

  useEffect(() => {
    fetchReminders();
  }, [eventId]);

  const fetchReminders = async () => {
    const { data } = await supabase
      .from("scheduled_emails" as any)
      .select("*")
      .eq("event_id", eventId)
      .order("send_at", { ascending: true });
    setReminders((data as any) || []);
    setLoading(false);
  };

  const scheduleReminders = async () => {
    // Try to parse event date — this is a text field, so best-effort
    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime())) {
      toast.error("Cannot parse event date for scheduling. Use a standard date format.");
      return;
    }

    const toInsert = editableReminders
      .filter((r) => r.enabled)
      .map((r) => {
        const sendAt = new Date(parsedDate);
        sendAt.setDate(sendAt.getDate() - r.days);
        sendAt.setHours(10, 0, 0, 0); // send at 10am
        return {
          event_id: eventId,
          send_at: sendAt.toISOString(),
          subject: r.subject,
          body: r.body,
          recipient_filter: "registered",
          status: "pending",
        };
      });

    const { error } = await supabase.from("scheduled_emails" as any).insert(toInsert as any);
    if (error) {
      toast.error("Failed to schedule reminders");
    } else {
      toast.success(`${toInsert.length} reminders scheduled`);
      setShowSetup(false);
      fetchReminders();
    }
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("scheduled_emails" as any).delete().eq("id", id);
    toast.success("Reminder deleted");
    fetchReminders();
  };

  const inputCls = "bg-[#0a0a12] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none w-full focus:border-purple-800 transition-colors";

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] tracking-[2px] text-slate-600 uppercase">Reminders</p>
        {reminders.length === 0 && (
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="text-purple-400 text-[11px] bg-transparent border-none cursor-pointer hover:text-purple-300"
          >
            {showSetup ? "Cancel" : "+ Schedule Reminders"}
          </button>
        )}
      </div>

      {showSetup && (
        <div className="bg-[#0a0a12] border border-[#1e1e2e] rounded-xl p-4 mb-3">
          {editableReminders.map((r, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => {
                    const updated = [...editableReminders];
                    updated[i] = { ...r, enabled: e.target.checked };
                    setEditableReminders(updated);
                  }}
                  className="accent-purple-500"
                />
                <span className="text-xs text-slate-300 font-semibold">{r.label}</span>
              </label>
              {r.enabled && (
                <div className="pl-6 flex flex-col gap-2">
                  <input
                    className={inputCls}
                    value={r.subject}
                    onChange={(e) => {
                      const updated = [...editableReminders];
                      updated[i] = { ...r, subject: e.target.value };
                      setEditableReminders(updated);
                    }}
                    placeholder="Subject"
                  />
                  <textarea
                    className={`${inputCls} min-h-[50px] resize-y`}
                    value={r.body}
                    onChange={(e) => {
                      const updated = [...editableReminders];
                      updated[i] = { ...r, body: e.target.value };
                      setEditableReminders(updated);
                    }}
                    placeholder="Message"
                  />
                </div>
              )}
            </div>
          ))}
          <button
            onClick={scheduleReminders}
            className="mt-3 bg-purple-600 text-white border-none px-5 py-2 rounded-lg cursor-pointer text-[12px] font-semibold hover:bg-purple-500 transition-colors"
          >
            Schedule Selected
          </button>
        </div>
      )}

      {reminders.length > 0 && (
        <div className="flex flex-col gap-1">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-[#0a0a12] px-3 py-2 rounded-lg">
              <div>
                <span className="text-[12px] text-slate-300">{r.subject}</span>
                <span className="text-[10px] text-slate-600 ml-2">
                  {new Date(r.send_at).toLocaleDateString()} {new Date(r.send_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  r.status === "sent" ? "bg-emerald-950 text-emerald-400" :
                  r.status === "failed" ? "bg-red-950 text-red-400" :
                  "bg-amber-950 text-amber-400"
                }`}>
                  {r.status}
                </span>
                {r.status === "pending" && (
                  <button
                    onClick={() => deleteReminder(r.id)}
                    className="text-red-400 hover:text-red-300 text-xs bg-transparent border-none cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!showSetup && reminders.length === 0 && !loading && (
        <p className="text-slate-700 text-[11px]">No reminders scheduled</p>
      )}
    </div>
  );
};

export default EventReminders;
