import { redirect } from "next/navigation";
import { getDefaultCoursePath, withQuery } from "@/lib/default-course";

// Legacy-Route: /katalog -> erster veröffentlichter Kurs (sonst Übersicht).
export default async function LegacyKatalogPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  redirect(withQuery(await getDefaultCoursePath("katalog"), searchParams));
}
