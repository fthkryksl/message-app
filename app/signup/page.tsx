"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { register, saveToken } from "@/lib/api";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function SignUp() {
  const router = useRouter();

  const [userid, setUserid] = useState("");
  const [nickname, setNickname] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  //Username (@-prefix)
  const handleUseridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 0 && !val.startsWith("@")) val = "@" + val;
    if (userid === "@" && val.length <= 1) val = "";
    setUserid(val);
  };

  //Password validation
  const hasCapital = /[A-Z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const hasLength  = password.length >= 8 && password.length <= 32;
  const allValid   = hasCapital && hasNumber && hasLength;

  let pwdColor = "border-transparent";
  if (password.length > 0) {
    pwdColor = allValid
      ? "bg-green-50 border-green-400 text-green-900"
      : "bg-red-50 border-red-400 text-red-900";
  }

  const canSubmit =
    allValid && userid.length > 1 && nickname.length > 0 && fullname.length > 0;

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
      router.push("/chat"); // 👈 Zielseite nach Registrierung anpassen
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-linear-to-tr min-h-screen from-orange-400 via-blue-100 to-zinc-50">
      <main className="flex flex-col items-center w-full max-w-sm">
        <h1
          className={`${instrumentSerif.className} text-3xl text-orange-600 text-center mb-8 tracking-[-0.02em]`}
        >
          Sign Up
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col w-full space-y-4">

          {/* Full Name */}
          <input
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            placeholder="Full name"
            className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
              fullname.length > 0
                ? "bg-green-50 border-green-600 text-green-900"
                : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"
            }`}
          />

          {/* Nickname */}
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Nickname"
            className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
              nickname.length > 0
                ? "bg-green-50 border-green-600 text-green-900"
                : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"
            }`}
          />

          {/* User ID */}
          <input
            type="text"
            value={userid}
            onChange={handleUseridChange}
            placeholder="@username"
            className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
              userid.length > 1
                ? "bg-green-50 border-green-600 text-green-900"
                : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"
            }`}
          />

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${
                  password.length !== 0 ? pwdColor : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"
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

            <div className="w-full px-2 py-2">
              <p className="text-zinc-500 text-xs mb-2">Please follow these rules:</p>
              <div className="text-xs flex flex-col space-y-1">
                {[
                  { ok: hasCapital, label: "at least one capital letter" },
                  { ok: hasNumber,  label: "at least one number" },
                  { ok: hasLength,  label: "between 8–32 characters" },
                ].map(({ ok, label }) => (
                  <p
                    key={label}
                    className={ok ? "text-green-600" : password.length > 0 ? "text-red-500" : "text-zinc-500"}
                  >
                    {ok ? "✓" : password.length > 0 ? "✗" : "•"} {label}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* API Error */}
          {error && (
            <p className="text-red-500 text-sm text-center px-2">{error}</p>
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
            <span>{loading ? "Creating account…" : "Confirm"}</span>
            <ChevronRight className={canSubmit && !loading ? "" : "opacity-0"} />
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
  );
}