#!/bin/sh
set -e

# Wende Migrationen an und gleiche Legacy-Datenbestände ab, bevor die
# Next.js-App startet. Beide Schritte sind idempotent (migrate deploy /
# updateMany mit WHERE) und beruehren keine Nutzerdaten (Review /
# ReviewEvent). Auf einer frischen Datenbank sind sie No-ops.
echo "Lern-App: wende Datenbank-Migrationen an …"
npx prisma migrate deploy

echo "Lern-App: gleiche Legacy-Datenbestände ab …"
npx tsx prisma/migrate-data.ts

# Demo-/Beispiel-Inhalte (zwei Kurse mit Fragenkatalog) werden nur auf
# ausdrücklichen Wunsch geseedt. Standard: die App startet ohne
# vorbelegte Kurse – Inhalte werden von Editoren/Admins erstellt.
if [ "${SEED_DEMO_CONTENT:-false}" = "true" ]; then
  echo "Lern-App: SEED_DEMO_CONTENT=true – seeede Demo-Kurse und Fragenkatalog …"
  npx tsx prisma/seed.ts
else
  echo "Lern-App: kein Demo-Seed (SEED_DEMO_CONTENT != true) – starte ohne vorbelegte Kurse."
fi

echo "Lern-App: starte Webserver …"
exec "$@"
