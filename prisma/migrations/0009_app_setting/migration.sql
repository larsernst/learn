-- Migration 0009: Globale App-Einstellungen (key/value), z. B. matureThresholdDays.
-- Additiv: neue Tabelle "AppSetting". Default-Wert fuer matureThresholdDays
-- entspricht dem SM-2-Maximalintervall (MAX_INTERVAL_DAYS = 2), so dass
-- "Gefestigt" mit dem 2-Tage-Cap wieder erreichbar ist.

CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

INSERT INTO "AppSetting" ("key", "value", "updatedAt") VALUES ('matureThresholdDays', '2', CURRENT_TIMESTAMP);
