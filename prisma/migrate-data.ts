// Einmaldaten-Migration: weist allen bestehenden Fragen ohne Kurs den
// Standardkurs ("betriebssysteme") zu. Der Standardkurs wird nur angelegt,
// wenn es solche Bestandsfragen gibt – frische Installationen bekommen
// keinen vorbelegten Kurs. Idempotent – mehrfach ausführbar.
//
// Aufruf:
//   npm run db:migrate-data              # schreibt
//   npm run db:migrate:data -- --dry-run # nur Vorschau, keine Schreibvorgänge
//
// Typischer Ablauf nach einem Code-Update der alten (Single-Course-) App:
//   npx prisma migrate deploy            # Schema: Course-Tabelle + courseId-Spalte
//   npm run db:migrate-data              # Daten: vorhandene Fragen -> BS-Kurs
//   npm run db:seed                      # optional: Katalog + RN auffrischen
//
// Vorher empfohlen: sh scripts/backup-db.sh

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_COURSE_ID = "betriebssysteme";
const DEFAULT_COURSE = {
  id: DEFAULT_COURSE_ID,
  slug: DEFAULT_COURSE_ID,
  title: "Betriebssysteme",
  description:
    "Vor der Umstrukturierung angelegte Fragen ohne Kurszuordnung – standardmäßig dem Kurs Betriebssysteme zugeordnet.",
  order: 1,
  published: true,
};

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(
    isDryRun
      ? "Dry-Run: es werden keine Daten geschrieben."
      : "Daten-Migration (schreibend)."
  );

  // 1. Prüfen, ob die Migration 0006 bereits angewendet wurde
  //    (Course-Tabelle vorhanden). Wenn nicht, Abbruch mit Hinweis.
  let courseTableExists: boolean;
  try {
    await prisma.course.count();
    courseTableExists = true;
  } catch {
    courseTableExists = false;
  }
  if (!courseTableExists) {
    console.error(
      "Fehler: Die Tabelle „Course“ existiert noch nicht.\n" +
        "Bitte zuerst die Schema-Migration anwenden:\n" +
        "  npx prisma migrate deploy"
    );
    process.exitCode = 1;
    return;
  }

  // 2. Fragen ohne Kurs (courseId IS NULL) zählen. Der Standardkurs wird
  //    nur noch angelegt, wenn es tatsächlich Bestandsfragen ohne Kurs
  //    gibt – auf frischen Datenbanken entsteht so kein vorbelegter Kurs.
  const orphanCount = await prisma.question.count({ where: { courseId: null } });

  if (orphanCount === 0) {
    console.log(
      "Keine Fragen ohne Kurs vorhanden – Standardkurs wird nicht angelegt."
    );
  } else {
    // Standardkurs sicherstellen (anlegen falls fehlt).
    const existingCourse = await prisma.course.findUnique({
      where: { id: DEFAULT_COURSE_ID },
      select: { id: true, title: true },
    });
    if (existingCourse) {
      console.log(
        `Kurs „${existingCourse.title}“ (${existingCourse.id}) bereits vorhanden – keine Neuanlage.`
      );
    } else {
      console.log(`Lege Standardkurs „${DEFAULT_COURSE.title}“ an …`);
      if (!isDryRun) {
        await prisma.course.create({ data: DEFAULT_COURSE });
      }
    }

    console.log(
      `${orphanCount} Frage(n) ohne Kurs gefunden -> Zuweisung zu „${DEFAULT_COURSE_ID}“.`
    );

    if (!isDryRun) {
      const result = await prisma.question.updateMany({
        where: { courseId: null },
        data: { courseId: DEFAULT_COURSE_ID },
      });
      console.log(`${result.count} Frage(n) aktualisiert.`);
    } else {
      console.log("(Dry-Run – keine Aktualisierung durchgeführt.)");
    }

    // Bestätigung: Verteilung der Fragen pro Kurs.
    const distribution = await prisma.question.groupBy({
      by: ["courseId"],
      _count: { _all: true },
    });
    console.log("Aktuelle Verteilung der Fragen pro Kurs:");
    for (const row of distribution) {
      console.log(`  ${row.courseId ?? "(null)"}: ${row._count._all}`);
    }
  }

  // Hinweis: Der frühere Task-Typ-Backfill (Migration 0010, las die
  // Legacy-Spalte mcqOptions bzw. ReviewEvent.mcqCorrect) wurde entfernt –
  // beide Spalten sind seit Migration 0012 gelöscht, der aktuelle Prisma-
  // Client kann sie daher gar nicht mehr abfragen. Fragen ohne taskType
  // werden von den Lesepfaden über normalizeQuestionTask (Registry)
  // als recall/mcq interpretiert.

  // Chapter-Backfill (Migration 0011): pro einmaligem (courseId, chapter,
  //    chapterTitle) wird ein Chapter-Datensatz erzeugt und Question.chapterId
  //    darauf gesetzt. Idempotent: bestehende Chapter werden am Slug erkannt.
  await backfillChapters();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function backfillChapters() {
  let questionsForChapters: {
    id: string;
    courseId: string | null;
    chapter: number;
    chapterTitle: string;
  }[];
  try {
    questionsForChapters = await prisma.question.findMany({
      where: { chapterId: null },
      select: { id: true, courseId: true, chapter: true, chapterTitle: true },
    });
  } catch (e) {
    console.warn(
      "Hinweis: Spalte chapterId nicht vorhanden – Migration 0011 ausgelassen?\n" +
        "  npx prisma migrate deploy",
      e
    );
    return;
  }

  if (questionsForChapters.length === 0) {
    console.log("Chapter-Backfill: alle Fragen bereits mit chapterId versehen – nichts zu tun.");
    return;
  }

  // Eindeutige (courseId, chapter, chapterTitle) bestimmen, mit stabiler Reihenfolge.
  const chapterKeys = new Map<string, { courseId: string; chapter: number; chapterTitle: string; order: number }>();
  for (const q of questionsForChapters) {
    if (!q.courseId) continue;
    const key = `${q.courseId}|${q.chapter}|${q.chapterTitle}`;
    if (!chapterKeys.has(key)) {
      chapterKeys.set(key, {
        courseId: q.courseId,
        chapter: q.chapter,
        chapterTitle: q.chapterTitle,
        order: q.chapter,
      });
    }
  }

  let chaptersCreated = 0;
  const chapterIdByKey = new Map<string, string>();

  for (const [, info] of chapterKeys) {
    const slug = `${info.chapter}-${slugify(info.chapterTitle)}`;
    const key = `${info.courseId}|${info.chapter}|${info.chapterTitle}`;
    if (!isDryRun) {
      const ch = await prisma.chapter.upsert({
        where: { courseId_slug: { courseId: info.courseId, slug } },
        create: {
          courseId: info.courseId,
          slug,
          title: info.chapterTitle,
          order: info.order,
        },
        update: {
          title: info.chapterTitle,
          order: info.order,
        },
      });
      chapterIdByKey.set(key, ch.id);
      if (ch.createdAt.getTime() >= Date.now() - 60_000) chaptersCreated++;
    } else {
      chapterIdByKey.set(key, `(dry-run:${key})`);
    }
  }

  let questionsLinked = 0;
  for (const q of questionsForChapters) {
    if (!q.courseId) continue;
    const key = `${q.courseId}|${q.chapter}|${q.chapterTitle}`;
    const chapterId = chapterIdByKey.get(key);
    if (!chapterId) continue;
    if (!isDryRun) {
      await prisma.question.update({
        where: { id: q.id },
        data: { chapterId },
      });
    }
    questionsLinked++;
  }

  console.log(
    `Chapter-Backfill: ${chapterKeys.size} eindeutige Kapitel, ${questionsLinked} Frage(n) verknüpft.` +
      (isDryRun ? " (Dry-Run)" : "")
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
