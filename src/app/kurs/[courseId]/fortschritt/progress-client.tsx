"use client";

interface Stats {
  total: number;
  learned: number;
  dueToday: number;
  mature: number;
  totalLapses: number;
}

interface PerChapter {
  chapter: number;
  chapterTitle: string;
  total: number;
  learned: number;
}

export default function ProgressClient({
  stats,
  perChapter,
}: {
  stats: Stats;
  perChapter: PerChapter[];
}) {
  const learnedPct = stats.total === 0 ? 0 : Math.round((stats.learned / stats.total) * 100);
  const duePct = stats.learned === 0 ? 0 : Math.round((stats.dueToday / Math.max(stats.learned, 1)) * 100);

  return (
    <div className="stack">
      <div className="grid grid--3">
        <div className="card">
          <p className="eyebrow">Gelernt</p>
          <p className="stat__value" style={{ marginBottom: 8 }}>{learnedPct}%</p>
          <div className="progress">
            <div className="progress__bar" style={{ width: `${learnedPct}%` }} />
          </div>
          <p className="muted text-sm" style={{ marginTop: 12 }}>
            {stats.learned} von {stats.total} Fragen
          </p>
        </div>
        <div className="card card--brand">
          <p className="eyebrow">Heute fällig</p>
          <p className="stat__value" style={{ marginBottom: 8 }}>{stats.dueToday}</p>
          <p className="muted text-sm">
            Wiederholungen nach SM-2
          </p>
        </div>
        <div className="card">
          <p className="eyebrow">Gefestigt</p>
          <p className="stat__value" style={{ marginBottom: 8 }}>{stats.mature}</p>
          <p className="muted text-sm">
            Fragen mit Intervalldauer ≥ 21 Tage
          </p>
        </div>
      </div>

      <hr className="divider" />

      <h2>Je Kapitel</h2>
      <div className="grid grid--2">
        {perChapter.map((c) => {
          const pct = c.total === 0 ? 0 : Math.round((c.learned / c.total) * 100);
          return (
            <div className="card" key={c.chapter}>
              <div className="row row--between">
                <strong>
                  Kapitel {c.chapter} · {c.chapterTitle}
                </strong>
                <span className="badge badge--muted">
                  {c.learned}/{c.total}
                </span>
              </div>
              <div className="progress" style={{ marginTop: 12 }}>
                <div className="progress__bar" style={{ width: `${pct}%` }} />
              </div>
              <p className="muted text-sm" style={{ marginTop: 8 }}>
                {pct}% gelernt
              </p>
            </div>
          );
        })}
      </div>

      <hr className="divider" />

      <div className="card card--dark">
        <p className="eyebrow">Statistik</p>
        <p>
          Insgesamt <strong>{stats.totalLapses}</strong> Versehen („Again") über alle
          Wiederholungen. Spaced Repetition zeigt schwierige Karten häufiger – das ist
          gewollt.
        </p>
      </div>
    </div>
  );
}