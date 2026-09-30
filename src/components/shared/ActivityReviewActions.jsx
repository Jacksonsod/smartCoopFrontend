import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { updateActivityStatus } from "@/services/activityService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ActivityReviewActions({ activity, onUpdated }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const status = String(activity.paymentStatus || activity.status || 'PENDING').toUpperCase();
  if (!['PENDING', 'UNPROCESSED'].includes(status)) return null;
  async function update(next) {
    if (locked.current || (next === 'REJECTED' && !reason.trim())) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const { data } = await updateActivityStatus(activity.id, next, next === 'REJECTED' ? reason.trim() : undefined);
      onUpdated(data); setOpen(false); setReason('');
    } catch (err) { setError(err.response?.status === 403 ? 'activityRoles.forbidden' : 'activityRoles.failed'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <div className="space-y-2">
    <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => update('APPROVED')}>{t('activityRoles.approve')}</Button><Button size="sm" variant="destructive" disabled={busy} onClick={() => { setError(''); setOpen(true); }}>{t('activityRoles.reject')}</Button></div>
    {error && !open && <p role="alert" className="max-w-xs whitespace-normal text-xs text-cherry">{t(error)}</p>}
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent><DialogHeader><DialogTitle>{t('activityRoles.reject')}</DialogTitle><DialogDescription>{t('activityRoles.reasonHelp')}</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); update('REJECTED'); }}>
        <label className="block">{t('activityRoles.reason')}<textarea required value={reason} onChange={e => setReason(e.target.value)} disabled={busy} rows={4} className="block w-full rounded border bg-background p-2 mt-2" /></label>
        {error && <p role="alert" className="text-cherry">{t(error)}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button type="submit" variant="destructive" disabled={busy || !reason.trim()}>{busy ? t('common.loading') : t('activityRoles.reject')}</Button></div>
      </form>
    </DialogContent></Dialog>
  </div>;
}
