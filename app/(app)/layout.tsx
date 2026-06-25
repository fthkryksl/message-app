import TabNavigation from "@/components/TabNavigation";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <TabNavigation />
    </div>
  );
}
