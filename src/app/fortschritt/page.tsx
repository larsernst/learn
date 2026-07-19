import { redirect } from "next/navigation";
import { getDefaultCoursePath, withQuery } from "@/lib/default-course";

// Legacy-Route: /fortschritt -> erster veröffentlichter Kurs (sonst Übersicht).
export default async function LegacyFortschrittPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  redirect(withQuery(await getDefaultCoursePath("fortschritt"), searchParams));
}
