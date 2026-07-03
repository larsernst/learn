import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { selectExamQuestions } from "@/lib/exam";
import { serializeQuestion } from "@/lib/serialize";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const url = new URL(request.url);
  const countRaw = Number(url.searchParams.get("count") ?? "30");
  const count = Number.isFinite(countRaw) && countRaw > 0 ? countRaw : 30;
  const courseId = url.searchParams.get("courseId");

  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { mcqEnabled: true },
  });
  const mcqEnabled = me?.mcqEnabled ?? true;

  const all = await prisma.question.findMany(
    courseId ? { where: { courseId } } : undefined
  );
  const picked = selectExamQuestions(all, count);

  return NextResponse.json({
    questions: picked.map((q) => serializeQuestion(q, mcqEnabled)),
    total: all.length,
  });
}