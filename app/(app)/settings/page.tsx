"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { LogOut, UserX, Loader2, Bell, Lock, Palette, HelpCircle } from "lucide-react";
import { logout, deregister } from "@/lib/api";
import { getToken } from "@/lib/auth";
import BlurText from "@/components/BlurText";
import ShinyText from "@/components/ShinyText";
import DecryptedText from "@/components/DecryptedText";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

const settingsOptions = [
  { icon: Bell, label: "Benachrichtigungen", description: "Verwaltung von Benachrichtigungen" },
  { icon: Lock, label: "Datenschutz & Sicherheit", description: "Kontoeinstellungen" },
  { icon: Palette, label: "Darstellung", description: "Design und Farbschema" },
  { icon: HelpCircle, label: "Hilfe & Support", description: "FAQ und Support" },
];

export default function SettingsPage() {
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
    const confirmed = globalThis.confirm(
      "Bist du sicher, dass du dein Konto permanent löschen möchtest? Das kann nicht rückgängig gemacht werden."
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
    <div className="w-full h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 z-10">
        <h1 className={`${instrumentSerif.className} text-2xl font-bold`}>
          <BlurText
            text="Einstellungen"
            delay={50}
            animateBy="letters"
            direction="top"
            className="text-orange-500"
          />
        </h1>
      </div>

      {/* Content */}
      <div className="overflow-y-auto">
        {/* Settings Options */}
        <div className="divide-y divide-slate-700 border-b border-slate-700">
          {settingsOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                className="w-full p-4 hover:bg-slate-800 transition-colors active:bg-slate-700 text-left"
              >
                <div className="flex items-start gap-3">
                  <Icon size={20} className="text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">{option.label}</h3>
                    <p className="text-xs text-slate-400">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Account Section */}
        <div className="p-4">
          {error && (
            <p className="text-red-500 text-sm text-center px-2 mb-6 bg-red-950 p-3 rounded-lg">
              <DecryptedText
                text={error}
                speed={200}
                maxIterations={8}
                animateOn="view"
              />
            </p>
          )}

          <div className="space-y-3">
            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={loadingLogout || loadingDeregister}
              className={`w-full pl-6 pr-5 py-3 rounded-lg flex items-center justify-between text-base transition-colors font-medium ${
                loadingLogout || loadingDeregister
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-slate-800 text-slate-100 hover:bg-slate-700 cursor-pointer active:bg-slate-600"
              }`}
            >
              <LogOut size={18} />
              <span>
                {loadingLogout ? (
                  <ShinyText text="Abmelden..." disabled={false} speed={2} className="text-slate-400" shineColor="#ffffff" />
                ) : (
                  "Abmelden"
                )}
              </span>
              {loadingLogout ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <div className="w-6"></div>
              )}
            </button>

            {/* Deregister */}
            <button
              onClick={handleDeregister}
              disabled={loadingLogout || loadingDeregister}
              className={`w-full pl-6 pr-5 py-3 rounded-lg flex items-center justify-between text-base transition-colors font-medium ${
                loadingLogout || loadingDeregister
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-red-950 text-red-400 border border-red-800 hover:bg-red-900 cursor-pointer active:bg-red-800"
              }`}
            >
              <UserX size={18} />
              <span>
                {loadingDeregister ? (
                  <ShinyText text="Konto wird gelöscht..." disabled={false} speed={2} className="text-red-300" shineColor="#ffffff" />
                ) : (
                  "Konto löschen"
                )}
              </span>
              {loadingDeregister ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <div className="w-6"></div>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center mt-6">
            v1.0.0 • Talks © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
