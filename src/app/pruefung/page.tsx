import { redirect } from "next/navigation";
import { getDefaultCoursePath, withQuery } from "@/lib/default-course";

// Legacy-Route: /pruefung -> erster veröffentlichter Kurs (sonst Übersicht).
export default async function LegacyPruefungPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  redirect(withQuery(await getDefaultCoursePath("pruefung"), searchParams));
}
