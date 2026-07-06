#!/bin/sh
# Stellt ein binäres PostgreSQL-Backup der Lern-App-Datenbank wieder her.
# Erzeugt mit scripts/backup-db.sh (pg_dump -Fc, Custom-Format).
#
# Aufruf vom Projektverzeichnis aus (docker compose muss laufen):
#   sh scripts/restore-db.sh backups/lernapp-20260703-220000.dump
#
# Ohne Angabe wird das neueste Backup aus backups/ verwendet:
#   sh scripts/restore-db.sh
#
# Mit dem Schalter --confirm wird die Sicherheitsabfrage übersprungen
# (z. B. für Skripting):
#   sh scripts/restore-db.sh backups/x.dump --confirm
set -e

# ── Argumente auflösen ──────────────────────────────────────────────────
CONFIRM=0
DUMP_ARG=""

for arg in "$@"; do
  case "$arg" in
    --confirm) CONFIRM=1 ;;
    -h|--help)
      echo "Nutzung: sh scripts/restore-db.sh [backup-datei] [--confirm]"
      echo "Ohne Datei wird das neueste Backup aus backups/ verwendet."
      exit 0
      ;;
    *) DUMP_ARG="$arg" ;;
  esac
done

# ── Backup-Datei bestimmen ──────────────────────────────────────────────
if [ -n "$DUMP_ARG" ]; then
  DUMP="$DUMP_ARG"
else
  OUT_DIR="backups"
  DUMP=$(ls -1t "$OUT_DIR"/lernapp-*.dump 2>/dev/null | head -n 1 || true)
  if [ -z "$DUMP" ]; then
    echo "Fehler: Kein Backup in ${OUT_DIR}/ gefunden."
    echo "Bitte einen Dateinamen angeben: sh scripts/restore-db.sh <datei>"
    exit 1
  fi
  echo "Kein Dateiname angegeben – verwende neuestes Backup: $DUMP"
fi

if [ ! -f "$DUMP" ]; then
  echo "Fehler: Datei nicht gefunden: $DUMP"
  exit 1
fi

# ── Sicherheitsabfrage ──────────────────────────────────────────────────
SIZE=$(wc -c < "$DUMP" | tr -d ' ')

echo "Wiederherstellung von: $DUMP ($SIZE Bytes)"
echo "ACHTUNG: Dies überschreibt die aktuelle Datenbank 'lernapp'!"
echo "         Vorheriges Backup empfohlen: sh scripts/backup-db.sh"
echo ""

if [ "$CONFIRM" -ne 1 ]; then
  printf "Wirklich fortfahren? [j/N] "
  read -r ANSWER
  case "$ANSWER" in
    j|J|y|Y) ;;
    *)
      echo "Abgebrochen."
      exit 0
      ;;
  esac
fi

# ── Restore ─────────────────────────────────────────────────────────────
# Die Datenbank wird komplett verworfen und neu angelegt, statt
# pg_restore -c (per-Object-DROP) zu nutzen. Per-Object-DROP scheitert
# nämlich an FK-Abhängigkeiten, wenn das Zielschema Tabellen enthält, die
# im Backup nicht vorhanden sind (z. B. UserRole aus einer neueren
# Migration). Danach werden die Migrations-/Seed-Schritte ausgeführt, da
# das Backup von einer älteren App-Version stammen kann und ein neueres
# Schema erwartet (idempotent).
echo "Leere Datenbank …"
docker compose exec -T db psql -U lernapp -d postgres -v ON_ERROR_STOP=1 -c \
  "DROP DATABASE IF EXISTS lernapp WITH (FORCE);"
docker compose exec -T db psql -U lernapp -d postgres -v ON_ERROR_STOP=1 -c \
  "CREATE DATABASE lernapp OWNER lernapp;"

echo "Stelle wiederher …"
# Datei wird auf dem Host gelesen und per stdin an pg_restore im Container
# übergeben (der Container hat keinen Zugriff auf das Host-Dateisystem).
# --no-owner/--no-privileges, damit Dumps von anderen Instanzen (anderer
# Owner) sauber eingespielt werden.
docker compose exec -T db pg_restore -U lernapp -d lernapp --no-owner --no-privileges --exit-on-error < "$DUMP"

echo ""
echo "Wiederherstellung abgeschlossen."
echo ""
echo "Falls das Backup von einer älteren App-Version stammt, danach die"
echo "Migrations-/Seed-Schritte ausführen (idempotent):"
echo "  docker compose exec web npm exec -- prisma migrate deploy"
echo "  docker compose exec web npm run db:migrate:data"
echo "  docker compose exec web npm run db:seed"
