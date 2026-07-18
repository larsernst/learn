-- Migration 0010: Task-Typen-Diskriminator (taskType + payload) auf Fragen
-- und generisches correct-Flag auf ReviewEvents.
-- Additiv: die bisherigen mcqOptions-/mcqCorrect-Spalten bleiben erhalten
-- (Dual-Write während der Übergangszeit), werden aber durch taskType/payload
-- bzw. correct abgelöst. Der Backfill erfolgt idempotent in migrate-data.ts:
--   taskType  = mcqOptions ? 'mcq' : 'recall'
--   payload   = { options: mcqOptions } für MCQ, sonst NULL
--   ReviewEvent.correct = mcqCorrect für bestehende Events.

ALTER TABLE "Question" ADD COLUMN "taskType" TEXT;
ALTER TABLE "Question" ADD COLUMN "payload" JSONB;

ALTER TABLE "ReviewEvent" ADD COLUMN "correct" BOOLEAN;
