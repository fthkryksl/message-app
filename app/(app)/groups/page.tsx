"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import {
  Plus,
  Search as SearchIcon,
  Users,
  Lock,
  LogOut,
  Check,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import {
  getChats,
  createChat,
  joinChat,
  leaveChat,
  deleteChat,
  ChatRoom,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import BlurText from "@/components/BlurText";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function GroupsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  // States
  const [groups, setGroups] = useState<ChatRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Chat Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newChatIsPublic, setNewChatIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  // Initial Auth
  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  // Fetch groups
  const fetchGroups = async () => {
    if (!token) return;
    try {
      const chats = await getChats(token);
      setGroups(chats);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Fehler beim Laden der Gruppen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchGroups();

    // Auto-poll groups list every 10 seconds
    const interval = setInterval(fetchGroups, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Join Chat
  const handleJoinChat = async (chatid: number) => {
    if (!token) return;
    setLoading(true);
    try {
      await joinChat(token, chatid);
      fetchGroups();
      alert("Erfolgreich beigetreten!");
    } catch (err: any) {
      alert(err.message ?? "Fehler beim Beitritt.");
      setLoading(false);
    }
  };

  // Leave Chat
  const handleLeaveChat = async (chatid: number) => {
    if (!token) return;
    const confirm = window.confirm(
      "Möchtest du diese Gruppe wirklich verlassen?",
    );
    if (!confirm) return;

    setLoading(true);
    try {
      await leaveChat(token, chatid);
      fetchGroups();
    } catch (err: any) {
      alert(err.message ?? "Fehler beim Verlassen der Gruppe.");
      setLoading(false);
    }
  };

  // Delete Chat
  const handleDeleteChat = async (chatid: number) => {
    if (!token) return;
    const confirm = window.confirm(
      "Möchtest du diese Gruppe wirklich unwiderruflich LÖSCHEN?",
    );
    if (!confirm) return;

    setLoading(true);
    try {
      await deleteChat(token, chatid);
      fetchGroups();
    } catch (err: any) {
      alert(err.message ?? "Fehler beim Löschen der Gruppe.");
      setLoading(false);
    }
  };

  // Create Chat
  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newChatName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const chatid = await createChat(
        token,
        newChatName.trim(),
        newChatIsPublic,
      );
      setShowCreateModal(false);
      setNewChatName("");
      setNewChatIsPublic(false);
      // Navigate straight to new group chat
      router.push(`/messages/${chatid}`);
    } catch (err: any) {
      setError(err.message ?? "Fehler beim Erstellen der Gruppe.");
    } finally {
      setCreating(false);
    }
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter((group) =>
    group.chatname.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 z-10 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className={`${instrumentSerif.className} text-2xl font-bold`}>
            <BlurText
              text="Gruppen"
              delay={50}
              animateBy="letters"
              direction="top"
              className="text-orange-500"
            />
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setLoading(true);
                fetchGroups();
              }}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="Aktualisieren"
            >
              <RefreshCw
                size={20}
                className={loading ? "animate-spin text-orange-500" : ""}
              />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors text-white"
              title="Gruppe erstellen"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Gruppen suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2.5 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-transparent focus:border-transparent"
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
          {loading && groups.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="animate-spin text-orange-500" size={20} />
              <p className="text-sm">Gruppen werden geladen...</p>
            </div>
          ) : filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div
                key={group.chatid}
                className="p-4 bg-slate-900 border border-slate-850 hover:border-slate-800 transition-all rounded-2xl flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-base shadow-inner text-white select-none">
                    {group.chatname.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-200 truncate">
                      {group.chatname}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                      {group.visibility === "public" ? (
                        <Users size={12} />
                      ) : (
                        <Lock size={12} />
                      )}
                      {group.visibility === "public" ? "Öffentlich" : "Privat"}{" "}
                      • ID: {group.chatid}
                    </p>
                    {group.joined && (
                      <span className="inline-block mt-1 text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                        Beigetreten
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {group.joined ? (
                    <>
                      <button
                        onClick={() => router.push(`/messages/${group.chatid}`)}
                        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        Öffnen <ArrowRight size={12} />
                      </button>
                      {group.role === "owner" ? (
                        <button
                          onClick={() => handleDeleteChat(group.chatid)}
                          className="p-2 bg-red-950 text-red-400 hover:bg-red-900 hover:text-red-200 rounded-full transition-colors"
                          title="Gruppe Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLeaveChat(group.chatid)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
                          title="Gruppe verlassen"
                        >
                          <LogOut size={14} />
                        </button>
                      )}
                    </>
                  ) : (
                    group.visibility === "public" && (
                      <button
                        onClick={() => handleJoinChat(group.chatid)}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-full text-xs font-semibold transition-colors"
                      >
                        Beitreten
                      </button>
                    )
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-900/60">
              <Users size={32} className="mx-auto text-slate-650 mb-2" />
              <p className="text-sm font-semibold text-slate-400 font-medium">
                Keine Gruppen gefunden
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Erstelle eine neue Gruppe oder trete einer der öffentlichen
                Gruppen in der Liste bei.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Chat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl p-5 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="text-orange-500" size={20} />
              Neue Gruppe erstellen
            </h3>

            <form onSubmit={handleCreateChat} className="space-y-4">
              <div>
                <label
                  htmlFor="groupname"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Gruppenname
                </label>
                <input
                  type="text"
                  id="groupname"
                  placeholder="z.B. Campus Leben"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  required
                  className="w-full bg-slate-950 text-white px-3 py-2.5 border border-slate-800 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-between py-1 border-t border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Öffentliche Gruppe
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Jeder kann dieser Gruppe suchen und beitreten
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newChatIsPublic}
                  onChange={(e) => setNewChatIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-orange-600 rounded bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !newChatName.trim()}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg text-sm transition-colors disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer"
              >
                {creating ? "Erstellt..." : "Gruppe erstellen"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
