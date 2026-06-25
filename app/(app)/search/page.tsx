"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import {
  Search as SearchIcon,
  RefreshCw,
  AlertCircle,
  MessageSquarePlus,
  ArrowRight,
} from "lucide-react";
import {
  getProfiles,
  getChats,
  createChat,
  inviteUser,
  joinChat,
  UserProfile,
  ChatRoom,
} from "@/lib/api";
import { getToken, getUserHash } from "@/lib/auth";
import BlurText from "@/components/BlurText";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

type FilterType = "all" | "persons" | "groups";

export default function SearchPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentUserHash, setCurrentUserHash] = useState<string | null>(null);

  // States
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<ChatRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
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

  // Fetch Data
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [allProfiles, allChats] = await Promise.all([
        getProfiles(token),
        getChats(token),
      ]);
      setProfiles(allProfiles);

      // We only consider public chats as "Gruppen" for the Empfohlene Gruppen section
      const publicGroups = allChats.filter(
        (chat) => chat.visibility === "public",
      );
      setGroups(publicGroups);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  // Actions
  const handleStartChat = async (user: UserProfile) => {
    if (!token) return;
    setActionLoadingId(`user-${user.hash}`);
    setError(null);

    try {
      const chatname = `Chat mit ${user.nickname}`;
      const chatid = await createChat(token, chatname, false);
      await inviteUser(token, chatid, user.hash);
      router.push(`/messages/${chatid}`);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ?? `Kanalerstellung mit ${user.nickname} fehlgeschlagen.`,
      );
      setActionLoadingId(null);
    }
  };

  const handleJoinGroup = async (group: ChatRoom) => {
    if (!token) return;
    if (group.joined) {
      router.push(`/messages/${group.chatid}`);
      return;
    }

    setActionLoadingId(`group-${group.chatid}`);
    setError(null);

    try {
      await joinChat(token, group.chatid);
      router.push(`/messages/${group.chatid}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? `Beitritt zu ${group.chatname} fehlgeschlagen.`);
      setActionLoadingId(null);
    }
  };

  // Filtering
  const filteredProfiles = profiles.filter((profile) => {
    if (activeFilter === "groups") return false;
    const isSelf = profile.hash === currentUserHash;
    const matchesSearch = profile.nickname
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return !isSelf && matchesSearch;
  });

  const filteredGroups = groups.filter((group) => {
    if (activeFilter === "persons") return false;
    const matchesSearch = group.chatname
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const showPersons = activeFilter === "all" || activeFilter === "persons";
  const showGroups = activeFilter === "all" || activeFilter === "groups";

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col min-h-screen">
      {/* Header Area */}
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
            onClick={fetchData}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="Aktualisieren"
          >
            <RefreshCw
              size={20}
              className={loading ? "animate-spin text-orange-500" : ""}
            />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Personen oder Gruppen suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2.5 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-transparent focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === "all"
                ? "bg-orange-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setActiveFilter("persons")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === "persons"
                ? "bg-orange-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            Personen
          </button>
          <button
            onClick={() => setActiveFilter("groups")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === "groups"
                ? "bg-orange-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            Gruppen
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-900 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-orange-500" size={24} />
            <p className="text-sm font-medium">Daten werden geladen...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Empfohlene Gruppen */}
            {showGroups && (filteredGroups.length > 0 || searchTerm) && (
              <section>
                <h2
                  className={`${instrumentSerif.className} text-xl text-slate-200 mb-3 px-1`}
                >
                  Empfohlene Gruppen
                </h2>
                <div className="space-y-2">
                  {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                      <div
                        key={group.chatid}
                        onClick={() => {
                          if (actionLoadingId === null) handleJoinGroup(group);
                        }}
                        className={`p-4 bg-slate-900 border border-slate-850 hover:border-slate-800 transition-all rounded-2xl flex items-center justify-between gap-4 shadow-sm cursor-pointer ${actionLoadingId !== null ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-base shadow-inner text-white select-none shrink-0">
                            {group.chatname.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-200 truncate">
                              {group.chatname}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 truncate font-medium">
                              ID: {group.chatid}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {actionLoadingId === `group-${group.chatid}` ? (
                            <RefreshCw
                              size={16}
                              className="animate-spin text-orange-500"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                              <ArrowRight size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 px-1">
                      Keine passenden Gruppen gefunden.
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Personen die kennen könntest */}
            {showPersons && (filteredProfiles.length > 0 || searchTerm) && (
              <section>
                <h2
                  className={`${instrumentSerif.className} text-xl text-slate-200 mb-3 px-1`}
                >
                  Personen die kennen könntest
                </h2>
                <div className="space-y-2">
                  {filteredProfiles.length > 0 ? (
                    filteredProfiles.map((user) => (
                      <div
                        key={user.hash}
                        onClick={() => {
                          if (actionLoadingId === null) handleStartChat(user);
                        }}
                        className={`p-4 bg-slate-900 border border-slate-850 hover:border-slate-800 transition-all rounded-2xl flex items-center justify-between gap-4 shadow-sm cursor-pointer ${actionLoadingId !== null ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center font-bold text-base shadow-inner text-white select-none shrink-0">
                            {user.nickname.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-200 truncate">
                              @{user.nickname}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5 truncate font-medium">
                              Hash: {user.hash}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {actionLoadingId === `user-${user.hash}` ? (
                            <RefreshCw
                              size={16}
                              className="animate-spin text-orange-500"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                              <MessageSquarePlus size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 px-1">
                      Keine passenden Personen gefunden.
                    </p>
                  )}
                </div>
              </section>
            )}

            {!loading &&
              filteredGroups.length === 0 &&
              filteredProfiles.length === 0 && (
                <div className="p-12 text-center text-slate-500 mt-10 bg-slate-900/40 rounded-3xl border border-slate-900/60">
                  <SearchIcon
                    size={32}
                    className="mx-auto text-slate-650 mb-2"
                  />
                  <p className="text-sm font-semibold text-slate-400">
                    Keine Ergebnisse gefunden
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Versuche es mit einem anderen Suchbegriff.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
