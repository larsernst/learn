export interface CatalogCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  published: boolean;
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
  },
  {
    id: "rechnernetze",
    slug: "rechnernetze",
    title: "Rechnernetze",
    description:
      "Netzstruktur, Referenzmodelle (OSI/TCP-IP), Bitübertragung, Sicherungsschicht und Vermittlungsschicht.",
    order: 2,
    published: true,
  },
];
