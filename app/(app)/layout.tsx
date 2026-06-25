import TabNavigation from "@/components/TabNavigation";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <TabNavigation />
    </div>
  );
}
