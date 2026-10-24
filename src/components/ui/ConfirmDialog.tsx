"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={body}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-[var(--color-surface-container)] p-3.5">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
        <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
          This action updates local practice data only. Nothing is sent to a server.
        </p>
      </div>
    </Modal>
  );
}
