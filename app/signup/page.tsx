"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { register } from "@/lib/api";
import { saveToken, saveUserHash } from "@/lib/auth";
import ShinyText from "@/components/ReactBits/ShinyText";
import DecryptedText from "@/components/ReactBits/DecryptedText";
import BlurText from "@/components/ReactBits/BlurText";
import CircularText from "@/components/ReactBits/CircularText";
import Grainient from "@/components/ReactBits/Grainient";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function SignUp() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 0 && !val.startsWith("@")) val = "@" + val;
    if (username === "@" && val.length <= 1) val = "";
    setUsername(val);
  };

  const hasCapital = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLength = password.length >= 8 && password.length <= 32;
  const passwordsMatch = password === confirmPassword;
  const allValid = hasCapital && hasNumber && hasLength && passwordsMatch;

  let pwdColor = "border-transparent";
  if (password.length > 0) {
    pwdColor = allValid
      ? "bg-green-50 border-green-400 text-green-900"
      : "bg-red-50 border-red-400 text-red-900";
  }

  const canSubmit =
    allValid &&
    username.length > 1 &&
    nickname.length > 0 &&
    fullname.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setLoading(true);

    try {
      const rawUsername = username.startsWith("@")
        ? username.slice(1)
        : username;
      const { token, hash } = await register(
        rawUsername,
        password,
        nickname,
        fullname,
      );
      saveToken(token);
      saveUserHash(hash);
      router.push("/messages");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Etwas ist schiefgelaufen.",
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
            gamma={2}
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
            text="Registrieren"
            delay={50}
            animateBy="letters"
            direction="top"
            onAnimationComplete={handleAnimationComplete}
            className={`${instrumentSerif.className} text-3xl text-orange-600 text-center mb-8 tracking-[-0.02em]`}
          />

          <form
            onSubmit={handleSubmit}
            className="flex flex-col w-[90%] space-y-4"
          >
            <input
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Vollständiger Name"
              className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
                fullname.length > 0
                  ? "bg-green-50 border-green-600 text-green-900"
                  : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"
              }`}
            />

            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Spitzname"
              className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
                nickname.length > 0
                  ? "bg-green-50 border-green-600 text-green-900"
                  : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"
              }`}
            />

            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="@username"
              className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
                username.length > 1
                  ? "bg-green-50 border-green-600 text-green-900"
                  : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"
              }`}
            />

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort"
                  className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
                    password.length !== 0
                      ? pwdColor
                      : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"
                  }`}
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

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort bestätigen"
                  className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
                    confirmPassword.length !== 0
                      ? passwordsMatch
                        ? "bg-green-50 border-green-400 text-green-900"
                        : "bg-red-50 border-red-400 text-red-900"
                      : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"
                  }`}
                />
              </div>

              <div className="w-full px-2 py-2">
                <p className="text-zinc-500 text-xs mb-2">
                  Bitte beachte folgende Regeln:
                </p>
                <div className="text-xs flex flex-col space-y-1">
                  {[
                    { ok: hasCapital, label: "mindestens ein Großbuchstabe" },
                    { ok: hasNumber, label: "mindestens eine Zahl" },
                    { ok: hasLength, label: "zwischen 8 und 32 Zeichen" },
                    {
                      ok: passwordsMatch && password.length > 0,
                      label: "Passwörter stimmen überein",
                    },
                  ].map(({ ok, label }) => (
                    <p
                      key={label}
                      className={
                        ok
                          ? "text-green-600"
                          : password.length > 0 ||
                              (label === "Passwörter stimmen überein" &&
                                confirmPassword.length > 0)
                            ? "text-red-500"
                            : "text-zinc-500"
                      }
                    >
                      {ok
                        ? "✓"
                        : password.length > 0 ||
                            (label === "Passwörter stimmen überein" &&
                              confirmPassword.length > 0)
                          ? "✗"
                          : "•"}{" "}
                      {label}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center px-2">
                <DecryptedText
                  text={error}
                  speed={200}
                  maxIterations={3}
                  animateOn="view"
                />
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={`w-full mt-2 px-6 py-4 rounded-full flex items-center justify-between text-base transition-colors ${
                canSubmit && !loading
                  ? "bg-zinc-900 text-zinc-100 hover:bg-green-900 hover:text-green-100 cursor-pointer"
                  : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="opacity-0" />
              <span>
                {loading ? (
                  <ShinyText
                    text="Laden..."
                    disabled={false}
                    speed={2}
                    className="text-zinc-500"
                    shineColor="#ffffff"
                  />
                ) : (
                  "Bestätigen"
                )}
              </span>
              <ChevronRight
                className={canSubmit && !loading ? "" : "opacity-0"}
              />
            </button>

            <Link
              href="/login"
              className="w-full mt-2 flex items-center justify-center text-sm text-zinc-500 hover:text-zinc-900 transition-colors hover:underline"
            >
              Ich habe bereits ein Konto
            </Link>
          </form>
        </main>
      </div>
    </div>
  );
}
