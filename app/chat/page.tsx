"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { LogOut, UserX, Loader2 } from "lucide-react";
import { logout, deregister, getToken } from "@/lib/api";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function ChatPage() {
  const router = useRouter();
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingDeregister, setLoadingDeregister] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : "Logout failed.");
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
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This cannot be undone."
    );
    if (!confirmed) return;

    setError(null);
    setLoadingDeregister(true);
    try {
      await deregister(token);
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deregistration failed.");
    } finally {
      setLoadingDeregister(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-linear-to-tr min-h-screen from-orange-400 via-blue-100 to-zinc-50">
      <main className="flex flex-col items-center w-full max-w-sm">
        <h1
          className={`${instrumentSerif.className} text-3xl text-orange-600 text-center mb-8 tracking-[-0.02em]`}
        >
          Chats
        </h1>

        <p className="text-zinc-500 text-sm text-center mb-10">
          Your conversations will appear here.
        </p>

        {error && (
          <p className="text-red-500 text-sm text-center px-2 mb-6">{error}</p>
        )}

        <div className="flex flex-col w-full space-y-3">
          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loadingLogout || loadingDeregister}
            className={`w-full pl-6 pr-5 py-4 rounded-full flex items-center justify-between text-base transition-colors ${
              loadingLogout || loadingDeregister
                ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                : "bg-zinc-900 text-zinc-100 hover:bg-zinc-700 cursor-pointer"
            }`}
          >
            <LogOut size={18} className="opacity-0" />
            <span>{loadingLogout ? "Logging out…" : "Logout"}</span>
            {loadingLogout ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogOut size={18} />
            )}
          </button>

          {/* Deregister */}
          <button
            onClick={handleDeregister}
            disabled={loadingLogout || loadingDeregister}
            className={`w-full pl-6 pr-5 py-4 rounded-full flex items-center justify-between text-base transition-colors ${
              loadingLogout || loadingDeregister
                ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer"
            }`}
          >
            <UserX size={18} className="opacity-0" />
            <span>{loadingDeregister ? "Deleting account…" : "Delete Account"}</span>
            {loadingDeregister ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <UserX size={18} />
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
