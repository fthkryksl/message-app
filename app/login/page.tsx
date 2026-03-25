"use client";

import { useState } from "react";
import { Instrument_Serif } from "next/font/google";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"] });

export default function SignIn() {
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

  const allValid = password.length > 0 && username.length > 0;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-linear-to-tr min-h-screen from-orange-400 via-blue-100 to-zinc-50">
      <main className="flex flex-col items-center w-full max-w-sm">
        {/* Title */}
        <h1
          className={`${instrumentSerif.className} text-3xl text-orange-600 text-center mb-8 tracking-[-0.02em]`}
        >
          Login
        </h1>

        {/* Form */}
        <form className="flex flex-col w-full space-y-4">
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

          <button
            type="submit"
            disabled={!allValid}
            className={`w-full mt-4 pl-6 pr-3 py-4 rounded-full flex items-center justify-between text-base transition-colors ${
              allValid
                ? "bg-zinc-900 text-zinc-100 cursor-pointer"
                : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
            }`}
          >
            <ChevronRight className={`opacity-0`} />
            <span>Login</span>
            <ChevronRight className={`${allValid ? "" : "opacity-0"}`} />
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
  );
}
