"use client";

import type { McqPublic } from "@/lib/tasks/mcq/payload";

export interface McqRendererProps {
  options: McqPublic["options"];
  selectionMode: "single" | "multi";
  selected: string[];
  disabled: boolean;
  correctIds: string[] | null;
  revealed: boolean;
  onToggle: (id: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  emptyLabel?: string;
}

export function McqRenderer(props: McqRendererProps) {
  const isSingle = props.selectionMode === "single";
  const selectionCount = props.selected.length;
  const inputType = isSingle ? "radio" : "checkbox";
  const submitLabel = props.submitLabel ?? "Auswerten";
  const emptyLabel = props.emptyLabel ?? "Bitte Optionen wählen";
  return (
    <>
      <p className="muted text-sm">
        {isSingle
          ? "Wähle die richtige Antwort."
          : "Mehrere Antworten sind richtig. Wähle alle zutreffenden aus."}
      </p>
      <div className="stack">
        {props.options.map((o) => {
          const checked = props.selected.includes(o.id);
          const isCorrect = props.correctIds?.includes(o.id) ?? false;
          let cls = "mcq-option";
          if (props.revealed) {
            if (isCorrect) cls += " mcq-option--correct";
            else if (checked) cls += " mcq-option--wrong";
          } else if (checked) {
            cls += " mcq-option--selected";
          }
          return (
            <label
              key={o.id}
              className={cls}
              role={isSingle ? "radio" : "checkbox"}
              aria-checked={checked}
            >
              <input
                type={inputType}
                name={isSingle ? "mcq-single" : undefined}
                checked={checked}
                disabled={props.disabled}
                onChange={() => props.onToggle(o.id)}
                tabIndex={0}
              />
              <span>{o.text}</span>
            </label>
          );
        })}
      </div>
      {!props.revealed ? (
        <button
          className="btn btn--primary"
          onClick={props.onSubmit}
          disabled={props.disabled || selectionCount === 0}
        >
          {selectionCount === 0 ? emptyLabel : submitLabel}
        </button>
      ) : null}
    </>
  );
}
