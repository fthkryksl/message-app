"use client";

import { useState, useEffect } from "react";
import { Instrument_Serif } from "next/font/google";
import { Plus, Search as SearchIcon } from "lucide-react";
import BlurText from "@/components/BlurText";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - später durch API ersetzen
  useEffect(() => {
    setMessages([
      { id: 1, name: "Oguzhan Karayüksel", lastMessage: "Hey, wie geht's?", timestamp: "15:21", avatar: "OK" },
      { id: 2, name: "Simon Müller", lastMessage: "Bis später!", timestamp: "Gestern", avatar: "SM", online: true },
      { id: 3, name: "Enrico Marya", lastMessage: "Das klingt gut", timestamp: "00:01", avatar: "EM" },
    ]);
  }, []);

  const filteredMessages = messages.filter(msg =>
    msg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 z-10">
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
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <Plus size={24} className="text-orange-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Suche nach Personen, Nachrichten..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="divide-y divide-slate-700">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="p-4 hover:bg-slate-800 transition-colors cursor-pointer active:bg-slate-700"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-semibold text-sm">
                    {msg.avatar}
                  </div>
                  {msg.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className="font-semibold truncate">{msg.name}</h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-300 truncate">{msg.lastMessage}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400">
            <p>Keine Nachrichten gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
}
