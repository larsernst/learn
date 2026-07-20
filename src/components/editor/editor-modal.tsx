"use client";

import { useEffect, type ReactNode } from "react";

// Modal-Wrapper für den Fragen-Editor: zentrierte Dialog-Fläche mit
// Backdrop, Escape-Schließen und Scroll-Sperre im Hintergrund.
export function EditorModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.classList.add("editor-modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("editor-modal-open");
    };
  }, [onClose]);

  return (
    <div className="editor-modal-backdrop" onClick={onClose}>
      <div
        className="editor-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="editor-modal__header">
          <strong>{title}</strong>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
