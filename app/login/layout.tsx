import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talks - Anmelden",
  description: "Anmelden bei Talks",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
