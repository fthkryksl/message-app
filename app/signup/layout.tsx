import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talks - Registrieren",
  description: "Registrieren bei Talks",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
