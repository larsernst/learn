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
          <h2 style={{ marginBottom: 8 }}>{learnedPct}%</h2>
          <div className="progress">
            <div className="progress__bar" style={{ width: `${learnedPct}%` }} />
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
            {stats.learned} von {stats.total} Fragen
          </p>
        </div>
        <div className="card card--brand">
          <p className="eyebrow" style={{ color: "rgba(255,255,255,0.8)" }}>
            Heute fällig
          </p>
          <h2 style={{ color: "#fff", marginBottom: 8 }}>{stats.dueToday}</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
            Wiederholungen nach SM-2
          </p>
        </div>
        <div className="card">
          <p className="eyebrow">Gefestigt</p>
          <h2 style={{ marginBottom: 8 }}>{stats.mature}</h2>
          <p className="muted" style={{ fontSize: 14 }}>
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
              <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>
                {pct}% gelernt
              </p>
            </div>
          );
        })}
      </div>

      <hr className="divider" />

      <div className="card card--dark">
        <p className="eyebrow" style={{ color: "rgba(255,255,255,0.7)" }}>
          Statistik
        </p>
        <p>
          Insgesamt <strong>{stats.totalLapses}</strong> Versehen („Again") über alle
          Wiederholungen. Spaced Repetition zeigt schwierige Karten häufiger – das ist
          gewollt.
        </p>
      </div>
    </div>
  );
}