import { redirect } from "next/navigation";
import { withQuery } from "@/lib/default-course";
import { prisma } from "@/lib/prisma";

// Legacy-Route: /katalog/[id] -> Katalog-Detailansicht im Kurs der Frage.
// Frage-IDs sind global eindeutig; ohne Treffer geht es auf die Übersicht.
export default async function LegacyKatalogDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const question = await prisma.question.findUnique({
    where: { id: params.id },
    select: { courseId: true },
  });
  const path = question?.courseId
    ? `/kurs/${question.courseId}/katalog/${params.id}`
    : "/";
  redirect(withQuery(path, searchParams));
}
