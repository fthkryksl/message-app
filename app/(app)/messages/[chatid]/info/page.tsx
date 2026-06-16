"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BellOff, Ban, LogIn, LogOut } from "lucide-react";
import { getChats, getMessages, getProfiles, ChatRoom, ChatMessage, UserProfile, joinChat, leaveChat } from "@/lib/api";
import { getToken, getUserHash } from "@/lib/auth";

interface PageProps {
  params: Promise<{ chatid: string }>;
}

export default function ChatInfoPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const chatid = Number(resolvedParams.chatid);
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [currentUserHash, setCurrentUserHash] = useState<string | null>(null);

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const chats = await getChats(token);
        const currentChat = chats.find(c => c.chatid === chatid);
        if (currentChat) setChatRoom(currentChat);

        const userProfiles = await getProfiles(token);
        setProfiles(userProfiles);

        if (currentChat?.joined || currentChat?.visibility === "public") {
          const msgs = await getMessages(token, chatid).catch(() => []);
          setMessages(msgs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, chatid]);

  const handleJoinChat = async () => {
    if (!token) return;
    try {
      await joinChat(token, chatid);
      router.push(`/messages/${chatid}`);
    } catch (err: any) {
      alert(err.message ?? "Beitreten fehlgeschlagen.");
    }
  };

  const handleLeaveChat = async () => {
    if (!token) return;
    const confirm = window.confirm("Möchtest du diesen Chat wirklich verlassen?");
    if (!confirm) return;

    try {
      await leaveChat(token, chatid);
      router.push("/messages");
    } catch (err: any) {
      alert(err.message ?? "Verlassen fehlgeschlagen.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-950 text-white items-center justify-center">
        <p className="text-slate-400 animate-pulse">Lade Infos...</p>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="flex flex-col h-screen bg-slate-950 text-white items-center justify-center p-4">
        <p className="text-red-400 mb-4">Chat nicht gefunden.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-800 rounded-lg">Zurück</button>
      </div>
    );
  }

  const isPublic = chatRoom.visibility === "public";
  
  // Extract unique participants from messages
  const participantHashes = Array.from(new Set(messages.map(m => m.userhash)));
  const participants = participantHashes.map(hash => {
    const profile = profiles.find(p => p.hash === hash);
    return profile ? profile : { hash, nickname: messages.find(m => m.userhash === hash)?.usernick || "Unbekannt", fullname: "" };
  });

  let otherUser: UserProfile | undefined = undefined;
  if (!isPublic) {
    otherUser = participants.find(p => p.hash !== currentUserHash);
    if (!otherUser) {
      otherUser = profiles.find(p => p.nickname === chatRoom.chatname);
    }
  }

  const displayName = isPublic ? chatRoom.chatname : (otherUser?.nickname || chatRoom.chatname);
  const displayFullName = isPublic ? undefined : otherUser?.fullname;

  const getAvatarColor = (name: string) => {
    const colors = ["from-orange-500 to-red-500", "from-blue-500 to-cyan-500", "from-emerald-500 to-teal-500", "from-purple-500 to-pink-500"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white pb-10">
      {/* Header */}
      <header className="p-4 flex items-center z-20">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-800 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors shadow-md"
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* Main Profile Info */}
      <div className="flex flex-col items-center mt-4 px-6">
        <div className={`w-32 h-32 rounded-full mb-4 flex items-center justify-center text-4xl font-bold bg-gradient-to-br ${getAvatarColor(displayName)} shadow-lg shadow-black/50 border-4 border-slate-900`}>
          {displayName.substring(0, 2).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-center">{displayName}</h1>
        <p className="text-sm text-emerald-400 mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Aktiv
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-8 w-full max-w-xs">
          {!isPublic ? (
            <>
              <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl flex flex-col items-center gap-2 transition-colors shadow-sm">
                <BellOff size={20} />
                <span className="text-xs font-medium">Stumm</span>
              </button>
              <button className="flex-1 bg-red-950 hover:bg-red-900 text-red-400 py-3 rounded-xl flex flex-col items-center gap-2 transition-colors shadow-sm border border-red-900/50">
                <Ban size={20} />
                <span className="text-xs font-medium">Blockieren</span>
              </button>
            </>
          ) : (
            <>
              {chatRoom.joined ? (
                <>
                  <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl flex flex-col items-center gap-2 transition-colors shadow-sm">
                    <BellOff size={20} />
                    <span className="text-xs font-medium">Stumm</span>
                  </button>
                  <button onClick={handleLeaveChat} className="flex-1 bg-red-950 hover:bg-red-900 text-red-400 py-3 rounded-xl flex flex-col items-center gap-2 transition-colors shadow-sm border border-red-900/50">
                    <LogOut size={20} />
                    <span className="text-xs font-medium">Verlassen</span>
                  </button>
                </>
              ) : (
                <button onClick={handleJoinChat} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-orange-900/20 transition-all">
                  <LogIn size={20} />
                  Beitreten
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="mt-10 px-6 max-w-md mx-auto w-full">
        <h2 className="text-center font-serif text-2xl italic text-slate-300 mb-6 border-b border-slate-800/60 pb-4">Infos</h2>
        
        <div className="space-y-4 text-sm">
          {!isPublic ? (
            <>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">Nickname:</span>
                <span className="text-slate-200 text-right">{displayName}</span>
              </div>
              {displayFullName && (
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-medium">Voller Name:</span>
                  <span className="text-slate-200 text-right">{displayFullName}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">Typ:</span>
                <span className="text-slate-200 text-right">Öffentliche Gruppe</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">Teilnehmer:</span>
                <span className="text-slate-200 text-right">{participants.length > 0 ? `${participants.length} bekannt` : "Unbekannt"}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Participants List (for public groups) */}
      {isPublic && participants.length > 0 && (
        <div className="mt-10 px-6 max-w-md mx-auto w-full">
          <h2 className="text-center font-serif text-2xl italic text-slate-300 mb-6 border-b border-slate-800/60 pb-4">Teilnehmer</h2>
          
          <div className="space-y-3">
            {participants.map(p => (
              <div key={p.hash} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold bg-gradient-to-br ${getAvatarColor(p.nickname)} text-sm shadow-sm`}>
                  {p.nickname.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{p.nickname}</p>
                  {p.fullname && <p className="text-xs text-slate-500">{p.fullname}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
