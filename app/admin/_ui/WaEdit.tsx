"use client";

/* "Edit message" for every WhatsApp send: the message the app wrote is shown in a box the
   staff can change, and "Send on WhatsApp" opens the chat with their version. Nothing is
   saved — the next send starts from the shop's wording again. */

import { useState } from "react";
import { Btn, Icon, Modal, WaIcon, cx } from "./kit";

/** The editor pop-up on its own, for flows that build the message first (e.g. after asking the server for a link). */
export function WaCompose({ text, title = "Edit WhatsApp message", to, onSend, onClose }: { text: string; title?: string; to?: string; onSend: (text: string) => unknown; onClose: () => void }) {
  const [draft, setDraft] = useState(text);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      await onSend(draft);
      onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Btn kind="plain" onClick={onClose}>
            Cancel
          </Btn>
          <Btn kind="plain" onClick={() => setDraft(text)} disabled={draft === text}>
            Reset
          </Btn>
          <Btn kind="green" onClick={send} disabled={!draft.trim() || busy}>
            <WaIcon size={15} /> Send on WhatsApp
          </Btn>
        </>
      }
    >
      {to && <p className="mb-2 text-[12.5px] text-slate-500">To {to}</p>}
      <textarea
        className="h-56 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-slate-900 outline-none focus:border-slate-400"
        value={draft}
        maxLength={2000}
        onChange={(e) => setDraft(e.target.value)}
        aria-label="WhatsApp message"
      />
      <p className="mt-1.5 text-[11.5px] text-slate-400">Change anything you like — only this message is affected. *Stars* make text bold on WhatsApp.</p>
    </Modal>
  );
}

/** A small ✏️ button that sits next to a WhatsApp button and opens the message for editing first. */
export function WaEdit({ text, to, onSend, label, className, disabled }: { text: string | (() => string); to?: string; onSend: (text: string) => unknown; label?: string; className?: string; disabled?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(typeof text === "function" ? text() : text)}
        title="Edit the message before sending"
        aria-label="Edit WhatsApp message"
        className={cx(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-45",
          label ? "h-9 px-3" : "h-9 w-9",
          className,
        )}
      >
        <Icon name="edit" size={15} />
        {label}
      </button>
      {open !== null && <WaCompose text={open} to={to} onSend={onSend} onClose={() => setOpen(null)} />}
    </>
  );
}

/** Opens a WhatsApp chat in a new tab (wa.me / api links are built by the caller). */
export const openWa = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
