"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { Search as SearchIcon, Users, User, MessageSquarePlus, RefreshCw, AlertCircle } from "lucide-react";
import { getProfiles, createChat, inviteUser, UserProfile } from "@/lib/api";
import { getToken, getUserHash } from "@/lib/auth";
import BlurText from "@/components/BlurText";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function SearchPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentUserHash, setCurrentUserHash] = useState<string | null>(null);

  // States
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Auth
  useEffect(() => {
    const t = getToken();
    const hash = getUserHash();
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
    setCurrentUserHash(hash);
  }, [router]);

  // Fetch Profiles
  const fetchProfiles = async () => {
    if (!token) return;
    try {
      const allProfiles = await getProfiles(token);
      setProfiles(allProfiles);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Nutzerprofile konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchProfiles();
  }, [token]);

  // Start direct chat with user
  const handleStartChat = async (user: UserProfile) => {
    if (!token) return;
    setStartingChatId(user.hash);
    setError(null);

    try {
      // 1. Create a private chat room
      const chatname = `Chat mit ${user.nickname}`;
      const chatid = await createChat(token, chatname, false);

      // 2. Invite the user
      await inviteUser(token, chatid, user.hash);

      // 3. Direct route to the chat page
      router.push(`/messages/${chatid}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? `Kanalerstellung mit ${user.nickname} fehlgeschlagen.`);
      setStartingChatId(null);
    }
  };

  // Filter out self, then match search term
  const filteredProfiles = profiles.filter(profile => {
    const isSelf = profile.hash === currentUserHash;
    const matchesSearch = profile.nickname.toLowerCase().includes(searchTerm.toLowerCase());
    return !isSelf && matchesSearch;
  });

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 z-10 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className={`${instrumentSerif.className} text-2xl font-bold`}>
            <BlurText
              text="Suche"
              delay={50}
              animateBy="letters"
              direction="top"
              className="text-orange-500"
            />
          </h1>
          <button
            onClick={() => {
              setLoading(true);
              fetchProfiles();
            }}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="Nutzerliste aktualisieren"
          >
            <RefreshCw size={20} className={loading ? "animate-spin text-orange-500" : ""} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Nach Nickname suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2.5 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-transparent focus:border-transparent"
            autoFocus
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-900 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="animate-spin text-orange-500" size={20} />
              <p className="text-sm">Nutzer werden geladen...</p>
            </div>
          ) : filteredProfiles.length > 0 ? (
            filteredProfiles.map((user) => (
              <div
                key={user.hash}
                className="p-4 bg-slate-900 border border-slate-850 hover:border-slate-800 transition-all rounded-2xl flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center font-bold text-base shadow-inner text-white select-none">
                    {user.nickname.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-200 truncate">@{user.nickname}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate font-medium">
                      Hash: {user.hash}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartChat(user)}
                  disabled={startingChatId !== null}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:bg-slate-800 disabled:text-slate-500 shrink-0 cursor-pointer"
                >
                  {startingChatId === user.hash ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <MessageSquarePlus size={12} />
                  )}
                  Chat
                </button>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-900/60">
              <User size={32} className="mx-auto text-slate-650 mb-2" />
              <p className="text-sm font-semibold text-slate-400">Keine Nutzer gefunden</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {searchTerm ? "Versuche es mit einem anderen Suchbegriff." : "Lade die Nutzerliste neu oder registriere weitere Test-User."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
