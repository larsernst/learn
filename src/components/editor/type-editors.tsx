"use client";

import type { DragDropFormState, McqFormState, OrderFormState } from "@/lib/editor/payload";
import { mcqSelectionMode } from "@/lib/editor/payload";

// ── MCQ ───────────────────────────────────────────────────────────────
export function McqEditor({
  value,
  onChange,
}: {
  value: McqFormState;
  onChange: (v: McqFormState) => void;
}) {
  const mode = mcqSelectionMode(value);
  function setOption(idx: number, patch: Partial<McqFormState["options"][number]>) {
    onChange({
      options: value.options.map((o, i) => (i === idx ? { ...o, ...patch } : o)),
    });
  }
  function move(idx: number, dir: -1 | 1) {
    const swap = idx + dir;
    if (swap < 0 || swap >= value.options.length) return;
    const options = [...value.options];
    [options[idx], options[swap]] = [options[swap], options[idx]];
    onChange({ options });
  }
  return (
    <div className="stack">
      <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontSize: 14 }}>Antwort-Optionen</strong>
        <span className="badge badge--muted" style={{ fontSize: 11 }}>
          {mode === "single" ? "Single-Choice (eine richtige)" : "Mehrfachauswahl"}
        </span>
      </div>
      {value.options.map((o, idx) => (
        <div key={idx} className="row" style={{ gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={o.correct}
            onChange={(e) => setOption(idx, { correct: e.target.checked })}
            title="Richtige Option"
            style={{ width: 18, height: 18 }}
          />
          <input
            className="input"
            style={{ flex: 1 }}
            value={o.text}
            onChange={(e) => setOption(idx, { text: e.target.value })}
            placeholder={`Option ${idx + 1} …`}
          />
          <button type="button" className="btn btn--ghost btn--sm" disabled={idx === 0} onClick={() => move(idx, -1)} title="Nach oben">
            ↑
          </button>
          <button type="button" className="btn btn--ghost btn--sm" disabled={idx === value.options.length - 1} onClick={() => move(idx, 1)} title="Nach unten">
            ↓
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={value.options.length <= 2}
            onClick={() => onChange({ options: value.options.filter((_, i) => i !== idx) })}
            title="Option entfernen"
          >
            ✕
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => onChange({ options: [...value.options, { text: "", correct: false }] })}
        >
          + Option hinzufügen
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        Häkchen = richtige Antwort. Lernende sehen die Optionen in gemischter Reihenfolge.
      </p>
    </div>
  );
}

// ── Drag & Drop ───────────────────────────────────────────────────────
const ZONE_COLORS = ["#1868db", "#0c7a5b", "#8a4b08", "#7c3aed", "#b91c1c", "#0369a1"];

export function DragDropEditor({
  value,
  onChange,
}: {
  value: DragDropFormState;
  onChange: (v: DragDropFormState) => void;
}) {
  function setZone(idx: number, label: string) {
    onChange({ ...value, zones: value.zones.map((z, i) => (i === idx ? { label } : z)) });
  }
  function setItem(idx: number, patch: Partial<DragDropFormState["items"][number]>) {
    onChange({ ...value, items: value.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
  }
  return (
    <div className="stack">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }} className="dd-editor-grid">
        <div className="stack" style={{ gap: 8 }}>
          <strong style={{ fontSize: 14 }}>Zonen (Kategorien)</strong>
          {value.zones.map((z, idx) => (
            <div key={idx} className="row" style={{ gap: 6, alignItems: "center" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: ZONE_COLORS[idx % ZONE_COLORS.length],
                  flexShrink: 0,
                }}
              />
              <input
                className="input"
                value={z.label}
                onChange={(e) => setZone(idx, e.target.value)}
                placeholder={`Zone ${idx + 1} …`}
              />
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={value.zones.length <= 1}
                onClick={() =>
                  onChange({
                    zones: value.zones.filter((_, i) => i !== idx),
                    items: value.items.map((it) => ({
                      ...it,
                      zoneIndex: it.zoneIndex === idx ? null : it.zoneIndex !== null && it.zoneIndex > idx ? it.zoneIndex - 1 : it.zoneIndex,
                    })),
                  })
                }
                title="Zone entfernen"
              >
                ✕
              </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => onChange({ ...value, zones: [...value.zones, { label: "" }] })}
            >
              + Zone
            </button>
          </div>
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <strong style={{ fontSize: 14 }}>Elemente → Zone zuordnen</strong>
          {value.items.map((it, idx) => (
            <div key={idx} className="row" style={{ gap: 6, alignItems: "center" }}>
              <input
                className="input"
                style={{ flex: 1 }}
                value={it.text}
                onChange={(e) => setItem(idx, { text: e.target.value })}
                placeholder={`Element ${idx + 1} …`}
              />
              <select
                className="input"
                style={{
                  maxWidth: 170,
                  borderLeft: `4px solid ${it.zoneIndex !== null ? ZONE_COLORS[it.zoneIndex % ZONE_COLORS.length] : "var(--ds-border)"}`,
                }}
                value={it.zoneIndex === null ? "" : String(it.zoneIndex)}
                onChange={(e) =>
                  setItem(idx, { zoneIndex: e.target.value === "" ? null : Number(e.target.value) })
                }
                title="Korrekte Zone"
              >
                <option value="">Zone wählen …</option>
                {value.zones.map((z, zi) => (
                  <option key={zi} value={zi}>
                    {z.label || `Zone ${zi + 1}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={value.items.length <= 1}
                onClick={() => onChange({ ...value, items: value.items.filter((_, i) => i !== idx) })}
                title="Element entfernen"
              >
                ✕
              </button>
            </div>
          ))}
          <div>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => onChange({ ...value, items: [...value.items, { text: "", zoneIndex: null }] })}
            >
              + Element
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Order ─────────────────────────────────────────────────────────────
export function OrderEditor({
  value,
  onChange,
}: {
  value: OrderFormState;
  onChange: (v: OrderFormState) => void;
}) {
  function move(idx: number, dir: -1 | 1) {
    const swap = idx + dir;
    if (swap < 0 || swap >= value.items.length) return;
    const items = [...value.items];
    [items[idx], items[swap]] = [items[swap], items[idx]];
    onChange({ items });
  }
  return (
    <div className="stack">
      <strong style={{ fontSize: 14 }}>Elemente in korrekter Reihenfolge</strong>
      {value.items.map((text, idx) => (
        <div key={idx} className="row" style={{ gap: 6, alignItems: "center" }}>
          <span className="badge badge--muted" style={{ minWidth: 26, textAlign: "center" }}>
            {idx + 1}
          </span>
          <input
            className="input"
            style={{ flex: 1 }}
            value={text}
            onChange={(e) =>
              onChange({ items: value.items.map((t, i) => (i === idx ? e.target.value : t)) })
            }
            placeholder={`Schritt ${idx + 1} …`}
          />
          <button type="button" className="btn btn--ghost btn--sm" disabled={idx === 0} onClick={() => move(idx, -1)} title="Nach oben">
            ↑
          </button>
          <button type="button" className="btn btn--ghost btn--sm" disabled={idx === value.items.length - 1} onClick={() => move(idx, 1)} title="Nach unten">
            ↓
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={value.items.length <= 2}
            onClick={() => onChange({ items: value.items.filter((_, i) => i !== idx) })}
            title="Element entfernen"
          >
            ✕
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => onChange({ items: [...value.items, ""] })}
        >
          + Element
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        Lernende sehen die Elemente in gemischter Reihenfolge.
      </p>
    </div>
  );
}
