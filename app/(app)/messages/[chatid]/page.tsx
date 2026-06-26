"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Camera as CameraIcon,
  MapPin,
  Download,
  FileText,
  ExternalLink,
  RefreshCw,
  Trash2,
  CornerUpLeft,
  X,
  DoorOpen,
  UserPlus,
  Compass,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  MessageCircle,
} from "lucide-react";
import {
  getMessages,
  postMessage,
  getChats,
  deleteChat,
  leaveChat,
  inviteUser,
  getProfiles,
  ChatMessage,
  ChatRoom,
  UserProfile,
} from "@/lib/api";
import { getToken, getUserHash } from "@/lib/auth";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => <div className="animate-pulse" />,
});

// Formatiert Zeitstempel vom Serverformat "YYYY-MM-DD_HH-mm-ss" in ein lesbares Format
const formatTimestamp = (timeStr: string): string => {
  try {
    const [datePart, timePart] = timeStr.split("_");
    if (!datePart || !timePart) return timeStr;

    const isoStr = `${datePart.replace(/-/g, "/")} ${timePart.replace(/-/g, ":")}`;
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return timeStr;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const time = `${hours}:${minutes} Uhr`;

    if (isToday) {
      return time;
    } else if (isYesterday) {
      return `Gestern, ${time}`;
    } else {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}, ${time}`;
    }
  } catch (e) {
    return timeStr;
  }
};

// Liefert ein Label wie "Heute", "Gestern", Wochentag oder Datum für die Gruppierung
const getDateLabel = (timeStr: string): string => {
  try {
    const [datePart] = timeStr.split("_");
    if (!datePart) return timeStr;
    const isoStr = datePart.replace(/-/g, "/");
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return datePart;

    const now = new Date();
    const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = dNow.getTime() - dDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Heute";
    } else if (diffDays === 1) {
      return "Gestern";
    } else if (diffDays < 7 && diffDays > 0) {
      return date.toLocaleDateString("de-DE", { weekday: "long" });
    } else {
      return date.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  } catch (e) {
    return timeStr;
  }
};

// Formatiert GPS-Koordinaten in ein lesbares Format
const formatCoordinates = (posStr: string): string => {
  const [latStr, lngStr] = posStr.split(",");
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (isNaN(lat) || isNaN(lng)) return posStr;

  const latDirection = lat >= 0 ? "N" : "S";
  const lngDirection = lng >= 0 ? "O" : "W";

  return `${Math.abs(lat).toFixed(4)}° ${latDirection}, ${Math.abs(lng).toFixed(4)}° ${lngDirection}`;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface PageProps {
  params: Promise<{ chatid: string }>;
}

export default function ChatRoomPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const chatid = Number(resolvedParams.chatid);
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [currentUserHash, setCurrentUserHash] = useState<string | null>(null);

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftText, setDraftText] = useState("");
  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [draftFile, setDraftFile] = useState<{
    name: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [draftLocation, setDraftLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [importantFlag, setImportantFlag] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [gettingLocation, setGettingLocation] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearchTerm, setInviteSearchTerm] = useState("");
  const [largePhotoMsgId, setLargePhotoMsgId] = useState<number | null>(null);

  const [deletedMsgIds, setDeletedMsgIds] = useState<number[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<number | null>(
    null,
  );
  const [hasScrolledInitial, setHasScrolledInitial] = useState(false);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Smart Scrolling States
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const prevMsgCountRef = useRef(0);

  // Camera switch state
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const handleTouchStart = (msgId: number) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setActiveMessageMenuId(msgId);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMessageMenuId(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  useEffect(() => {
    const t = getToken();
    const hash = getUserHash();
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
    setCurrentUserHash(hash);

    try {
      const storedDeleted = localStorage.getItem(`deleted_msgs_${chatid}`);
      if (storedDeleted) {
        setDeletedMsgIds(JSON.parse(storedDeleted));
      }
    } catch (e) {
      // Fehler stillschweigend ignorieren
    }
  }, [chatid, router]);

  useEffect(() => {
    if (!token) return;

    const fetchMetadata = async () => {
      try {
        const chats = await getChats(token);
        const currentChat = chats.find((c) => c.chatid === chatid);
        if (currentChat) {
          setChatRoom(currentChat);
        }

        const userProfiles = await getProfiles(token);
        setProfiles(userProfiles);
      } catch (err: any) {
        // console.error entfernt, damit das Next.js Error-Overlay bei kurzen Verbindungsabbrüchen nicht auftaucht
      }
    };

    fetchMetadata();
  }, [token, chatid]);

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const msgs = await getMessages(token, chatid);
      setMessages(msgs);
      // "Zuletzt gelesen" für diesen Chat aktualisieren
      localStorage.setItem(`lastRead_${chatid}`, new Date().toISOString());
      setError(null);
    } catch (err: any) {
      setError("Verbindungsproblem. Nachrichten können veraltet sein.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchMessages();

    // Set up polling interval every 5 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [token, chatid]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    
    const atBottom = distanceFromBottom < 50;
    setIsAtBottom(atBottom);
    setShowScrollDownButton(distanceFromBottom > 150);
    
    if (atBottom) {
      setHasUnread(false);
    }
  };

  useEffect(() => {
    if (!loading && messages.length > 0 && !hasScrolledInitial) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      setHasScrolledInitial(true);
    }
  }, [loading, messages, hasScrolledInitial]);

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        setHasUnread(true);
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, isAtBottom]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;
    if (!draftText && !draftPhoto && !draftFile && !draftLocation) return;

    setSending(true);
    setError(null);

    try {
      let finalAddressText = draftText;

      if (replyingTo) {
        const snippet = replyingTo.text
          ? replyingTo.text.startsWith("[FILE:")
            ? "[Datei-Anhang]"
            : replyingTo.text.length > 40
              ? replyingTo.text.substring(0, 40) + "..."
              : replyingTo.text
          : replyingTo.photoid
            ? "[Bild]"
            : replyingTo.position
              ? "[Standort]"
              : "[Anhang]";
        finalAddressText = `» ${replyingTo.usernick}: ${snippet}\n\n${finalAddressText}`;
      }

      if (draftFile) {
        finalAddressText = `[FILE:${draftFile.name}|${draftFile.type}]${draftFile.dataUrl}`;
      }

      const params: any = {
        chatid,
        important: importantFlag,
      };

      if (finalAddressText) params.text = finalAddressText;
      if (draftPhoto) params.photo = draftPhoto;
      if (draftLocation) {
        params.position = `${draftLocation.lat},${draftLocation.lng}`;
      }

      await postMessage(token, params);

      setDraftText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setDraftPhoto(null);
      setDraftFile(null);
      setDraftLocation(null);
      setReplyingTo(null);
      setImportantFlag(false);

      await fetchMessages();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err: any) {
      setError(err.message ?? "Fehler beim Versenden der Nachricht.");
    } finally {
      setSending(false);
    }
  };

  const startCamera = async () => {
    setError(null);
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: facingMode },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError(
        "Kamera konnte nicht gestartet werden. Bitte Berechtigungen prüfen.",
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setCameraActive(false);
  };

  // Toggle Camera
  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  useEffect(() => {
    if (cameraActive) {
      stopCamera();
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setDraftPhoto(dataUrl);
      }
      stopCamera();
    }
  };

  const retrieveLocation = () => {
    if (!navigator.geolocation) {
      setError("GPS Ortung wird von diesem Browser nicht unterstützt.");
      return;
    }
    setGettingLocation(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraftLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGettingLocation(false);
      },
      (err) => {
        console.error(err);
        setError("Standort konnte nicht ausgelesen werden. GPS aktiviert?");
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      setError("Die Datei ist zu groß. Maximale Dateigröße ist 2.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 640;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/png");
            setDraftPhoto(dataUrl);
          }
        };
        img.src = result;
      } else if (
        file.type.startsWith("video/") ||
        file.type === "application/pdf"
      ) {
        setDraftFile({
          name: file.name,
          type: file.type,
          dataUrl: result,
        });
      } else {
        setError(
          "Nicht unterstütztes Dateiformat. Bitte Bilder, Videos oder PDFs wählen.",
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLeaveChat = async () => {
    if (!token) return;
    const confirm = window.confirm(
      "Möchtest du diese Gruppe wirklich verlassen?",
    );
    if (!confirm) return;

    try {
      await leaveChat(token, chatid);
      router.push("/messages");
    } catch (err: any) {
      setError(err.message ?? "Verlassen fehlgeschlagen.");
    }
  };

  const handleDeleteChat = async () => {
    if (!token) return;
    const confirm = window.confirm(
      "Möchtest du diese Gruppe permanent LÖSCHEN?",
    );
    if (!confirm) return;

    try {
      await deleteChat(token, chatid);
      router.push("/messages");
    } catch (err: any) {
      setError(err.message ?? "Löschen fehlgeschlagen.");
    }
  };

  const handleInviteUser = async (hash: string) => {
    if (!token) return;
    try {
      await inviteUser(token, chatid, hash);
      alert("Einladung erfolgreich verschickt!");
      setShowInviteModal(false);
    } catch (err: any) {
      alert(err.message ?? "Einladung fehlgeschlagen.");
    }
  };

  const handleDeleteMessageLocally = (id: number) => {
    const updated = [...deletedMsgIds, id];
    setDeletedMsgIds(updated);
    try {
      localStorage.setItem(`deleted_msgs_${chatid}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const isOwnMessage = (msg: ChatMessage) => {
    if (currentUserHash && msg.userhash === currentUserHash) return true;
    return false;
  };

  const renderQuotedReply = (text: string) => {
    const match = text.match(/^» ([^:]+): ([^\n]+)\n\n([\s\S]*)$/);
    if (!match) return { isReply: false, rawText: text };
    return {
      isReply: true,
      senderNick: match[1],
      snippet: match[2],
      cleanText: match[3],
    };
  };

  const parseAttachedFile = (text: string) => {
    const match = text.match(/^\[FILE:([^|]+)\|([^\]]+)\](data:[\s\S]+)$/);
    if (!match) return null;
    return {
      name: match[1],
      type: match[2],
      dataUrl: match[3],
    };
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 underline hover:text-orange-300 break-all inline-flex items-center gap-0.5"
          >
            {part} <ExternalLink size={12} />
          </a>
        );
      }
      return part;
    });
  };

  const filteredInvitableUsers = profiles.filter(
    (p) =>
      p.nickname.toLowerCase().includes(inviteSearchTerm.toLowerCase()) &&
      p.hash !== currentUserHash,
  );

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white relative">
      <header className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 z-20 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/messages")}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            aria-label="Zurück"
          >
            <ArrowLeft size={20} />
          </button>
          <div
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push(`/messages/${chatid}/info`)}
          >
            <h2 className="font-semibold text-lg max-w-[180px] sm:max-w-xs truncate">
              {chatRoom ? chatRoom.chatname : `Chat #${chatid}`}
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              {chatRoom?.visibility === "public"
                ? "Öffentliche Gruppe"
                : "Private Unterhaltung"}
              {chatRoom?.role && (
                <span className="bg-slate-800 text-orange-500 font-semibold px-1.5 py-0.5 rounded text-[10px] uppercase">
                  {chatRoom.role === "owner" ? "Besitzer" : chatRoom.role}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors font-medium text-sm"
          >
            Optionen
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setShowInviteModal(true);
                  setShowOptions(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-2"
              >
                <UserPlus size={16} /> Nutzer einladen
              </button>

              {chatRoom?.role === "owner" ? (
                <button
                  onClick={() => {
                    handleDeleteChat();
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-950 hover:text-red-300 rounded-lg flex items-center gap-2"
                >
                  <Trash2 size={16} /> Gruppe löschen
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleLeaveChat();
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-orange-400 hover:bg-slate-800 hover:text-orange-300 rounded-lg flex items-center gap-2"
                >
                  <DoorOpen size={16} /> Gruppe verlassen
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="bg-red-950 border-b border-red-900 text-red-300 px-4 py-2 text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertCircle size={14} />
            {error}
          </span>
          <button
            onClick={fetchMessages}
            className="p-1 hover:bg-red-900 rounded text-red-200 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* ── Message Area ── */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-slate-950 pb-24 relative"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <RefreshCw className="animate-spin text-orange-500" size={24} />
            <p className="text-sm">Nachrichten werden geladen...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center max-w-sm mx-auto my-auto mt-20 bg-slate-900/40 rounded-3xl border border-slate-800/50 shadow-inner">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="text-slate-600" size={32} />
            </div>
            <p className="font-semibold text-slate-300">Keine Nachrichten</p>
            <p className="text-xs text-slate-500 mt-2 max-w-[220px] leading-relaxed">
              Sei der Erste und starte die Unterhaltung mit einer Nachricht!
            </p>
          </div>
        ) : (
          (() => {
            let lastDateLabel = "";
            return messages
              .filter((msg) => !deletedMsgIds.includes(msg.id))
              .map((msg) => {
                const isOwn = isOwnMessage(msg);
                const textContent = msg.text || "";
                const replyInfo = renderQuotedReply(textContent);
                const fileAttachment = parseAttachedFile(
                  (replyInfo.isReply ? replyInfo.cleanText : textContent) || "",
                );

                const dateLabel = getDateLabel(msg.time);
                const showDateSeparator = dateLabel !== lastDateLabel;
                lastDateLabel = dateLabel;

                return (
                  <React.Fragment key={msg.id}>
                    {showDateSeparator && (
                      <div className="sticky top-2 z-10 flex justify-center my-2 w-full select-none pointer-events-none">
                        <span className="bg-slate-850/95 text-zinc-400 dark:text-zinc-300 text-xs font-semibold px-4 py-1.5 rounded-full shadow-md backdrop-blur-md border border-zinc-200/50 dark:border-slate-700/50 pointer-events-auto">
                          {dateLabel}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex flex-col ${isOwn ? "items-end" : "items-start"} group relative`}
                      onTouchStart={() => handleTouchStart(msg.id)}
                      onTouchEnd={handleTouchEnd}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMessageMenuId(msg.id);
                      }}
                    >
                      {!isOwn && (
                        <span className="text-xs text-slate-400 mb-1 ml-2 font-medium">
                          {msg.usernick}
                        </span>
                      )}

                      <div className="max-w-[85%] sm:max-w-md relative">
                        <div
                          className={`rounded-2xl p-3.5 shadow-sm text-sm relative transition-all ${
                            msg.important
                              ? "ring-2 ring-red-500 border border-red-500"
                              : ""
                          } ${
                            isOwn
                              ? "bg-gradient-to-tr from-orange-600 to-orange-500 text-white rounded-tr-none"
                              : "bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800"
                          }`}
                        >
                          {replyInfo.isReply && (
                            <div className="bg-black/20 border-l-2 border-orange-400 pl-2 py-1 mb-2 rounded-r text-xs text-slate-200">
                              <p className="font-semibold text-[10px] text-orange-300">
                                Quittiert @{replyInfo.senderNick}
                              </p>
                              <p className="truncate italic">
                                {replyInfo.snippet}
                              </p>
                            </div>
                          )}

                          {msg.photoid && (
                            <div
                              className="mb-2 rounded-lg overflow-hidden border border-black/10 bg-slate-950 cursor-pointer group/photo relative max-w-full"
                              onClick={() => setLargePhotoMsgId(msg.id)}
                            >
                              <img
                                src={`${BASE_URL}?request=getphoto&token=${token}&photoid=${msg.photoid}`}
                                alt="Gesendetes Bild"
                                className="max-h-60 w-full object-cover group-hover/photo:scale-102 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity text-xs font-medium pointer-events-none">
                                Bild vergrößern
                              </div>
                            </div>
                          )}

                          {fileAttachment && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-2">
                              {fileAttachment.type.startsWith("video/") ? (
                                <video
                                  src={fileAttachment.dataUrl}
                                  controls
                                  playsInline
                                  className="max-h-60 w-full rounded-md object-contain bg-black"
                                />
                              ) : (
                                <div className="flex items-center justify-between gap-3 p-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText
                                      className="text-orange-400 shrink-0"
                                      size={24}
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold truncate text-slate-200">
                                        {fileAttachment.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        PDF Dokument
                                      </p>
                                    </div>
                                  </div>
                                  <a
                                    href={fileAttachment.dataUrl}
                                    download={fileAttachment.name}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors"
                                    aria-label="PDF herunterladen"
                                  >
                                    <Download size={16} />
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {msg.position && (
                            <a
                              href={`https://maps.apple.com/?q=${msg.position}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mb-2 rounded-lg p-2 flex flex-col gap-2 min-w-[220px] sm:min-w-[280px] hover:border-slate-900/50 transition-colors cursor-pointer group/map block"
                            >
                              <div className="flex items-center justify-between gap-4 p-0.5">
                                <div className="flex items-center gap-2">
                                  <MapPin
                                    className="animate-pulse shrink-0"
                                    size={20}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-200">
                                      Standort geteilt
                                    </p>
                                    <p className="text-[10px] text-slate-300 truncate max-w-[120px] sm:max-w-xs">
                                      {formatCoordinates(msg.position)}
                                    </p>
                                  </div>
                                </div>
                                <ExternalLink
                                  size={12}
                                  className="text-slate-300 group-hover/map:text-white transition-colors"
                                />
                              </div>
                              <div className="pointer-events-none">
                                <LeafletMap position={msg.position} />
                              </div>
                            </a>
                          )}

                          {(!fileAttachment ||
                            (
                              (replyInfo.isReply
                                ? replyInfo.cleanText
                                : textContent) || ""
                            ).trim().length > 0) && (
                            <p className="break-words whitespace-pre-wrap leading-relaxed">
                              {renderTextWithLinks(
                                fileAttachment
                                  ? ""
                                  : (replyInfo.isReply
                                      ? replyInfo.cleanText
                                      : textContent) || "",
                              )}
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                            {msg.important && (
                              <span className="text-[9px] font-bold tracking-wide uppercase mr-1">
                                Dringend
                              </span>
                            )}
                            <span>{formatTimestamp(msg.time)}</span>
                          </div>
                        </div>

                        <div
                          className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-all duration-200 z-10 bg-slate-950/95 rounded-full py-1 px-2 border border-slate-800 shadow-md ${
                            isOwn
                              ? "right-full -translate-x-2"
                              : "left-full translate-x-2"
                          } ${
                            activeMessageMenuId === msg.id
                              ? "opacity-100 scale-105 pointer-events-auto"
                              : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setReplyingTo(msg);
                              setActiveMessageMenuId(null);
                            }}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-orange-400 rounded-full transition-colors cursor-pointer"
                            title="Antworten"
                            type="button"
                          >
                            <CornerUpLeft size={14} />
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteMessageLocally(msg.id);
                              setActiveMessageMenuId(null);
                            }}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-full transition-colors cursor-pointer"
                            title="Löschen"
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
          })()
        )}
        
        {hasUnread && (
          <div className="sticky bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10 animate-in slide-in-from-bottom-5">
            <button
              onClick={() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                setHasUnread(false);
              }}
              className="pointer-events-auto bg-orange-600/95 backdrop-blur text-white shadow-lg shadow-orange-900/20 border border-orange-500 rounded-full px-4 py-1.5 text-xs font-bold animate-bounce flex items-center gap-2 transition-transform active:scale-95"
            >
              Neue Nachrichten ↓
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollDownButton && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-24 right-4 z-20 bg-orange-600 hover:bg-orange-500 text-white rounded-full py-2 px-3.5 shadow-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 animate-in fade-in duration-200"
          type="button"
        >
          <ArrowDown size={14} /> Nach unten
        </button>
      )}

      {(replyingTo || draftPhoto || draftFile || draftLocation) && (
        <div className="absolute bottom-20 left-4 right-4 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl z-10 space-y-2 flex flex-col">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
            <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
              Entwurf / Vorschau
            </h4>
            <button
              onClick={() => {
                setReplyingTo(null);
                setDraftPhoto(null);
                setDraftFile(null);
                setDraftLocation(null);
              }}
              className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {replyingTo && (
            <div className="bg-slate-950 p-2 rounded-lg border-l-2 border-orange-500 flex items-center justify-between text-xs text-slate-300">
              <div>
                <span className="font-semibold text-orange-400">
                  Antwort an {replyingTo.usernick}:
                </span>
                <p className="truncate italic max-w-xs">
                  {replyingTo.text || "[Datei/Bild]"}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                Entfernen
              </button>
            </div>
          )}

          {draftPhoto && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-800 self-start">
              <img
                src={draftPhoto}
                alt="Kamera Vorschau"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setDraftPhoto(null)}
                className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-black/90 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {draftFile && (
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="text-orange-500" size={18} />
                <span className="truncate max-w-xs text-slate-300 font-medium">
                  {draftFile.name}
                </span>
              </div>
              <button
                onClick={() => setDraftFile(null)}
                className="text-slate-500 hover:text-slate-300 text-xs font-semibold"
              >
                Entfernen
              </button>
            </div>
          )}

          {draftLocation && (
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Compass className="text-orange-500 shrink-0" size={18} />
                <span className="text-slate-300">
                  GPS Koordinaten: {draftLocation.lat.toFixed(5)},{" "}
                  {draftLocation.lng.toFixed(5)}
                </span>
              </div>
              <button
                onClick={() => setDraftLocation(null)}
                className="text-slate-500 hover:text-slate-300 text-xs font-semibold"
              >
                Entfernen
              </button>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-3 z-10">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center gap-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,application/pdf"
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={`p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer ${
                showAttachmentMenu
                  ? "rotate-45 text-orange-500 bg-slate-850"
                  : ""
              }`}
              title="Anhänge"
            >
              <Plus size={20} />
            </button>

            {showAttachmentMenu && (
              <div className="absolute bottom-14 left-0 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl flex flex-col gap-2 z-20 min-w-[150px] animate-in slide-in-from-bottom-5 fade-in duration-200">
                <button
                  type="button"
                  onClick={() => {
                    triggerFilePicker();
                    setShowAttachmentMenu(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer w-full text-left"
                >
                  <Paperclip size={16} className="text-orange-500" />
                  <span>Datei / Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    startCamera();
                    setShowAttachmentMenu(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer w-full text-left"
                >
                  <CameraIcon size={16} className="text-orange-500" />
                  <span>Kamera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    retrieveLocation();
                    setShowAttachmentMenu(false);
                  }}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer w-full text-left disabled:opacity-50"
                >
                  <MapPin
                    size={16}
                    className={`text-orange-500 ${gettingLocation ? "animate-spin" : ""}`}
                  />
                  <span>Standort</span>
                </button>
              </div>
            )}
          </div>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            placeholder={draftFile ? "Datei angehängt. Klicke Senden..." : "Nachricht schreiben..."}
            value={draftText}
            onChange={(e) => {
              setDraftText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending || !!draftFile}
            rows={1}
            className="flex-1 bg-slate-950 text-white border border-slate-800 px-4 py-2.5 rounded-3xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-0 resize-none overflow-y-auto"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />

          <button
            type="button"
            onClick={() => setImportantFlag(!importantFlag)}
            className={`p-2 rounded-full border text-xs font-semibold px-2.5 transition-colors shrink-0 ${
              importantFlag
                ? "bg-red-950 text-red-400 border-red-500"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
            title="Dringend markieren"
          >
            Dringend
          </button>

          <button
            type="submit"
            disabled={
              sending ||
              (!draftText && !draftPhoto && !draftFile && !draftLocation)
            }
            className="p-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-full transition-colors disabled:bg-slate-800 disabled:text-slate-600 cursor-pointer shrink-0"
            title="Senden"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {cameraActive && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-between p-4">
          <div className="w-full flex justify-between items-center text-sm font-semibold text-slate-400">
            <span>Kamera Aufnahme</span>
            <button
              onClick={stopCamera}
              className="p-2 hover:bg-slate-900 rounded-full text-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="w-full max-w-lg aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>

          <div className="flex gap-8 mb-6 items-center">
            <button
              onClick={toggleCamera}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors shadow-lg"
              aria-label="Kamera wechseln"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={takePhoto}
              className="w-16 h-16 bg-white hover:bg-slate-100 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-lg transition-transform active:scale-95"
              aria-label="Foto aufnehmen"
            >
              <div className="w-10 h-10 bg-orange-600 rounded-full"></div>
            </button>
            <div className="w-[44px]"></div> {/* Spacer for center alignment */}
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
              <UserPlus className="text-orange-500" size={20} />
              Nutzer einladen
            </h3>

            <input
              type="text"
              placeholder="Nach Nickname filtern..."
              value={inviteSearchTerm}
              onChange={(e) => setInviteSearchTerm(e.target.value)}
              className="w-full bg-slate-950 text-white px-3 py-2 border border-slate-800 rounded-lg text-sm placeholder-slate-400 focus:outline-none mb-3"
            />

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800">
              {filteredInvitableUsers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Keine passenden Nutzer gefunden.
                </p>
              ) : (
                filteredInvitableUsers.map((user) => (
                  <div
                    key={user.hash}
                    className="py-2.5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        @{user.nickname}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                        {user.hash}
                      </p>
                    </div>
                    <button
                      onClick={() => handleInviteUser(user.hash)}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded-full font-medium transition-colors"
                    >
                      Einladen
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {largePhotoMsgId !== null &&
        (() => {
          const photoMessages = messages.filter(
            (m) => m.photoid && !deletedMsgIds.includes(m.id),
          );
          const currentIndex = photoMessages.findIndex(
            (m) => m.id === largePhotoMsgId,
          );
          const currentMsg = photoMessages[currentIndex];
          if (!currentMsg) return null;

          const largePhotoUrlVal = `${BASE_URL}?request=getphoto&token=${token}&photoid=${currentMsg.photoid}`;

          const handlePrevPhoto = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (currentIndex > 0) {
              setLargePhotoMsgId(photoMessages[currentIndex - 1].id);
            }
          };

          const handleNextPhoto = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (currentIndex < photoMessages.length - 1) {
              setLargePhotoMsgId(photoMessages[currentIndex + 1].id);
            }
          };

          return (
            <div
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-zoom-out select-none"
              onClick={() => setLargePhotoMsgId(null)}
            >
              {/* Close Button */}
              <button
                onClick={() => setLargePhotoMsgId(null)}
                className="absolute top-4 right-4 p-2.5 bg-slate-900/80 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
                title="Schließen"
              >
                <X size={20} />
              </button>

              {/* Left Control Chevron */}
              {currentIndex > 0 && (
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-4 p-3 bg-slate-900/80 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer z-10 hover:scale-105 active:scale-95"
                  title="Vorheriges Bild"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              {/* Maximized Image */}
              <img
                src={largePhotoUrlVal}
                alt="Maximiertes Bild"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Right Control Chevron */}
              {currentIndex < photoMessages.length - 1 && (
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-4 p-3 bg-slate-900/80 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer z-10 hover:scale-105 active:scale-95"
                  title="Nächstes Bild"
                >
                  <ChevronRight size={28} />
                </button>
              )}

              {/* Image Counter Indicator */}
              <div className="absolute bottom-6 bg-slate-900/80 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-full border border-slate-850 shadow-lg">
                Bild {currentIndex + 1} von {photoMessages.length}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
