-- Migration 0011: Kapitel als eigene Tabelle, Kurs-Besitzer und -Status.
-- Additiv: neue "Chapter"-Tabelle, "Question.chapterId" als optionaler FK
-- (die flachen Felder "chapter"/"chapterTitle" bleiben erhalten, bis alle
-- Konsumenten umgestellt sind), "Course.ownerId" und "Course.status".
-- Der Backfill (Chapter aus einmaligen (courseId, chapter, chapterTitle)
-- erzeugen und Question.chapterId setzen) erfolgt idempotent in
-- migrate-data.ts. status='published' ist default; bestehende Kurse
-- bleiben damit sichtbar. ownerId bleibt NULL für Seed-Kurse (offiziell).

CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Chapter_courseId_slug_key" ON "Chapter"("courseId", "slug");
CREATE INDEX "Chapter_courseId_order_idx" ON "Chapter"("courseId", "order");

ALTER TABLE "Chapter"
  ADD CONSTRAINT "Chapter_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Question" ADD COLUMN "chapterId" TEXT;

ALTER TABLE "Question"
  ADD CONSTRAINT "Question_chapterId_fkey"
  FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Question_chapterId_idx" ON "Question"("chapterId");

ALTER TABLE "Course" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Course" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'published';

ALTER TABLE "Course"
  ADD CONSTRAINT "Course_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Course_ownerId_idx" ON "Course"("ownerId");
