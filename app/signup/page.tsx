"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { register, saveToken } from "@/lib/api";
import BlurText from "@/components/BlurText";
import CircularText from "@/components/CircularText";
import Grainient from "@/components/Grainient";
import ShinyText from "@/components/ShinyText";
import DecryptedText from "@/components/DecryptedText";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function SignUp() {
  const router = useRouter();

  // Profile states
  const [fullname, setFullname] = useState("");
  const [nickname, setNickname] = useState("");
  const [userid, setUserid] = useState("");

  // Password states
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error and loading states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Username (@-prefix)
  const handleUseridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 0 && !val.startsWith("@")) val = "@" + val;
    if (userid === "@" && val.length <= 1) val = "";
    setUserid(val);
  };

  // Password validation
  const hasCapital = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLength = password.length >= 8 && password.length <= 32;
  const allValid = hasCapital && hasNumber && hasLength;
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  let pwdColor =
    "bg-white/60 backdrop-blur-sm border-transparent text-zinc-900 focus:border-zinc-300";
  if (password.length > 0) {
    pwdColor = allValid
      ? "bg-green-50/80 backdrop-blur-sm border-green-400 text-green-900"
      : "bg-red-50/80 backdrop-blur-sm border-red-400 text-red-900";
  }

  let confirmPwdColor =
    "bg-white/60 backdrop-blur-sm border-transparent text-zinc-900 focus:border-zinc-300";
  if (confirmPassword.length > 0) {
    confirmPwdColor = passwordsMatch
      ? "bg-green-50/80 backdrop-blur-sm border-green-400 text-green-900"
      : "bg-red-50/80 backdrop-blur-sm border-red-400 text-red-900";
  }

  //Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setLoading(true);

    try {
      // Strip the leading "@" before sending to API
      const rawUserid = userid.startsWith("@") ? userid.slice(1) : userid;
      const { token } = await register(rawUserid, password, nickname, fullname);
      saveToken(token);
      router.push("/chat");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    allValid &&
    passwordsMatch &&
    userid.length > 1 &&
    nickname.length > 0 &&
    fullname.length > 0;

  const handleAnimationComplete = () => {
    console.log("Animation completed!");
  };

  return (
    <div className="min-h-screen bg-white p-2 pb-2 sm:p-4">
      <div className="relative flex flex-col flex-1 items-center justify-center h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] rounded-[2rem] overflow-hidden border border-zinc-100">
        <div className="absolute inset-0 z-0">
          <Grainient
            color1="#C7A48D"
            color2="#D46922"
            color3="#A3ACF0"
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

        <div className="absolute top-[16px] right-[16px] z-10">
          <CircularText
            text="TALK*WITH*YOUR*FRIENDS*"
            onHover="slowDown"
            spinDuration={20}
            className="custom-class"
          />
        </div>

        <main className="relative z-10 flex flex-col items-center w-full max-w-sm">
          <BlurText
            text="Sign Up"
            delay={20}
            animateBy="letters"
            direction="bottom"
            onAnimationComplete={handleAnimationComplete}
            className={`${instrumentSerif.className} text-3xl text-white text-center mb-8 tracking-[-0.02em]`}
          />

          <form
            onSubmit={handleSubmit}
            className="flex flex-col w-full space-y-4"
          >
            {/* Full Name */}
            <input
              type="text"
              name="name"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
                fullname.length > 0
                  ? "bg-green-50/80 backdrop-blur-sm border-green-600 text-green-900"
                  : "bg-white/60 backdrop-blur-sm border-transparent text-zinc-900 focus:border-zinc-300"
              }`}
            />
            {/* Nickname */}
            <input
              type="text"
              name="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nickname"
              autoComplete="nickname"
              className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
                nickname.length > 0
                  ? "bg-green-50/80 backdrop-blur-sm border-green-600 text-green-900"
                  : "bg-white/60 backdrop-blur-sm border-transparent text-zinc-900 focus:border-zinc-300"
              }`}
            />
            {/* User ID */}
            <input
              type="text"
              name="username"
              value={userid}
              onChange={handleUseridChange}
              placeholder="@username"
              autoComplete="username"
              className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
                userid.length > 1
                  ? "bg-green-50/80 backdrop-blur-sm border-green-600 text-green-900"
                  : "bg-white/60 backdrop-blur-sm border-transparent text-zinc-900 focus:border-zinc-300"
              }`}
            />
            {/* Password */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="new-password"
                  className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${pwdColor}`}
                />
                {/* Show Password (Toggle Button) */}
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

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${confirmPwdColor}`}
                />
                {/* Show Confirm Password (Toggle Button) */}
                {confirmPassword.length > 0 && (
                  <button
                    type="button"
                    onMouseDown={() => setShowConfirmPassword(true)}
                    onMouseUp={() => setShowConfirmPassword(false)}
                    onMouseLeave={() => setShowConfirmPassword(false)}
                    onTouchStart={() => setShowConfirmPassword(true)}
                    onTouchEnd={() => setShowConfirmPassword(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                )}
              </div>

              {/* Password Match Error Display (Optional if rules cover it, but explicit as user asked for "corresponding error") */}
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-red-500 text-xs px-2 -mt-2">
                  Passwords do not match.
                </p>
              )}

              <div className="w-full px-2 py-0">
                <p className="text-white text-xs mb-2">
                  Please follow these rules:
                </p>
                <div className="text-xs flex flex-col space-y-1">
                  {[
                    {
                      ok: hasCapital,
                      label: "at least one capital letter",
                      active: password.length > 0,
                    },
                    {
                      ok: hasNumber,
                      label: "at least one number",
                      active: password.length > 0,
                    },
                    {
                      ok: hasLength,
                      label: "between 8–32 characters",
                      active: password.length > 0,
                    },
                    {
                      ok: passwordsMatch,
                      label: "passwords match",
                      active: confirmPassword.length > 0,
                    },
                  ].map(({ ok, label, active }) => (
                    <p
                      key={label}
                      className={
                        ok
                          ? "text-green-600"
                          : active
                            ? "text-red-500"
                            : "text-white"
                      }
                    >
                      {ok ? "✓" : active ? "✗" : "•"} {label}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            {/* API Error */}
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
            {/* Submit */}
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
                    text="Loading"
                    disabled={false}
                    speed={2}
                    className="text-zinc-500"
                    shineColor="#ffffff"
                  />
                ) : (
                  "Confirm"
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
              I already have an account
            </Link>
          </form>
        </main>
      </div>
    </div>
  );
}
