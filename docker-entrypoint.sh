#!/bin/sh
set -e

# Wende Migrationen an, weise bestehende Fragen einem Kurs zu und seeede
# den Katalog, bevor die Next.js-App startet. Alle Schritte sind idempotent
# (migrate deploy / updateMany mit WHERE / upsert) und beruehren keine
# Nutzerdaten (Review / ReviewEvent).
echo "Lern-App: wende Datenbank-Migrationen an …"
npx prisma migrate deploy

echo "Lern-App: weise bestehende Fragen dem Standardkurs zu …"
npx tsx prisma/migrate-data.ts

echo "Lern-App: seeede Kurse und Fragenkatalog …"
npx tsx prisma/seed.ts

echo "Lern-App: starte Webserver …"
exec "$@"