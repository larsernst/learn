-- Migration 0014: Drift-Aufloesung. 0013 setzte ON DELETE CASCADE, liess
-- aber ON UPDATE auf dem Postgres-Default (NO ACTION) – Prisma erwartet
-- CASCADE. Ausserdem wurden die in 0011 angelegten Indizes
-- Course_ownerId_idx und Question_chapterId_idx aus dem Schema entfernt,
-- ohne sie per Migration zu droppen. Diese Migration gleicht beides ab.

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_courseId_fkey";

-- DropIndex
DROP INDEX "Course_ownerId_idx";

-- DropIndex
DROP INDEX "Question_chapterId_idx";

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
