-- Migration 0008: Pro-User-Einstellung fuer einfache Richtig/Falsch-Bewertung
ALTER TABLE "User" ADD COLUMN "simpleGrading" BOOLEAN NOT NULL DEFAULT FALSE;
