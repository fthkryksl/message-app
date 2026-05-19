"use client";

import { useState } from "react";
import { Instrument_Serif } from "next/font/google";
import { Search as SearchIcon, Users } from "lucide-react";
import BlurText from "@/components/BlurText";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

const suggestedGroups = [
  { id: 1, name: "Mobile UX Design", members: 245, avatar: "MUD" },
  { id: 2, name: "Algorithmen und Datenstruktur", members: 128, avatar: "AND" },
  { id: 3, name: "Die bessere Lerngruppe in Eslingen", members: 89, avatar: "DBL" },
  { id: 4, name: "CampusLeben", members: 456, avatar: "CL" },
];

const suggestedPeople = [
  { id: 1, name: "Simon Hummel", avatar: "SH", mutual: 5 },
  { id: 2, name: "Diana Schäfer", avatar: "DS", mutual: 3 },
  { id: 3, name: "Max Mustermann", avatar: "MM", mutual: 7 },
];

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      setHasSearched(true);
      // Mock search results - später durch API ersetzen
      setSearchResults([
        { id: 1, name: "Mobile UX Design", type: "group", members: 245 },
        { id: 2, name: "Simon Hummel", type: "person" },
      ].filter(item =>
        item.name.toLowerCase().includes(term.toLowerCase())
      ));
    } else {
      setHasSearched(false);
      setSearchResults([]);
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 z-10">
        <h1 className={`${instrumentSerif.className} text-2xl font-bold mb-4`}>
          <BlurText
            text="Suche"
            delay={50}
            animateBy="letters"
            direction="top"
            className="text-orange-500"
          />
        </h1>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Personen oder Gruppen suchen..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            autoFocus
          />
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto">
        {hasSearched ? (
          // Search Results
          <div className="divide-y divide-slate-700">
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="p-4 hover:bg-slate-800 transition-colors cursor-pointer active:bg-slate-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-semibold text-sm">
                      {result.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{result.name}</h3>
                      {result.type === "group" && (
                        <p className="text-xs text-slate-400">{result.members} Mitglieder</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <p>Keine Ergebnisse gefunden</p>
              </div>
            )}
          </div>
        ) : (
          // Suggestions
          <div className="p-4">
            {/* Suggested Groups */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                <Users size={18} className="text-orange-500" />
                Empfohlene Gruppen
              </h2>
              <div className="space-y-2">
                {suggestedGroups.map((group) => (
                  <div
                    key={group.id}
                    className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer active:bg-slate-600"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-semibold text-xs">
                        {group.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{group.name}</h3>
                        <p className="text-xs text-slate-400">{group.members} Mitglieder</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested People */}
            <div>
              <h2 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                <Users size={18} className="text-orange-500" />
                Empfohlene Personen
              </h2>
              <div className="space-y-2">
                {suggestedPeople.map((person) => (
                  <div
                    key={person.id}
                    className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer active:bg-slate-600"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center font-semibold text-xs">
                        {person.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{person.name}</h3>
                        <p className="text-xs text-slate-400">{person.mutual} gemeinsame Kontakte</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
