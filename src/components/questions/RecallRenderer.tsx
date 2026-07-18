"use client";

import type { ReviewGrade } from "@/lib/sm2";

export type GradeButtonConfig = {
  grade: ReviewGrade;
  label: string;
  subtitle: string;
  modifier?: "again" | "good";
  ariaLabel: string;
};

const SIMPLE_GRADES: GradeButtonConfig[] = [
  { grade: "again", label: "Falsch", subtitle: "nochmal", modifier: "again", ariaLabel: "Falsch (Taste 1)" },
  { grade: "good", label: "Richtig", subtitle: "gewusst", modifier: "good", ariaLabel: "Richtig (Taste 2)" },
];

const FULL_GRADES: GradeButtonConfig[] = [
  { grade: "again", label: "Again", subtitle: "völlig falsch", modifier: "again", ariaLabel: "Again – völlig falsch (Taste 1)" },
  { grade: "hard", label: "Hard", subtitle: "mit Mühe", ariaLabel: "Hard – mit Mühe (Taste 2)" },
  { grade: "good", label: "Good", subtitle: "korrekt", modifier: "good", ariaLabel: "Good – korrekt (Taste 3)" },
  { grade: "easy", label: "Easy", subtitle: "mühelos", ariaLabel: "Easy – mühelos (Taste 4)" },
];

export interface RecallRendererProps {
  draft: string;
  onDraft: (v: string) => void;
  revealed: boolean;
  onReveal: () => void;
  submitting: boolean;
  onGrade: (g: ReviewGrade) => void;
  simpleGrading: boolean;
  selectedGrade?: ReviewGrade | null;
}

export function RecallRenderer(props: RecallRendererProps) {
  return (
    <>
      <div className="field">
        <label htmlFor="draft">Deine Antwort</label>
        <textarea
          id="draft"
          className="textarea"
          placeholder="Schreibe frei, woran du dich erinnerst …"
          value={props.draft}
          onChange={(e) => props.onDraft(e.target.value)}
        />
      </div>
      {!props.revealed ? (
        <button className="btn btn--primary" onClick={props.onReveal}>
          Musterantwort zeigen
        </button>
      ) : (
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            {props.simpleGrading ? "War deine Antwort richtig?" : "Wie gut warst du?"}
          </p>
          <div className="review-actions">
            {(props.simpleGrading ? SIMPLE_GRADES : FULL_GRADES).map((btn) => {
              const isSelected = props.selectedGrade === btn.grade;
              const cls = ["grade-btn"];
              if (btn.modifier) cls.push(`grade-btn--${btn.modifier}`);
              if (isSelected) cls.push("grade-btn--selected");
              return (
                <button
                  key={btn.grade}
                  className={cls.join(" ")}
                  disabled={props.submitting}
                  onClick={() => props.onGrade(btn.grade)}
                  aria-label={btn.ariaLabel}
                  aria-pressed={isSelected}
                >
                  {btn.label}
                  <small>{btn.subtitle}</small>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export { SIMPLE_GRADES, FULL_GRADES };
