"use client";

// CodeMirror-6-Einbindung für Code-Aufgaben. Wird ausschließlich dynamisch
// (ssr: false) aus CodeRenderer geladen – der Bundle-Preis (~150 kB gzip)
// fällt nur an, wenn eine Code-Aufgabe geöffnet wird.

import { useEffect, useRef } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine, placeholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import {
  bracketMatching,
  defaultHighlightStyle,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { closeBrackets } from "@codemirror/autocomplete";
import { Compartment, type Extension } from "@codemirror/state";

// Judge0-Language-ID → CodeMirror-Sprachpaket (lazy, damit nur die
// tatsächlich genutzte Sprache im Chunk landet).
async function languageFor(languageId: number): Promise<Extension> {
  switch (languageId) {
    case 54: // C++ (G++)
    case 50: // C (GCC)
      return (await import("@codemirror/lang-cpp")).cpp();
    case 71: // Python 3
      return (await import("@codemirror/lang-python")).python();
    case 63: // JavaScript (Node.js)
      return (await import("@codemirror/lang-javascript")).javascript();
    case 62: // Java
      return (await import("@codemirror/lang-java")).java();
    default: // Bash u. a.: kein Highlighting
      return [];
  }
}

function isDarkTheme(): boolean {
  return document.documentElement.dataset.theme !== "light";
}

// Syntax-Farben fürs Dark-Theme (github-dark-Palette, analog zum
// Markdown-Highlighting). Das Light-Theme nutzt defaultHighlightStyle.
const darkHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.operator, t.modifier], color: "#ff7b72" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "#a5d6ff" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "#79c0ff" },
  { tag: t.comment, color: "#8b949e", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#d2a8ff" },
  { tag: [t.typeName, t.className, t.tagName], color: "#ffa657" },
  { tag: [t.propertyName, t.attributeName], color: "#79c0ff" },
  { tag: t.variableName, color: "#e6edf3" },
]);

function highlightForTheme(): Extension {
  return syntaxHighlighting(isDarkTheme() ? darkHighlight : defaultHighlightStyle, {
    fallback: true,
  });
}

// Editor-Chrome komplett über Design-Tokens – folgt dem Theme automatisch.
const theme = EditorView.theme({
  "&": {
    fontSize: "13px",
    border: "1px solid var(--ds-border)",
    borderRadius: "3px",
    backgroundColor: "var(--ds-background-canvas)",
    color: "var(--ds-ink)",
  },
  ".cm-content": {
    fontFamily: "ui-monospace, Menlo, Consolas, monospace",
    padding: "10px 0",
    minHeight: "220px",
    caretColor: "var(--ds-ink)",
  },
  ".cm-scroller": { overflow: "auto", maxHeight: "520px" },
  "&.cm-focused": { outline: "2px solid var(--ds-link)", outlineOffset: "-1px" },
  ".cm-gutters": {
    backgroundColor: "var(--ds-surface)",
    color: "var(--ds-text-subtlest)",
    border: "none",
    borderRight: "1px solid var(--ds-border)",
  },
  ".cm-activeLine": { backgroundColor: "var(--ds-surface-selected)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--ds-surface-selected)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "color-mix(in srgb, var(--ds-brand) 30%, transparent)",
  },
  ".cm-cursor": { borderLeftColor: "var(--ds-ink)" },
});

export interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  languageId: number;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function CodeMirrorEditor({
  value,
  onChange,
  languageId,
  disabled = false,
  ariaLabel = "Quellcode-Editor",
}: CodeMirrorEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  // Refs für Werte, die der Editor ohne Neuerstellung sehen soll.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  const editableCompartment = useRef(new Compartment());
  const highlightCompartment = useRef(new Compartment());

  // Editor einmal pro Sprache aufbauen (Sprachpaket ist statisch geladen).
  useEffect(() => {
    let cancelled = false;
    let view: EditorView | null = null;

    (async () => {
      const language = await languageFor(languageId);
      if (cancelled || !parentRef.current) return;
      view = new EditorView({
        state: EditorState.create({
          doc: valueRef.current,
          extensions: [
            lineNumbers(),
            highlightActiveLine(),
            history(),
            indentOnInput(),
            bracketMatching(),
            closeBrackets(),
            highlightCompartment.current.of(highlightForTheme()),
            language,
            theme,
            placeholder("// Hier deine Lösung …"),
            editableCompartment.current.of(EditorView.editable.of(!disabled)),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                onChangeRef.current(update.state.doc.toString());
              }
            }),
            EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
            keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          ],
        }),
        parent: parentRef.current,
      });
      viewRef.current = view;
    })();

    return () => {
      cancelled = true;
      view?.destroy();
      viewRef.current = null;
    };
    // disabled/value bewusst NICHT als Dependency (eigene Effects unten).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageId]);

  // Externe Wertänderungen (z. B. Sprachwechsel → Starter-Code) übernehmen,
  // ohne bei jeder eigenen Eingabe zu dispatchen.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  // Disabled-Status ohne Editor-Neubau umschalten.
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: editableCompartment.current.reconfigure(EditorView.editable.of(!disabled)),
    });
  }, [disabled]);

  // Theme-Wechsel (data-theme auf <html>): nur Syntax-Farben neu konfigurieren,
  // das Editor-Chrome folgt über CSS-Variablen von selbst.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      viewRef.current?.dispatch({
        effects: highlightCompartment.current.reconfigure(highlightForTheme()),
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return <div ref={parentRef} data-testid="code-mirror-editor" />;
}
