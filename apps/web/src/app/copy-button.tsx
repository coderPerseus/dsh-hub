"use client";

import { useState } from "react";

export function CopyButton({
  copiedLabel = "已复制",
  copyLabel = "复制",
  value,
}: {
  copiedLabel?: string;
  copyLabel?: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard can be blocked in non-secure or automated contexts.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button className="copy-button" onClick={copy} type="button">
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
