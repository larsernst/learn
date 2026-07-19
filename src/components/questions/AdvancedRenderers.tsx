"use client";

import { useState } from "react";
import type { DragDropPublic } from "@/lib/tasks/dragdrop/payload";
import type { ClozePublic } from "@/lib/tasks/cloze/payload";
import type { OrderPublic } from "@/lib/tasks/order/payload";

// ──────────────────────────────────────────────────────────────────────
// Drag&Drop / Zuordnen: Lerner wählt ein Item, dann eine Zone. Mobile-
// freundlich (Klick statt HTML5-DnD). Status via Selected-Item-State.
// ──────────────────────────────────────────────────────────────────────
export interface DragDropRendererProps {
  payload: DragDropPublic;
  assignment: Record<string, string>;
  onAssignmentChange: (assignment: Record<string, string>) => void;
  revealed: boolean;
  correctAssignment?: Record<string, string> | null;
  onSubmit: () => void;
}

export function DragDropRenderer(props: DragDropRendererProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const assignedItemIds = new Set(Object.values(props.assignment));
  const unassignedItems = props.payload.items.filter((i) => !assignedItemIds.has(i.id));

  function assignItem(zoneId: string) {
    if (!selectedItem) return;
    const next = { ...props.assignment, [selectedItem]: zoneId };
    props.onAssignmentChange(next);
    setSelectedItem(null);
  }

  function unassign(itemId: string) {
    const next = { ...props.assignment };
    delete next[itemId];
    props.onAssignmentChange(next);
  }

  return (
    <>
      <p className="muted" style={{ fontSize: 14 }}>
        Wähle erst ein Element, dann die Zielzone.{" "}
        {unassignedItems.length > 0 &&
          `Noch ${unassignedItems.length} von ${props.payload.items.length} zuzuordnen.`}
      </p>
      <div className="stack">
        {unassignedItems.length > 0 && (
          <div className="card" style={{ padding: 12 }}>
            <span className="eyebrow" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
              Verfügbare Elemente
            </span>
            <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
              {unassignedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`btn btn--sm${selectedItem === item.id ? " btn--primary" : " btn--secondary"}`}
                  onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {props.payload.zones.map((zone) => {
          const itemsInZone = Object.entries(props.assignment)
            .filter(([, z]) => z === zone.id)
            .map(([itemId]) => props.payload.items.find((i) => i.id === itemId))
            .filter(Boolean) as { id: string; text: string }[];

          return (
            <div
              key={zone.id}
              className="card"
              style={{
                padding: 12,
                cursor: selectedItem ? "pointer" : "default",
                borderColor: selectedItem ? "var(--ds-background-brand-bold)" : undefined,
              }}
              onClick={() => assignItem(zone.id)}
            >
              <strong style={{ fontSize: 14 }}>{zone.label}</strong>
              <div className="row" style={{ flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {itemsInZone.length === 0 ? (
                  <span className="muted" style={{ fontSize: 13 }}>
                    {selectedItem ? "Hier ablegen" : "leer"}
                  </span>
                ) : (
                  itemsInZone.map((item) => {
                    const isCorrect =
                      props.revealed &&
                      props.correctAssignment?.[item.id] === zone.id;
                    const isWrong =
                      props.revealed &&
                      props.correctAssignment?.[item.id] !== undefined &&
                      props.correctAssignment?.[item.id] !== zone.id;
                    return (
                      <span
                        key={item.id}
                        className={`badge${isCorrect ? " badge--success" : ""}${
                          isWrong ? " badge--warn" : " badge--muted"
                        }`}
                        style={{ fontSize: 12 }}
                      >
                        {item.text}
                        {!props.revealed && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              unassign(item.id);
                            }}
                            style={{
                              marginLeft: 6,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "inherit",
                            }}
                            aria-label={`Zuordnung für ${item.text} entfernen`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!props.revealed && (
        <button
          type="button"
          className="btn btn--primary"
          disabled={unassignedItems.length > 0}
          onClick={props.onSubmit}
        >
          {unassignedItems.length > 0 ? "Alle Elemente zuordnen" : "Auswerten"}
        </button>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Cloze / Lückentext: Inline-Eingabefelder im Textfluss.
// ──────────────────────────────────────────────────────────────────────
export interface ClozeRendererProps {
  payload: ClozePublic;
  answers: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  revealed: boolean;
  perBlankCorrect?: boolean[] | null;
  onSubmit: () => void;
}

export function ClozeRenderer(props: ClozeRendererProps) {
  const blanks = props.payload.segments.filter((s) => s.kind === "blank");
  const allFilled = blanks.every((b) => (b.kind === "blank" ? (props.answers[b.blankId] ?? "").trim() !== "" : true));

  return (
    <>
      <p className="muted" style={{ fontSize: 14 }}>
        Fülle alle Lücken aus.
      </p>
      <div className="review-answer" style={{ lineHeight: 2.2 }}>
        {props.payload.segments.map((seg, i) => {
          if (seg.kind === "text") {
            return <span key={i}>{seg.text}</span>;
          }
          const value = props.answers[seg.blankId] ?? "";
          const idx = blanks.findIndex((b) => b.kind === "blank" && b.blankId === seg.blankId);
          const isCorrect = props.revealed && props.perBlankCorrect?.[idx] === true;
          const isWrong = props.revealed && props.perBlankCorrect?.[idx] === false;
          return (
            <input
              key={i}
              className="input"
              type="text"
              value={value}
              disabled={props.revealed}
              placeholder={seg.placeholder ?? ""}
              onChange={(e) =>
                props.onAnswersChange({ ...props.answers, [seg.blankId]: e.target.value })
              }
              style={{
                display: "inline-block",
                width: "auto",
                minWidth: 80,
                margin: "0 4px",
                ...(isCorrect
                  ? { borderColor: "var(--ds-chart-green)", background: "rgba(34,160,107,0.1)" }
                  : isWrong
                  ? { borderColor: "var(--ds-chart-red)", background: "rgba(174,46,36,0.08)" }
                  : {}),
              }}
              aria-label={`Lücke ${idx + 1}`}
            />
          );
        })}
      </div>
      {!props.revealed && (
        <button
          type="button"
          className="btn btn--primary"
          disabled={!allFilled}
          onClick={props.onSubmit}
        >
          {allFilled ? "Auswerten" : "Alle Lücken ausfüllen"}
        </button>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Order / Sortieren: Liste mit Up/Down-Buttons zum Umsortieren.
// ──────────────────────────────────────────────────────────────────────
export interface OrderRendererProps {
  payload: OrderPublic;
  orderedIds: string[];
  onOrderChange: (orderedIds: string[]) => void;
  revealed: boolean;
  correctOrder?: string[] | null;
  onSubmit: () => void;
}

export function OrderRenderer(props: OrderRendererProps) {
  // Wenn noch nichts sortiert wurde, mit der Item-Reihenfolge initialisieren.
  const order = props.orderedIds.length === props.payload.items.length
    ? props.orderedIds
    : props.payload.items.map((i) => i.id);
  const itemsById = new Map(props.payload.items.map((i) => [i.id, i]));

  function move(idx: number, dir: -1 | 1) {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    props.onOrderChange(next);
  }

  return (
    <>
      <p className="muted" style={{ fontSize: 14 }}>
        Bringe die Elemente in die richtige Reihenfolge (oben = zuerst).
      </p>
      <ol className="stack" style={{ listStyle: "none", padding: 0, counterReset: "orderitem" }}>
        {order.map((id, idx) => {
          const item = itemsById.get(id);
          if (!item) return null;
          const isCorrect = props.revealed && props.correctOrder?.[idx] === id;
          const isWrong = props.revealed && props.correctOrder?.[idx] !== id;
          return (
            <li
              key={id}
              className="card"
              style={{
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                ...(isCorrect
                  ? { borderColor: "var(--ds-chart-green)", background: "rgba(34,160,107,0.06)" }
                  : isWrong
                  ? { borderColor: "var(--ds-chart-red)", background: "rgba(174,46,36,0.05)" }
                  : {}),
              }}
            >
              <span
                className="badge badge--muted"
                style={{ fontSize: 12, minWidth: 24, textAlign: "center" }}
              >
                {idx + 1}
              </span>
              <span style={{ flex: 1 }}>{item.text}</span>
              {!props.revealed && (
                <span className="row" style={{ gap: 4 }}>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={idx === 0}
                    onClick={() => move(idx, -1)}
                    aria-label="Nach oben"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={idx === order.length - 1}
                    onClick={() => move(idx, 1)}
                    aria-label="Nach unten"
                  >
                    ↓
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!props.revealed && (
        <button type="button" className="btn btn--primary" onClick={props.onSubmit}>
          Auswerten
        </button>
      )}
    </>
  );
}
