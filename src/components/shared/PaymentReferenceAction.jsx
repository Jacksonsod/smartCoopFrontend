import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PaymentReferenceAction({ paymentId, busy, disabled, onConfirm }) {
  const { t } = useTranslation();
  const inputId = useId();
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const locked = useRef(false);
  const waiting = busy || submitting;
  async function submit(event) {
    event.preventDefault();
    const value = reference.trim();
    if (!value || disabled || waiting || locked.current) return;
    locked.current = true;
    setSubmitting(true);
    try { await onConfirm(value); }
    finally { locked.current = false; setSubmitting(false); }
  }
  return <form onSubmit={submit} className="min-w-48 max-w-xs space-y-2 text-left">
    <label htmlFor={inputId} className="block text-xs font-medium">{t('paymentReference.label')}</label>
    <Input id={inputId} required value={reference} onChange={e => setReference(e.target.value)} disabled={waiting || disabled} placeholder={t('paymentReference.placeholder')} autoComplete="off" />
    <Button type="submit" id={`btn-approve-payout-${paymentId}`} size="sm" disabled={waiting || disabled || !reference.trim()}>
      {waiting ? t('common.loading') : t('paymentReference.markPaid')}
    </Button>
  </form>;
}
