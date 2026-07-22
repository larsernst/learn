"use client";

import { useRef, useState } from "react";
import { Markdown } from "@/components/markdown";

export interface MarkdownFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}

// Textarea mit Markdown-Werkzeugleiste und Live-Vorschau (echter Renderer).
export function MarkdownField({ label, value, onChange, rows = 3, placeholder }: MarkdownFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  function wrapSelection(before: string, after: string, fallback = "Text") {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || fallback;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function insertBlock(block: string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? value.length;
    const prefix = start > 0 && value[start - 1] !== "\n" ? "\n\n" : "";
    const next = value.slice(0, start) + prefix + block + value.slice(ta.selectionEnd ?? start);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + prefix.length + block.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function codeBlock() {
    const lang = window.prompt("Sprache für den Codeblock (z. B. python, java, c, bash):", "python");
    if (lang === null) return;
    insertBlock("```" + lang + "\n// Code hier\n```\n");
  }

  const tools: { title: string; label: string; action: () => void }[] = [
    { title: "Fett", label: "B", action: () => wrapSelection("**", "**") },
    { title: "Kursiv", label: "I", action: () => wrapSelection("*", "*") },
    { title: "Inline-Code", label: "<>", action: () => wrapSelection("`", "`", "code") },
    { title: "Codeblock", label: "{ }", action: codeBlock },
    { title: "Link", label: "🔗", action: () => wrapSelection("[", "](https://)", "Linktext") },
    { title: "Liste", label: "•", action: () => insertBlock("- Punkt eins\n- Punkt zwei\n") },
    {
      title: "Tabelle",
      label: "⊞",
      action: () => insertBlock("| Spalte 1 | Spalte 2 |\n|---|---|\n| Wert | Wert |\n"),
    },
    { title: "Formel inline (KaTeX)", label: "∑", action: () => wrapSelection("$", "$", "x^2") },
    {
      title: "Formel block (KaTeX)",
      label: "∫",
      action: () => insertBlock("$$\n\\frac{a}{b} = c\n$$\n"),
    },
  ];

  return (
    <div className="field">
      <div className="row row--between" style={{ alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        <label style={{ margin: 0 }}>{label}</label>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          style={{ fontSize: 11, padding: "2px 8px" }}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? "Vorschau aus" : "Vorschau"}
        </button>
      </div>
      <div className="row" style={{ gap: 2, flexWrap: "wrap", margin: "4px 0" }}>
        {tools.map((t) => (
          <button
            key={t.title}
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ padding: "2px 8px", fontSize: 12, minWidth: 28 }}
            title={t.title}
            onClick={t.action}
          >
            {t.label}
          </button>
        ))}
        <details style={{ marginLeft: "auto", fontSize: 12 }}>
          <summary className="muted" style={{ cursor: "pointer" }}>KaTeX-Hilfe</summary>
          <div className="muted text-xs" style={{ padding: 8, border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius)", marginTop: 4 }}>
            Inline: <code>$x^2$</code> · Block: <code>$$…$$</code> · Bruch: <code>\frac{"{a}{b}"}</code> ·
            Wurzel: <code>\sqrt{"{x}"}</code> · Summe: <code>\sum_{"{i=1}"}^n</code> · Griechisch: <code>\alpha \beta \pi</code>
          </div>
        </details>
      </div>
      <textarea
        ref={ref}
        className="textarea"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ fontFamily: "monospace", fontSize: 13 }}
      />
      {showPreview && value.trim() && (
        <div
          style={{
            border: "1px solid var(--ds-border)",
            borderRadius: "var(--ds-radius)",
            padding: 12,
            marginTop: 6,
            background: "var(--ds-surface, #fff)",
          }}
        >
          <span className="eyebrow" style={{ fontSize: 10, display: "block", marginBottom: 4 }}>
            Vorschau
          </span>
          <Markdown source={value} />
        </div>
      )}
    </div>
  );
}
