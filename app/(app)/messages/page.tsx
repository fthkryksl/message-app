"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import {
  Plus,
  Search as SearchIcon,
  MessageCircle,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  X,
  Check,
  Users,
  Lock,
  LogOut,
} from "lucide-react";
import {
  getChats,
  createChat,
  getInvites,
  joinChat,
  leaveChat,
  ChatRoom,
  Invite,
  getMessages,
} from "@/lib/api";
import { getToken, getUserHash } from "@/lib/auth";
import BlurText from "@/components/BlurText";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function MessagesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  // States
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserHash, setCurrentUserHash] = useState<string | null>(null);
  const [contactNames, setContactNames] = useState<Record<number, string>>({});

  // Create Chat Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newChatIsPublic, setNewChatIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  // Initialize
  useEffect(() => {
    const t = getToken();
    const hash = getUserHash();
    if (!t || !hash) {
      router.push("/login");
      return;
    }
    setToken(t);
    setCurrentUserHash(hash);
  }, [router]);

  // Fetch Data
  const fetchData = async () => {
    if (!token) return;
    try {
      const chatRooms = await getChats(token);
      const joinedChats = chatRooms.filter((c) => c.joined);
      setChats(joinedChats);

      const pendingInvites = await getInvites(token);
      setInvites(pendingInvites);
      setError(null);

      // Lazily fetch contact names for private chats
      joinedChats.forEach((chat) => {
        if (chat.visibility === "private") {
          // Check if we already have a name (either actual or fallback)
          setContactNames((prev) => {
            if (prev[chat.chatid]) return prev;

            // If not, fetch it.
            getMessages(token, chat.chatid)
              .then((msgs) => {
                const otherUserMsg = msgs.find(
                  (m) => m.userhash !== currentUserHash,
                );
                setContactNames((current) => ({
                  ...current,
                  [chat.chatid]: otherUserMsg
                    ? otherUserMsg.usernick
                    : chat.chatname,
                }));
              })
              .catch(() => {
                // On error (e.g. 403), set a fallback so we don't spam requests
                setContactNames((current) => ({
                  ...current,
                  [chat.chatid]: chat.chatname,
                }));
              });

            // Return unchanged for now, the promise will update it later
            return prev;
          });
        }
      });
    } catch (err: any) {
      // Wir verzichten hier auf console.error, damit der Next.js Error-Overlay nicht bei jedem Polling-Fehler aufploppt
      setError("Daten konnten nicht aktualisiert werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();

    // Auto-poll overview lists every 8 seconds
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [token]);

  // Join Invite Handler
  const handleAcceptInvite = async (chatid: number) => {
    if (!token) return;
    try {
      await joinChat(token, chatid);
      fetchData();
      alert("Einladung angenommen!");
    } catch (err: any) {
      alert(err.message ?? "Fehler beim Annehmen der Einladung.");
    }
  };

  // Decline Invite Handler
  const handleDeclineInvite = async (chatid: number) => {
    if (!token) return;
    const confirm = window.confirm(
      "Möchtest du diese Einladung wirklich ablehnen?",
    );
    if (!confirm) return;
    try {
      await leaveChat(token, chatid);
      fetchData();
    } catch (err: any) {
      alert(err.message ?? "Fehler beim Ablehnen der Einladung.");
    }
  };

  // Create Chat Submit
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
      // Navigate straight to the new chat
      router.push(`/messages/${chatid}`);
    } catch (err: any) {
      setError(err.message ?? "Fehler beim Erstellen des Chats.");
    } finally {
      setCreating(false);
    }
  };

  // Filtered chats list
  const filteredChats = chats.filter((chat) =>
    chat.chatname.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 z-10 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className={`${instrumentSerif.className} text-2xl font-bold`}>
            <BlurText
              text="Nachrichten"
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
                fetchData();
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
              title="Chat erstellen"
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
            placeholder="Meine Chats durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2.5 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-transparent focus:border-transparent"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-900 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Pending Invites Banner */}
        {invites.length > 0 && (
          <div className="bg-slate-900 border border-orange-500/30 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-orange-500 flex items-center gap-1.5">
              <Users size={16} /> Einladungen ({invites.length})
            </h3>
            <div className="divide-y divide-slate-800">
              {invites.map((invite) => (
                <div
                  key={invite.chatid}
                  className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {invite.chatname}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Gruppe #{invite.chatid}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAcceptInvite(invite.chatid)}
                      className="p-1.5 bg-orange-600 hover:bg-orange-500 rounded-full text-white transition-colors"
                      title="Annehmen"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(invite.chatid)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                      title="Ablehnen"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chats List */}
        <div className="space-y-2">
          {loading ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="animate-spin text-orange-500" size={20} />
              <p className="text-sm">Chats werden geladen...</p>
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const isPublic = chat.visibility === "public";
              const displayLarge = isPublic
                ? chat.chatname
                : contactNames[chat.chatid] || chat.chatname;
              const displaySmall = isPublic
                ? `Gruppe • ID: ${chat.chatid}`
                : `${chat.chatname} • ID: ${chat.chatid}`;

              return (
                <div
                  key={chat.chatid}
                  onClick={() => router.push(`/messages/${chat.chatid}`)}
                  className="p-4 bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer rounded-2xl active:bg-slate-750 flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-orange-500 flex items-center justify-center font-bold text-base shadow-inner text-white select-none">
                      {displayLarge.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-200 truncate">
                        {displayLarge}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        {isPublic ? (
                          <Users size={12} className="shrink-0" />
                        ) : (
                          <Lock size={12} className="shrink-0" />
                        )}
                        {displaySmall}
                      </p>
                    </div>
                  </div>
                  <div className="text-orange-500 hover:text-orange-400 p-2 shrink-0">
                    <MessageSquare size={18} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-900/60">
              <MessageCircle
                size={32}
                className="mx-auto text-slate-600 mb-2"
              />
              <p className="text-sm font-semibold text-slate-400">
                Keine Chats aktiv
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Erstelle einen neuen Chat über das Plus-Symbol oben oder suche
                öffentliche Gruppen unter "Gruppen".
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
              Neuen Chat starten
            </h3>

            <form onSubmit={handleCreateChat} className="space-y-4">
              <div>
                <label
                  htmlFor="chatname"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Chatname
                </label>
                <input
                  type="text"
                  id="chatname"
                  placeholder="z.B. Lerngruppe Mobile UX"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  required
                  className="w-full bg-slate-950 text-white px-3 py-2.5 border border-slate-800 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-between py-1 border-t border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Öffentlicher Chat
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Jeder kann diesen Chat suchen und beitreten
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
                {creating ? "Erstellt..." : "Chat erstellen"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
