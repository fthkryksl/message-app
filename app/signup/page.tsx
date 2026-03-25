"use client";

import { useState } from "react";
import { Instrument_Serif } from "next/font/google";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const hasCapital = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLength = password.length >= 8 && password.length <= 32;

  const allValid = hasCapital && hasNumber && hasLength;

  let pwdColor = "border-transparent";
  if (password.length > 0) {
    if (allValid) {
      pwdColor = "bg-green-50 border-green-400 text-green-900";
    } else {
      pwdColor = "bg-red-50 border-red-400 text-red-900";
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-linear-to-tr min-h-screen from-orange-400 via-blue-100 to-zinc-50">
      <main className="flex flex-col items-center w-full max-w-sm">
        {/* Title */}
        <h1
          className={`${instrumentSerif.className} text-3xl text-orange-600 text-center mb-8 tracking-[-0.02em]`}
        >
          Sign Up
        </h1>

        {/* Form */}
        <form className="flex flex-col w-full space-y-4">
          {/* Username */}
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="@username"
            className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${username.length > 0 ? "bg-green-50 border-green-600 text-green-900" : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"}`}
          />

          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className={`w-full px-5 py-3 rounded-full text-base focus:outline-none transition-colors border placeholder:text-zinc-400 ${password.length !== 0 ? pwdColor : "bg-white border-transparent text-zinc-900 focus:border-zinc-300"}`}
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
              <p className="text-zinc-500 text-xs mb-2">
                Please follow these rules:
              </p>
              <div className="text-xs flex flex-col space-y-1">
                <p
                  className={
                    hasCapital
                      ? "text-green-600"
                      : password.length > 0
                        ? "text-red-500"
                        : "text-zinc-500"
                  }
                >
                  {hasCapital ? "✓" : password.length > 0 ? "✗" : "•"} at least
                  one captial letter
                </p>
                <p
                  className={
                    hasNumber
                      ? "text-green-600"
                      : password.length > 0
                        ? "text-red-500"
                        : "text-zinc-500"
                  }
                >
                  {hasNumber ? "✓" : password.length > 0 ? "✗" : "•"} at least
                  one number
                </p>
                <p
                  className={
                    hasLength
                      ? "text-green-600"
                      : password.length > 0
                        ? "text-red-500"
                        : "text-zinc-500"
                  }
                >
                  {hasLength ? "✓" : password.length > 0 ? "✗" : "•"} password
                  should be between 8-32 long
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!allValid || username.length === 0}
            className={`w-full mt-6 px-6 py-4 rounded-full flex items-center justify-between text-base transition-colors ${
              allValid && username.length > 0
                ? "bg-zinc-900 text-zinc-100 hover:bg-green-900 hover:text-green-100 cursor-pointer"
                : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
            }`}
          >
            <ChevronRight className={`opacity-0`} />
            <span>Confirm</span>
            <ChevronRight
              className={`${allValid && username.length > 0 ? "" : "opacity-0"}`}
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
  );
}
