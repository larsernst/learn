"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "lernen", label: "Lernen", segment: "lernen" },
  { key: "pruefung", label: "Prüfung", segment: "pruefung" },
  { key: "fortschritt", label: "Fortschritt", segment: "fortschritt" },
  { key: "statistik", label: "Statistik", segment: "statistik" },
  { key: "katalog", label: "Katalog", segment: "katalog" },
];

export function KursNav({ courseId, srsEnabled = true }: { courseId: string; srsEnabled?: boolean }) {
  const pathname = usePathname();
  const base = `/kurs/${courseId}`;
  const current = pathname.startsWith(base)
    ? pathname.slice(base.length + 1).split("/")[0]
    : "";
  const tabs = srsEnabled ? TABS : TABS.filter((t) => t.key !== "lernen");

  return (
    <nav className="tabs" style={{ marginTop: 16, marginBottom: 8, flexWrap: "wrap" }}>
      <Link
        href={base}
        className={`tab${current === "" ? " tab--active" : ""}`}
      >
        Übersicht
      </Link>
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={`${base}/${t.segment}`}
          className={`tab${current === t.segment ? " tab--active" : ""}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
