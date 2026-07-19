import { redirect } from "next/navigation";
import { getDefaultCoursePath, withQuery } from "@/lib/default-course";

// Legacy-Route: /lernen -> erster veröffentlichter Kurs (sonst Übersicht).
export default async function LegacyLernenPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  redirect(withQuery(await getDefaultCoursePath("lernen"), searchParams));
}
