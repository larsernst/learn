import { redirect } from "next/navigation";
import { getDefaultCoursePath, withQuery } from "@/lib/default-course";

// Legacy-Route: /statistik -> erster veröffentlichter Kurs (sonst Übersicht).
export default async function LegacyStatistikPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  redirect(withQuery(await getDefaultCoursePath("statistik"), searchParams));
}
