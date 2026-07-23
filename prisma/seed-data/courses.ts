export interface CatalogChapter {
  slug: string;
  title: string;
  description?: string;
  order: number;
}

export interface CatalogCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  published: boolean;
  // false = Lern-Modul (Spaced Repetition) für diesen Kurs deaktiviert.
  srsEnabled?: boolean;
  chapters?: CatalogChapter[];
}

export const COURSES: CatalogCourse[] = [
  {
    id: "betriebssysteme",
    slug: "betriebssysteme",
    title: "Betriebssysteme",
    description:
      "Aufgaben, Prozesse und Threads, Ein-/Ausgabe, Speicherverwaltung, Datensicherung und Sicherheit.",
    order: 1,
    published: true,
    chapters: [
      { slug: "1-einfuehrung", title: "Einführung", order: 1 },
      { slug: "2-prozesse-und-threads", title: "Prozesse und Threads", order: 2 },
      { slug: "3-ein-und-ausgabegeraete", title: "Ein- und Ausgabegeräte", order: 3 },
      { slug: "4-speicherverwaltung", title: "Speicherverwaltung", order: 4 },
      { slug: "5-datensicherung", title: "Datensicherung", order: 5 },
      { slug: "6-sicherheit-in-betriebssystemen", title: "Sicherheit in Betriebssystemen", order: 6 },
    ],
  },
  {
    id: "rechnernetze",
    slug: "rechnernetze",
    title: "Rechnernetze",
    description:
      "Netzstruktur, Referenzmodelle (OSI/TCP-IP), Bitübertragung, Sicherungsschicht und Vermittlungsschicht.",
    order: 2,
    published: true,
    chapters: [
      { slug: "1-netzstruktur-ueberblick", title: "Netzstruktur & Übersicht", order: 1 },
      { slug: "2-referenzmodelle-osi-tcp-ip", title: "Referenzmodelle (OSI / TCP-IP)", order: 2 },
      { slug: "3-bituebertragung-anschlussnetze", title: "Bitübertragung & Anschlussnetze", order: 3 },
      { slug: "4-sicherungsschicht-mac", title: "Sicherungsschicht & MAC", order: 4 },
      { slug: "5-vermittlungsschicht-ip", title: "Vermittlungsschicht & IP", order: 5 },
    ],
  },
];
