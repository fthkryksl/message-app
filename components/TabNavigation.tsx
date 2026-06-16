"use client";

import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Users, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Nachrichten", path: "/messages", icon: MessageCircle },
  { name: "Gruppen", path: "/groups", icon: Users },
  { name: "Suche", path: "/search", icon: Search },
  { name: "Profil", path: "/profile", icon: User },
];

export default function TabNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/messages/") && pathname !== "/messages") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 md:hidden">
      <div className="flex justify-around items-center h-20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.path || pathname.startsWith(tab.path + "/");

          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive
                  ? "text-orange-500"
                  : "text-slate-400 hover:text-slate-300"
              )}
              aria-label={tab.name}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
