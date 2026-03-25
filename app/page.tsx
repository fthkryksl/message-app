import { redirect } from "next/navigation";

export default function Home() {
  const user = null;
  // TODO: In Zukunft hier überprüfen, ob der Nutzer angemeldet ist.
  // Wenn nicht angemeldet -> redirect("/login")
  // Wenn angemeldet -> Zeige Dashboard/Main App
  if (user) {
    return <p>Dashboard</p>;
  } else {
    redirect("/login");
  }
}
