"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { LogOut, UserX, Loader2 } from "lucide-react";
import { logout, deregister } from "@/lib/api";
import { getToken } from "@/lib/auth";
import BlurText from "@/components/BlurText";
import CircularText from "@/components/CircularText";
import Grainient from "@/components/Grainient";
import ShinyText from "@/components/ShinyText";
import DecryptedText from "@/components/DecryptedText";

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
      "Are you sure you want to permanently delete your account? This cannot be undone.",
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
    <div className="min-h-screen bg-white p-2 pb-2 sm:p-4">
      <div className="relative flex flex-col flex-1 items-center justify-center h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] rounded-[2rem] overflow-hidden border border-zinc-100 shadow-sm">
        <div className="absolute inset-0 z-0">
          <Grainient
            color1="#737373"
            color2="#A37452"
            color3="#A5ACD9"
            timeSpeed={1}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={560}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={1.5}
            grainAnimated
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={1}
          />
        </div>

        <div className="absolute top-[25px] right-[25px] z-10">
          <CircularText
            text="TALK*WITH*YOUR*FRIENDS*"
            onHover="slowDown"
            spinDuration={20}
            className="custom-class"
          />
        </div>

        <main className="relative z-10 flex flex-col items-center w-full max-w-sm">
          <BlurText
            text="Chats"
            delay={50}
            animateBy="letters"
            direction="top"
            className={`${instrumentSerif.className} text-3xl text-white text-center mb-8 tracking-[-0.02em]`}
          />

          <p className="text-white text-sm text-center mb-10">
            Your conversations will appear here.
          </p>

          {error && (
            <p className="text-red-500 text-sm text-center px-2 mb-6">
              <DecryptedText
                text={error}
                speed={200}
                maxIterations={8}
                animateOn="view"
              />
            </p>
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
              <span>
                {loadingLogout ? (
                  <ShinyText
                    text="Logging out…"
                    disabled={false}
                    speed={2}
                    className="text-zinc-500"
                    shineColor="#ffffff"
                  />
                ) : (
                  "Logout"
                )}
              </span>
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
              <span>
                {loadingDeregister ? (
                  <ShinyText
                    text="Deleting account…"
                    disabled={false}
                    speed={2}
                    className="text-red-400"
                    shineColor="#ffffff"
                  />
                ) : (
                  "Delete Account"
                )}
              </span>
              {loadingDeregister ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UserX size={18} />
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
