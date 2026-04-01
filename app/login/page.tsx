"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { login } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import BlurText from "@/components/BlurText";
import CircularText from "@/components/CircularText";
import Grainient from "@/components/Grainient";
import ShinyText from "@/components/ShinyText";
import DecryptedText from "@/components/DecryptedText";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function SignIn() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 0 && !val.startsWith("@")) {
      val = "@" + val;
    }
    if (username === "@" && val.length <= 1) {
      val = "";
    }
    setUsername(val);
  };

  const allValid = password.length > 0 && username.length > 1;

  // Submit Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid || loading) return;

    setError(null);
    setLoading(true);

    try {
      // Strip leading "@" for API
      const rawUserid = username.startsWith("@") ? username.slice(1) : username;
      const { token } = await login(rawUserid, password);
      saveToken(token);
      router.push("/chat");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnimationComplete = () => {
    console.log("Animation completed!");
  };

  return (
    <div className="min-h-screen bg-white p-2 pb-2 sm:p-4">
      <div className="relative flex flex-col flex-1 items-center justify-center h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] rounded-[2rem] overflow-hidden border border-zinc-100 shadow-sm">
        <div className="absolute inset-0 z-0">
          <Grainient
            color1="#C7A48D"
            color2="#D46922"
            color3="#a3acf0"
            timeSpeed={0.9}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={560}
            noiseScale={2}
            grainAmount={0.09}
            grainScale={1.3}
            grainAnimated
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
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
            text="Login"
            delay={50}
            animateBy="letters"
            direction="top"
            onAnimationComplete={handleAnimationComplete}
            className={`${instrumentSerif.className} text-3xl text-orange-600 text-center mb-8 tracking-[-0.02em]`}
          />
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col w-full space-y-4"
          >
            {/* Username */}
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="@username"
              className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border bg-white border-transparent text-zinc-900 placeholder:text-zinc-400 ${username.length > 0 ? "focus:border-zinc-400" : "focus:border-zinc-300"}`}
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border bg-white border-transparent text-zinc-900 placeholder:text-zinc-400 ${password.length > 0 ? "focus:border-zinc-400" : "focus:border-zinc-300"}`}
              />
              {password.length > 0 && (
                <button
                  type="button"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onTouchStart={() => setShowPassword(true)}
                  onTouchEnd={() => setShowPassword(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>

            {/* API Error */}
            {error && (
              <p className="text-red-500 text-sm text-center px-2">
                <DecryptedText
                  text="Wrong username or password"
                  speed={200}
                  maxIterations={8}
                  animateOn="view"
                />
              </p>
            )}

            <button
              type="submit"
              disabled={!allValid || loading}
              className={`w-full mt-4 pl-6 pr-5 py-4 rounded-full flex items-center justify-between text-base transition-colors ${
                allValid && !loading
                  ? "bg-zinc-900 text-zinc-100 cursor-pointer"
                  : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="opacity-0" />
              <span>
                {loading ? (
                  <ShinyText
                    text="Loading"
                    disabled={false}
                    speed={2}
                    className="text-zinc-500"
                    shineColor="#ffffff"
                  />
                ) : (
                  "Login"
                )}
              </span>
              <ChevronRight
                className={allValid && !loading ? "" : "opacity-0"}
              />
            </button>

            <Link
              href="/signup"
              className="w-full mt-2 flex items-center justify-center text-sm text-zinc-500 hover:text-zinc-900 transition-colors hover:underline"
            >
              I don't have an account
            </Link>
          </form>
        </main>
      </div>
    </div>
  );
}
