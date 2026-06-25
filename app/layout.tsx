import type { Metadata } from "next";
import { Inter_Tight, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talks – Nachrichten App",
  description: "Willkommen bei Talks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={cn(
        "h-full w-full",
        "antialiased",
        interTight.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="h-screen w-screen overflow-hidden bg-slate-950">
        {children}
      </body>
    </html>
  );
}
