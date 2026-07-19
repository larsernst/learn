import { redirect } from "next/navigation";

// Der Editor-Bereich ist umgezogen: /admin/kurse -> /editor
export default function AdminKurseRedirectPage() {
  redirect("/editor");
}
