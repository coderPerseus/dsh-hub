"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import type { Messages } from "../lib/i18n/messages";
import { submitRepository, type SubmissionActionState } from "./submission-action";

const initialState: SubmissionActionState = { status: "idle" };

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function SubmitButton({ labels }: { labels: Messages["submission"] }) {
  const { pending } = useFormStatus();
  return (
    <button className="submission-submit" disabled={pending} type="submit">
      <span>{pending ? labels.submitting : labels.submit}</span>
      <ArrowIcon />
    </button>
  );
}

export function SubmissionDialog({
  labels,
  onClose,
}: {
  labels: Messages["submission"];
  onClose: () => void;
}) {
  const [state, action] = useActionState(submitRepository, initialState);
  const completed = ["accepted", "duplicate", "already_indexed"].includes(state.status);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const resultCopy = state.status === "accepted"
    ? { body: labels.acceptedBody, title: labels.acceptedTitle }
    : state.status === "duplicate"
      ? { body: labels.duplicateBody, title: labels.duplicateTitle }
      : { body: labels.indexedBody, title: labels.indexedTitle };

  return (
    <div
      className="submission-backdrop"
      onMouseDown={event => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section aria-labelledby="submission-title" aria-modal="true" className="submission-dialog" role="dialog">
        <button aria-label={labels.close} className="submission-close" onClick={onClose} type="button">
          <span aria-hidden="true">×</span>
        </button>
        <div className="submission-signal" aria-hidden="true">
          <span>GH</span>
          <i />
          <span>DSH</span>
        </div>

        {completed ? (
          <div className="submission-result" aria-live="polite">
            <span className="submission-result-mark" aria-hidden="true">✓</span>
            <p className="submission-eyebrow">{labels.resultEyebrow}</p>
            <h2 id="submission-title">{resultCopy.title}</h2>
            <p>{resultCopy.body}</p>
            {state.repositoryUrl && <code>{state.repositoryUrl}</code>}
            <button className="submission-finish" onClick={onClose} type="button">{labels.finish}</button>
          </div>
        ) : (
          <>
            <p className="submission-eyebrow">{labels.eyebrow}</p>
            <h2 id="submission-title">{labels.title}</h2>
            <p className="submission-description">{labels.description}</p>
            <form action={action} className="submission-form">
              <label htmlFor="repository-url">{labels.inputLabel}</label>
              <div className="submission-input-wrap">
                <span aria-hidden="true">github.com/</span>
                <input
                  autoCapitalize="none"
                  autoComplete="url"
                  autoCorrect="off"
                  autoFocus
                  id="repository-url"
                  maxLength={300}
                  name="repositoryUrl"
                  placeholder={labels.placeholder}
                  required
                  spellCheck={false}
                  type="url"
                />
              </div>
              <p className="submission-hint">{labels.hint}</p>
              {state.status === "invalid" && <p className="submission-error" role="alert">{labels.invalid}</p>}
              {state.status === "error" && <p className="submission-error" role="alert">{labels.error}</p>}
              <SubmitButton labels={labels} />
            </form>
          </>
        )}
      </section>
    </div>
  );
}
