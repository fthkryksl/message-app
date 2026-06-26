"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { LogOut, UserX, Loader2, Edit2, Check, X } from "lucide-react";
import { logout, deregister, getProfiles, UserProfile } from "@/lib/api";
import { getToken, getUserHash } from "@/lib/auth";
import BlurText from "@/components/ReactBits/BlurText";
import ShinyText from "@/components/ReactBits/ShinyText";
import DecryptedText from "@/components/ReactBits/DecryptedText";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function ProfilePage() {
  const router = useRouter();

  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingDeregister, setLoadingDeregister] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editFullname, setEditFullname] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      const hash = getUserHash();
      if (!token || !hash) {
        router.push("/login");
        return;
      }

      try {
        const profiles = await getProfiles(token);
        const myProfile = profiles.find((p) => p.hash === hash);
        if (myProfile) {
          const localOverride = localStorage.getItem(`profile_override_${hash}`);
          if (localOverride) {
            const parsed = JSON.parse(localOverride);
            const overriddenProfile = { ...myProfile, ...parsed };
            setProfile(overriddenProfile);
            setEditNickname(overriddenProfile.nickname);
            setEditFullname(overriddenProfile.fullname || "");
          } else {
            setProfile(myProfile);
            setEditNickname(myProfile.nickname);
            setEditFullname(myProfile.fullname || "");
          }
        }
      } catch (err) {
        // console.error entfernt, damit das Next.js Error-Overlay bei kurzen Verbindungsabbrüchen nicht auftaucht
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSaveProfile = () => {
    const hash = getUserHash();
    if (!hash || !profile) return;
    const updated = {
      ...profile,
      nickname: editNickname.trim() || profile.nickname,
      fullname: editFullname.trim(),
    };
    setProfile(updated);
    localStorage.setItem(
      `profile_override_${hash}`,
      JSON.stringify({
        nickname: editNickname.trim() || profile.nickname,
        fullname: editFullname.trim(),
      })
    );
    setIsEditing(false);
  };

  const handleLogout = async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setError(null);
    setLoadingLogout(true);
    try {
      await logout(token);
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Abmelden fehlgeschlagen.");
    } finally {
      setLoadingLogout(false);
    }
  };

  const handleDeregister = async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    const confirmed = globalThis.confirm(
      "Bist du sicher, dass du dein Konto permanent löschen möchtest? Das kann nicht rückgängig gemacht werden.",
    );
    if (!confirmed) return;

    setError(null);
    setLoadingDeregister(true);
    try {
      await deregister(token);
      router.push("/login");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Konto löschen fehlgeschlagen.",
      );
    } finally {
      setLoadingDeregister(false);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "from-orange-500 to-red-500",
      "from-blue-500 to-cyan-500",
      "from-emerald-500 to-teal-500",
      "from-purple-500 to-pink-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const displayName = profile?.nickname || "Laden...";

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col">
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 z-10 shrink-0">
        <h1 className={`${instrumentSerif.className} text-2xl font-bold`}>
          <BlurText
            text="Profil"
            delay={50}
            animateBy="letters"
            direction="top"
            className="text-orange-500"
          />
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center p-8 border-b border-slate-700">
           {!loadingProfile && profile ? (
            isEditing ? (
              <div className="w-full max-w-sm flex flex-col items-center gap-4">
                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold bg-gradient-to-br ${getAvatarColor(editNickname || profile.nickname)} shadow-lg shadow-black/50 border-4 border-slate-900`}
                >
                  {(editNickname || profile.nickname).substring(0, 2).toUpperCase()}
                </div>
                <div className="w-full space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nickname</label>
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      placeholder="Nickname"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Voller Name</label>
                    <input
                      type="text"
                      value={editFullname}
                      onChange={(e) => setEditFullname(e.target.value)}
                      placeholder="Max Mustermann"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2 w-full justify-center">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Check size={14} /> Speichern
                  </button>
                  <button
                    onClick={() => {
                      setEditNickname(profile.nickname);
                      setEditFullname(profile.fullname || "");
                      setIsEditing(false);
                    }}
                    className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <X size={14} /> Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`w-28 h-28 rounded-full mb-4 flex items-center justify-center text-4xl font-bold bg-gradient-to-br ${getAvatarColor(profile.nickname)} shadow-lg shadow-black/50 border-4 border-slate-900`}
                >
                  {profile.nickname.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  {profile.nickname}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Profil bearbeiten"
                  >
                    <Edit2 size={16} />
                  </button>
                </h2>
                {profile.fullname && (
                  <p className="text-slate-400 mt-1">{profile.fullname}</p>
                )}
                <div className="mt-4 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Hash:</span>
                  <span className="text-sm font-mono text-orange-400">
                    {profile.hash}
                  </span>
                </div>
              </>
            )
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-slate-800 animate-pulse mb-4"></div>
              <div className="w-32 h-6 bg-slate-800 animate-pulse rounded"></div>
            </div>
          )}
        </div>

        <div className="p-4 mt-4">
          {error && (
            <p className="text-red-500 text-sm text-center px-2 mb-6 bg-red-950 p-3 rounded-lg">
              <DecryptedText
                text={error}
                speed={200}
                maxIterations={8}
                animateOn="view"
              />
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              disabled={loadingLogout || loadingDeregister}
              className={`w-full pl-6 pr-5 py-3 rounded-lg flex items-center justify-between text-base transition-colors font-medium ${
                loadingLogout || loadingDeregister
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-slate-800 text-slate-100 hover:bg-slate-700 cursor-pointer active:bg-slate-600"
              }`}
            >
              <LogOut size={18} />
              <span>
                {loadingLogout ? (
                  <ShinyText
                    text="Abmelden..."
                    disabled={false}
                    speed={2}
                    className="text-slate-400"
                    shineColor="#ffffff"
                  />
                ) : (
                  "Abmelden"
                )}
              </span>
              {loadingLogout ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <div className="w-6"></div>
              )}
            </button>

            <button
              onClick={handleDeregister}
              disabled={loadingLogout || loadingDeregister}
              className={`w-full pl-6 pr-5 py-3 rounded-lg flex items-center justify-between text-base transition-colors font-medium ${
                loadingLogout || loadingDeregister
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-red-950 text-red-400 border border-red-800 hover:bg-red-900 cursor-pointer active:bg-red-800"
              }`}
            >
              <UserX size={18} />
              <span>
                {loadingDeregister ? (
                  <ShinyText
                    text="Konto wird gelöscht..."
                    disabled={false}
                    speed={2}
                    className="text-red-300"
                    shineColor="#ffffff"
                  />
                ) : (
                  "Konto löschen"
                )}
              </span>
              {loadingDeregister ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <div className="w-6"></div>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center mt-6">
            v1.0.0 • Talks © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
