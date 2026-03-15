import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EventReminders from "./EventReminders";

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  tag: string;
  access: string;
  description: string | null;
  capacity: number | null;
}

interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  registered_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
  interests: string[] | null;
}

const AdminEventsManager = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", location: "", tag: "", access: "", description: "", capacity: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [{ data: evts }, { data: regs }, { data: profs }] = await Promise.all([
      supabase.from("events").select("*").order("date", { ascending: false }),
      supabase.from("event_registrations" as any).select("*"),
      supabase.from("profiles").select("user_id, full_name, email, city, interests"),
    ]);
    if (evts) setEvents(evts as any);
    if (regs) setRegistrations(regs as any);
    if (profs) setProfiles(profs as any);
  };

  const saveEvent = async () => {
    const payload = {
      name: form.name,
      date: form.date,
      location: form.location,
      tag: form.tag || "Event",
      access: form.access || "Open",
      description: form.description || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
    };

    if (editingId) {
      const { error } = await supabase.from("events").update(payload as any).eq("id", editingId);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Event updated");
    } else {
      const { error } = await supabase.from("events").insert(payload as any);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Event created");
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", date: "", location: "", tag: "", access: "", description: "", capacity: "" });
    fetchAll();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event deleted");
    fetchAll();
  };

  const editEvent = (evt: Event) => {
    setForm({
      name: evt.name,
      date: evt.date,
      location: evt.location,
      tag: evt.tag,
      access: evt.access,
      description: evt.description || "",
      capacity: evt.capacity?.toString() || "",
    });
    setEditingId(evt.id);
    setShowForm(true);
  };

  const getEventRegs = (eventId: string) => registrations.filter((r) => r.event_id === eventId);
  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  const updateRegStatus = async (regId: string, newStatus: string, userId: string, eventId: string) => {
    const { error } = await supabase
      .from("event_registrations" as any)
      .update({ status: newStatus } as any)
      .eq("id", regId);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Registration ${newStatus}`);

      // Send email via Brevo
      const profile = getProfile(userId);
      const event = events.find(e => e.id === eventId);
      if (profile?.email && event) {
        const firstName = profile.full_name?.split(" ")[0] || "";
        if (newStatus === "confirmed") {
          supabase.functions.invoke("brevo-admin", {
            body: {
              action: "send_email",
              recipients: [{ email: profile.email, name: profile.full_name || "Member" }],
              subject: `You're confirmed for ${event.name}`,
              htmlContent: `<!DOCTYPE html><html><body style="margin:0;padding:40px 20px;background-color:#EDE8E0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0"><tr><td style="padding:0 0 24px;text-align:center;"><span style="font-size:18px;letter-spacing:4px;text-transform:uppercase;color:#0A0A0A;">OFFLIST</span></td></tr><tr><td style="padding:0 0 16px;text-align:center;"><span style="font-size:22px;color:#0A0A0A;">You're on the list, ${firstName}!</span></td></tr><tr><td style="padding:0 0 24px;text-align:center;"><span style="font-size:13px;color:#8B8178;line-height:1.8;">Your registration for <strong>${event.name}</strong> has been confirmed.<br/><br/>📅 ${event.date}<br/>📍 ${event.location}<br/><br/>No tickets are required if you come with Offlist.</span></td></tr><tr><td style="padding:0 0 24px;text-align:center;"><a href="https://off-list.uk/dashboard" style="display:inline-block;background-color:#0A0A0A;color:#EDE8E0;text-decoration:none;padding:14px 36px;font-size:11px;letter-spacing:3px;text-transform:uppercase;">View Dashboard</a></td></tr></table></td></tr></table></body></html>`,
            },
          });
        } else if (newStatus === "rejected") {
          supabase.functions.invoke("brevo-admin", {
            body: {
              action: "send_email",
              recipients: [{ email: profile.email, name: profile.full_name || "Member" }],
              subject: `Registration update for ${event.name}`,
              htmlContent: `<!DOCTYPE html><html><body style="margin:0;padding:40px 20px;background-color:#EDE8E0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0"><tr><td style="padding:0 0 24px;text-align:center;"><span style="font-size:18px;letter-spacing:4px;text-transform:uppercase;color:#0A0A0A;">OFFLIST</span></td></tr><tr><td style="padding:0 0 24px;text-align:center;"><span style="font-size:13px;color:#8B8178;line-height:1.8;">Unfortunately your registration for <strong>${event.name}</strong> was not confirmed this time.<br/><br/>Keep an eye on our upcoming events — we'd love to see you at the next one.</span></td></tr></table></td></tr></table></body></html>`,
            },
          });
        }
      }

      fetchAll();
    }
  };

  const exportCSV = (eventId: string) => {
    const evt = events.find((e) => e.id === eventId);
    const regs = getEventRegs(eventId);
    const header = "Name,Email,City,Interests,Registration Date,Status\n";
    const rows = regs.map((r) => {
      const p = getProfile(r.user_id);
      return [
        `"${p?.full_name || ""}"`,
        `"${p?.email || ""}"`,
        `"${p?.city || ""}"`,
        `"${(p?.interests || []).join("; ")}"`,
        `"${new Date(r.registered_at).toLocaleDateString()}"`,
        `"${r.status}"`,
      ].join(",");
    }).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${evt?.name || "event"}-guestlist.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${regs.length} registrations`);
  };

  const inputCls = "bg-[#0f0f1a] border border-[#1e1e2e] text-slate-200 px-3 py-2 rounded-lg text-[13px] outline-none w-full focus:border-purple-800 transition-colors";

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-2xl font-bold tracking-wider text-slate-50">Events</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: "", date: "", location: "", tag: "", access: "", description: "", capacity: "" }); }}
          className="bg-purple-600 text-white border-none px-5 py-2 rounded-lg cursor-pointer text-[13px] font-semibold hover:bg-purple-500 transition-colors"
        >
          {showForm ? "Cancel" : "+ New Event"}
        </button>
      </div>

      {/* Event Form */}
      {showForm && (
        <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-5 mb-7">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className={inputCls} placeholder="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={inputCls} placeholder="Date (e.g. 27 March 2026)" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input className={inputCls} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input className={inputCls} placeholder="Tag (e.g. Fashion · Private)" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
            <input className={inputCls} placeholder="Access (e.g. Invitation only)" value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value })} />
            <input className={inputCls} type="number" placeholder="Capacity (empty = unlimited)" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <textarea className={`${inputCls} min-h-[60px] resize-y mb-3`} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button
            onClick={saveEvent}
            disabled={!form.name || !form.date || !form.location}
            className="bg-emerald-600 text-white border-none px-5 py-2 rounded-lg cursor-pointer text-[13px] font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-40"
          >
            {editingId ? "Update Event" : "Create Event"}
          </button>
        </div>
      )}

      {/* Events List */}
      <div className="flex flex-col gap-3">
        {events.map((evt) => {
          const regs = getEventRegs(evt.id);
          const confirmed = regs.filter((r) => r.status === "confirmed").length;
          const pending = regs.filter((r) => r.status === "pending").length;
          const waitlist = regs.filter((r) => r.status === "waitlist").length;
          const isSelected = selectedEvent === evt.id;

          return (
            <div key={evt.id} className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl overflow-hidden">
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                onClick={() => setSelectedEvent(isSelected ? null : evt.id)}
              >
                <div>
                  <span className="text-sm text-slate-200 font-semibold">{evt.name}</span>
                  <span className="text-xs text-slate-500 ml-3">{evt.date} · {evt.location}</span>
                </div>
                <div className="flex gap-3 items-center">
                  {pending > 0 && <span className="text-xs text-orange-400 font-semibold">{pending} pending</span>}
                  <span className="text-xs text-emerald-400">{confirmed} confirmed</span>
                  {waitlist > 0 && <span className="text-xs text-amber-400">{waitlist} waitlist</span>}
                  {evt.capacity && <span className="text-xs text-slate-500">/ {evt.capacity} cap</span>}
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/checkin/${evt.id}`); }} className="text-emerald-400 hover:text-emerald-300 text-xs bg-transparent border-none cursor-pointer">◉ Check-in</button>
                  <button onClick={(e) => { e.stopPropagation(); editEvent(evt); }} className="text-purple-400 hover:text-purple-300 text-xs bg-transparent border-none cursor-pointer">✎</button>
                  <button onClick={(e) => { e.stopPropagation(); exportCSV(evt.id); }} className="text-sky-400 hover:text-sky-300 text-xs bg-transparent border-none cursor-pointer">↓ CSV</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteEvent(evt.id); }} className="text-red-400 hover:text-red-300 text-xs bg-transparent border-none cursor-pointer">✕</button>
                </div>
              </div>

              {isSelected && (
                <div className="border-t border-[#1e1e2e] p-4">
                  {regs.length === 0 ? (
                    <p className="text-slate-600 text-[13px]">No registrations yet</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr>
                          {["Name", "Email", "City", "Status", "Date", "Actions"].map((h) => (
                            <th key={h} className="text-left text-[11px] tracking-[2px] text-slate-600 pb-2 font-normal">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {regs.map((r) => {
                          const p = getProfile(r.user_id);
                          return (
                            <tr key={r.id} className="border-t border-[#1a1a2e]">
                              <td className="py-2 text-[13px] text-slate-200">{p?.full_name || "—"}</td>
                              <td className="py-2 text-[13px] text-slate-400">{p?.email || "—"}</td>
                              <td className="py-2 text-[13px] text-slate-400">{p?.city || "—"}</td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  r.status === "confirmed" ? "bg-emerald-950 text-emerald-400" :
                                  r.status === "pending" ? "bg-orange-950 text-orange-400" :
                                  r.status === "rejected" ? "bg-red-950 text-red-400" :
                                  "bg-amber-950 text-amber-400"
                                }`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="py-2 text-[11px] text-slate-500">{new Date(r.registered_at).toLocaleDateString()}</td>
                              <td className="py-2">
                                <div className="flex gap-2">
                                  {r.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() => updateRegStatus(r.id, "confirmed", r.user_id, r.event_id)}
                                        className="text-[10px] bg-emerald-600 text-white border-none px-3 py-1 rounded cursor-pointer hover:bg-emerald-500 transition-colors"
                                      >
                                        ✓ Approve
                                      </button>
                                      <button
                                        onClick={() => updateRegStatus(r.id, "rejected", r.user_id, r.event_id)}
                                        className="text-[10px] bg-red-600 text-white border-none px-3 py-1 rounded cursor-pointer hover:bg-red-500 transition-colors"
                                      >
                                        ✕ Reject
                                      </button>
                                    </>
                                  )}
                                  {r.status === "confirmed" && (
                                    <button
                                      onClick={() => updateRegStatus(r.id, "rejected")}
                                      className="text-[10px] text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer"
                                    >
                                      Revoke
                                    </button>
                                  )}
                                  {r.status === "rejected" && (
                                    <button
                                      onClick={() => updateRegStatus(r.id, "confirmed")}
                                      className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-transparent border-none cursor-pointer"
                                    >
                                      Re-approve
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  <EventReminders eventId={evt.id} eventName={evt.name} eventDate={evt.date} />
                </div>
              )}
            </div>
          );
        })}
        {events.length === 0 && <p className="text-slate-600 text-[13px] text-center py-10">No events yet</p>}
      </div>
    </div>
  );
};

export default AdminEventsManager;
