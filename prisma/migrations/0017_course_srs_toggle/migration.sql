-- Migration 0017: Kurs-Schalter "srsEnabled" (Spaced Repetition pro Kurs
-- deaktivierbar, z. B. für reine Coding-Kurse). Default true – Bestandskurse
-- bleiben unverändert. Bei deaktiviertem SR werden Lern-Bereich und
-- /api/review gesperrt; Katalog und Prüfung bleiben nutzbar.

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "srsEnabled" BOOLEAN NOT NULL DEFAULT true;
