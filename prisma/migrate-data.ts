// Einmaldaten-Migration: weist allen bestehenden Fragen ohne Kurs den
// Standardkurs ("betriebssysteme") zu und stellt sicher, dass der Kurs
// existiert. Idempotent – mehrfach ausführbar.
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

  // 2. Standardkurs sicherstellen (anlegen falls fehlt).
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

  // 3. Fragen ohne Kurs (courseId IS NULL) zählen und zuweisen.
  const orphanCount = await prisma.question.count({ where: { courseId: null } });

  if (orphanCount === 0) {
    console.log("Keine Fragen ohne Kurs vorhanden – nichts zu tun.");
    return;
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

  // 4. Bestätigung: Verteilung der Fragen pro Kurs.
  const distribution = await prisma.question.groupBy({
    by: ["courseId"],
    _count: { _all: true },
  });
  console.log("Aktuelle Verteilung der Fragen pro Kurs:");
  for (const row of distribution) {
    console.log(`  ${row.courseId ?? "(null)"}: ${row._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
