import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chats",
  description: "Your Chats – Talks",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
