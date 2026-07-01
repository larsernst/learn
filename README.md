# BS Lern-App – Betriebssysteme Grundlagen (Fragenkatalog 2026)

![AI Assisted](https://img.shields.io/badge/AI%20Assisted-000000?style=for-the-badge&logo=opencode&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.18-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-2.0-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.45-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Status](https://img.shields.io/badge/Status-Lern--Projekt-orange?style=for-the-badge)

Eine TypeScript-/Next.js-Webanwendung zum Vorbereiten auf die Prüfung
„Betriebssysteme – Grundlagen" (Fragenkatalog 2026, Dozent: Ing. Leonard Zeh).
Die App enthält **alle 100 Fragen** des offiziellen Fragenkatalogs mit
Modellantworten, die aus den Vorlesungsfolien erstellt wurden, und nutzt
**Spaced Repetition (SM-2)** mit freier Erinnerung (Selbsteinschätzung).

> **Hinweis:** Die Quelldateien der Vorlesung liegen unter `resources/` und
> werden **nicht** in das Repository eingecheckt (siehe `.gitignore`). Die
> Fragen und Antworten sind in `prisma/seed-data/fragenkatalog.ts` als
> maschinenlesbare Daten zusammengefasst.

## Funktionsumfang

- Konto erstellen / anmelden (Passwort-Hashing mit bcryptjs, JWT-Session-Cookie).
- Alle 100 Prüfungsfragen über 6 Kapitel hinweg.
- Freie Erinnerung: Frage lesen → selbst antworten → Musterantwort aufdecken →
  selbst bewerten (`Again / Hard / Good / Easy`).
- SM-2 Spaced-Repetition-Algorithmus plant die nächste Fälligkeit je Karte.
- Fortschritts-Dashboard: gelernt %, heute fällig, gefestigt, je-Kapitel-Statistik.
- Atlassian-inspiriertes, reduziertes Design (Tokens aus `DESIGN.md`).
- Komplett dockerisiert via `docker-compose.yml` (PostgreSQL + Next.js-App).
- Unit-Tests (Vitest) für SM-2, Passwort-Hashing, Session-Tokens.
- E2E-Tests (Playwright) für den Lernfluss.

## Schnellstart mit Docker

```bash
# 1. Geheimnis setzen (in .env oder Shell-Umgebung)
cp .env.example .env
#JWT_SECRET auf einen langen Zufallswert setzen!

# 2. Stack bauen und starten
docker compose up --build -d

# 3. App öffnen
# http://localhost:3000
```

Beim ersten Start führt der Container automatisch `prisma migrate deploy`
und den Seed aus, sodass die 100 Fragen in der Datenbank liegen.

## Lokale Entwicklung (ohne Docker)

Voraussetzungen: Node ≥ 20, eine laufende PostgreSQL-Instanz.

```bash
npm install
cp .env.example .env            # DATABASE_URL + JWT_SECRET anpassen
npx prisma migrate dev          # Schema anlegen + Client erzeugen
npm run db:seed                 # 100 Fragen laden
npm run dev                     # http://localhost:3000
```

## Tests

```bash
# Unit-Tests (keine Datenbank nötig)
npm run test:unit

# E2E-Tests (App + DB müssen laufen, z. B. via docker compose)
BASE_URL=http://localhost:3000 npm run test:e2e
```

Details: [`docs/TESTING.md`](docs/TESTING.md).

## Projektstruktur

```
src/
  app/                  Next.js App-Router (Seiten + API-Routen)
    api/auth/           register / login / logout / me
    api/review/         next / submit (SM-2)
    api/progress/       Statistik
    lernen/             Lern-Sitzung (Review-Karte)
    fortschritt/        Fortschritts-Dashboard
    login|registrieren/ Auth-Seiten
  lib/
    sm2.ts              SM-2-Algorithmus (pure Funktionen, getestet)
    session.ts          Jose-JWT + httpOnly-Cookie
    password.ts         bcryptjs Hashing/Verify
    prisma.ts           Prisma-Client (Singleton)
    design-tokens.ts    Tokens aus DESIGN.md
prisma/
  schema.prisma         User / Question / Review
  seed.ts               Schreibt den Fragenkatalog in die DB
  seed-data/
    fragenkatalog.ts    100 Fragen + Antworten (Quelle: Vorlesung)
tests/
  unit/                 Vitest: sm2, password, session
  e2e/                  Playwright: Lernfluss
docker-compose.yml      Postgres + Web
Dockerfile              Multi-Stage-Build
DESIGN.md               Design-System-Vorgabe
docs/                   Doku (TESTING, ARCHITECTURE, LERNEN)
```

## Lizenz & Nutzung

Nur für persönliche Lernzwecke. Keine offizielle Veröffentlichung der
Hochschule. Vorlesungsinhalte: Ing. Leonard Zeh (`leze.software@gmail.com`).