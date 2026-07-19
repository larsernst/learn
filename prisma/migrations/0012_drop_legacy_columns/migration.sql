-- Migration 0012: Legacy-Spalten entfernen, die durch Migration 0010/0011
-- abgelöst wurden. mcqOptions -> taskType/payload, mcqCorrect -> correct,
-- published -> status. Die flachen chapter/chapterTitle-Felder bleiben
-- erhalten (sie werden noch von den Leseseiten verwendet).

ALTER TABLE "Question" DROP COLUMN "mcqOptions";
ALTER TABLE "ReviewEvent" DROP COLUMN "mcqCorrect";
ALTER TABLE "Course" DROP COLUMN "published";
