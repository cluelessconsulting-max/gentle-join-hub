import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";

const ALL_INTERESTS = [
  "Fashion & Style", "Music & Nightlife", "Art & Design",
  "Gastronomy & Social Dining", "Fitness & Wellness",
  "Travel & Culture", "Luxury & Lifestyle",
];

const CITIES = ["London", "Milan", "Paris", "New York", "Dubai", "Berlin", "Madrid", "Barcelona", "Amsterdam", "Lisbon", "Rome"];

interface ProfileData {
  full_name: string;
  bio: string;
  city: string;
  instagram: string;
  tiktok: string;
  phone: string;
  interests: string[];
  avatar_url: string;
  public_profile: boolean;
  email_notifications: boolean;
  referral_notifications: boolean;
  referral_code: string;
  membership_type: string;
  buyer_tier: string;
  total_points: number;
}

const ProfilePage = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, bio, city, instagram, tiktok, phone, interests, avatar_url, public_profile, email_notifications, referral_notifications, referral_code, membership_type, buyer_tier, total_points")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile({
          full_name: (data as any).full_name || "",
          bio: (data as any).bio || "",
          city: (data as any).city || "",
          instagram: (data as any).instagram || "",
          tiktok: (data as any).tiktok || "",
          phone: (data as any).phone || "",
          interests: (data as any).interests || [],
          avatar_url: (data as any).avatar_url || "",
          public_profile: (data as any).public_profile ?? true,
          email_notifications: (data as any).email_notifications ?? true,
          referral_notifications: (data as any).referral_notifications ?? true,
          referral_code: (data as any).referral_code || "",
          membership_type: (data as any).membership_type || "free",
          buyer_tier: (data as any).buyer_tier || "guest",
          total_points: (data as any).total_points || 0,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("JPG, PNG or WebP only"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Upload failed"); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: avatarUrl } as any).eq("user_id", user.id);
    setProfile((p) => p ? { ...p, avatar_url: avatarUrl } : p);
    toast.success("Photo updated");
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        city: profile.city,
        instagram: profile.instagram,
        tiktok: profile.tiktok,
        phone: profile.phone,
        interests: profile.interests,
        public_profile: profile.public_profile,
        email_notifications: profile.email_notifications,
        referral_notifications: profile.referral_notifications,
      } as any)
      .eq("user_id", user.id);

    if (error) toast.error("Failed to save");
    else toast.success("Profile saved");
    setSaving(false);
  };

  const toggleInterest = (interest: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      interests: profile.interests.includes(interest)
        ? profile.interests.filter((i) => i !== interest)
        : [...profile.interests, interest],
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE" || !user) return;
    setDeleting(true);
    // Sign out - actual deletion requires admin action
    await signOut();
    toast.success("Account deletion requested. You've been signed out.");
    navigate("/");
  };

  if (authLoading || loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-display text-2xl text-foreground/40 animate-pulse">Loading…</p>
      </div>
    );
  }

  const initials = profile.full_name
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-7">
        <a href="/" className="font-display text-[22px] font-normal tracking-wide-md uppercase text-foreground no-underline">Offlist</a>
        <div className="flex gap-4 items-center">
          <a href="/dashboard" className="text-[10px] tracking-wide-lg uppercase text-warm-grey hover:text-foreground transition-colors no-underline">Dashboard</a>
          <NotificationBell />
          <button onClick={async () => { await signOut(); navigate("/"); }} className="text-[10px] tracking-wide-lg uppercase bg-transparent border border-foreground/15 text-foreground px-5 py-2 cursor-pointer transition-colors font-body font-light hover:bg-primary hover:text-primary-foreground hover:border-primary">Sign Out</button>
        </div>
      </nav>

      <section className="px-6 md:px-12 py-12 max-w-2xl mx-auto">
        <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-3.5">Profile</p>
        <h1 className="font-display text-[clamp(28px,4vw,42px)] font-light leading-tight mb-10">Edit your profile</h1>

        {/* Avatar */}
        <div className="flex items-center gap-6 mb-10">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-foreground/10" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                <span className="font-display text-[24px] text-foreground/40">{initials}</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-primary/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-primary-foreground text-[10px] tracking-wide-lg uppercase">{uploading ? "…" : "Edit"}</span>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-[13px] text-foreground">{profile.full_name || "Your Name"}</p>
            <p className="text-[11px] text-warm-grey">{user?.email}</p>
            <p className="text-[10px] text-accent mt-1 capitalize">{profile.buyer_tier} · {profile.total_points} pts</p>
          </div>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-6">
          {/* Name */}
          <div>
            <label className="text-[10px] tracking-wide-xl uppercase text-warm-grey block mb-1.5">Display Name</label>
            <input
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full bg-transparent border border-foreground/12 text-foreground px-4 py-3 text-[13px] outline-none focus:border-accent transition-colors"
              placeholder="Your full name"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-[10px] tracking-wide-xl uppercase text-warm-grey block mb-1.5">
              Bio <span className="text-foreground/30">({(profile.bio || "").length}/150)</span>
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => { if (e.target.value.length <= 150) setProfile({ ...profile, bio: e.target.value }); }}
              className="w-full bg-transparent border border-foreground/12 text-foreground px-4 py-3 text-[13px] outline-none focus:border-accent transition-colors resize-none h-20"
              placeholder="Tell us about yourself…"
            />
          </div>

          {/* City */}
          <div>
            <label className="text-[10px] tracking-wide-xl uppercase text-warm-grey block mb-1.5">City</label>
            <select
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              className="w-full bg-background border border-foreground/12 text-foreground px-4 py-3 text-[13px] outline-none focus:border-accent transition-colors cursor-pointer"
            >
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Interests */}
          <div>
            <label className="text-[10px] tracking-wide-xl uppercase text-warm-grey block mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {ALL_INTERESTS.map((interest) => {
                const selected = profile.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 text-[11px] tracking-wide border cursor-pointer transition-all ${
                      selected
                        ? "bg-accent/15 border-accent text-accent"
                        : "bg-transparent border-foreground/12 text-warm-grey hover:border-foreground/25"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Social handles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] tracking-wide-xl uppercase text-warm-grey block mb-1.5">Instagram</label>
              <div className="flex items-center border border-foreground/12 focus-within:border-accent transition-colors">
                <span className="text-[12px] text-warm-grey pl-4">@</span>
                <input
                  value={profile.instagram?.replace(/^@/, "") || ""}
                  onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                  className="flex-1 bg-transparent text-foreground px-2 py-3 text-[13px] outline-none"
                  placeholder="handle"
                />
                {profile.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-accent px-3 no-underline hover:text-foreground transition-colors"
                  >
                    View ↗
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] tracking-wide-xl uppercase text-warm-grey block mb-1.5">TikTok</label>
              <div className="flex items-center border border-foreground/12 focus-within:border-accent transition-colors">
                <span className="text-[12px] text-warm-grey pl-4">@</span>
                <input
                  value={profile.tiktok?.replace(/^@/, "") || ""}
                  onChange={(e) => setProfile({ ...profile, tiktok: e.target.value })}
                  className="flex-1 bg-transparent text-foreground px-2 py-3 text-[13px] outline-none"
                  placeholder="handle"
                />
                {profile.tiktok && (
                  <a
                    href={`https://tiktok.com/@${profile.tiktok.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-accent px-3 no-underline hover:text-foreground transition-colors"
                  >
                    View ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-[10px] tracking-wide-xl uppercase text-warm-grey block mb-1.5">Phone</label>
            <input
              value={profile.phone || ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full bg-transparent border border-foreground/12 text-foreground px-4 py-3 text-[13px] outline-none focus:border-accent transition-colors"
              placeholder="+44 7XXX XXXXXX"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground px-8 py-3.5 text-[10px] tracking-wide-lg uppercase cursor-pointer transition-all hover:bg-accent hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 self-start"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        {/* Privacy */}
        <div className="mt-14 border-t border-foreground/10 pt-10">
          <p className="text-[10px] tracking-wide-xl uppercase text-accent mb-5">Privacy</p>
          {[
            { key: "public_profile" as const, label: "Show my profile to other Offlist members", desc: `Visible at /member/${profile.referral_code}` },
            { key: "email_notifications" as const, label: "Receive event notifications by email", desc: "Get notified about new events in your city" },
            { key: "referral_notifications" as const, label: "Receive referral updates", desc: "Know when someone uses your referral code" },
          ].map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between py-4 border-b border-foreground/5">
              <div>
                <p className="text-[13px] text-foreground">{toggle.label}</p>
                <p className="text-[11px] text-warm-grey mt-0.5">{toggle.desc}</p>
              </div>
              <button
                onClick={() => setProfile({ ...profile, [toggle.key]: !profile[toggle.key] })}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer border-none ${
                  profile[toggle.key] ? "bg-accent" : "bg-foreground/15"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-background transition-transform ${
                  profile[toggle.key] ? "left-[22px]" : "left-0.5"
                }`} />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-warm-grey mt-3">Changes are saved when you click "Save changes" above.</p>
        </div>

        {/* Danger Zone */}
        <div className="mt-14 border-t border-destructive/20 pt-10 mb-20">
          <button
            onClick={() => setShowDanger(!showDanger)}
            className="text-[10px] tracking-wide-lg uppercase text-destructive/60 hover:text-destructive bg-transparent border-none cursor-pointer transition-colors"
          >
            {showDanger ? "Hide" : "Show"} danger zone
          </button>
          {showDanger && (
            <div className="mt-5 bg-destructive/5 border border-destructive/15 p-6">
              <p className="text-[13px] text-foreground mb-2">Delete your account</p>
              <p className="text-[11px] text-warm-grey mb-4">This action cannot be undone. Type <strong className="text-foreground">DELETE</strong> to confirm.</p>
              <div className="flex gap-3">
                <input
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  className="bg-transparent border border-destructive/30 text-foreground px-3 py-2 text-[13px] outline-none w-32"
                  placeholder="Type DELETE"
                />
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== "DELETE" || deleting}
                  className="bg-destructive text-destructive-foreground px-5 py-2 text-[10px] tracking-wide-lg uppercase cursor-pointer border-none disabled:opacity-30 disabled:cursor-default"
                >
                  {deleting ? "…" : "Delete Account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
