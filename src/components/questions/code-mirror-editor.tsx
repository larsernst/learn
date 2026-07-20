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
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
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

// Schlichtes helles Theme, angelehnt an die Design-Tokens (DESIGN.md).
const theme = EditorView.theme(
  {
    "&": {
      fontSize: "13px",
      border: "1px solid #dddee1",
      borderRadius: "3px",
      backgroundColor: "#ffffff",
    },
    ".cm-content": {
      fontFamily: "ui-monospace, Menlo, Consolas, monospace",
      padding: "10px 0",
      minHeight: "220px",
    },
    ".cm-scroller": { overflow: "auto", maxHeight: "520px" },
    "&.cm-focused": { outline: "2px solid #1868db", outlineOffset: "-1px" },
    ".cm-gutters": {
      backgroundColor: "#f7f8f9",
      color: "#63666b",
      border: "none",
      borderRight: "1px solid #dddee1",
    },
  },
  { dark: false }
);

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
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
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

  return <div ref={parentRef} data-testid="code-mirror-editor" />;
}
