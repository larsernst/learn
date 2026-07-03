-- Migration 0006: Module (Courses) als uebergeordnete Struktur.
-- Additiv: neue Tabelle "Course" und nullable "courseId" auf "Question".
-- Bestehende Fragen/Reviews bleiben unberuehrt; courseId wird per Seed
-- fuer die vorhandenen BS-Fragen auf "betriebssysteme" gesetzt.

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

ALTER TABLE "Question" ADD COLUMN "courseId" TEXT;

ALTER TABLE "Question"
  ADD CONSTRAINT "Question_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
