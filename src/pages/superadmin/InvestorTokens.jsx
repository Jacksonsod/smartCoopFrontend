import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
export default function InvestorTokens() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ label: '', scope: 'AGGREGATE_ONLY', cooperativeId: '', expiresAt: '' });
  const [issued, setIssued] = useState(null);
  const [revokeId, setRevokeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const locked = useRef(false);
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  async function issue(e) {
    e.preventDefault();
    if (locked.current) return;
    if (form.expiresAt && new Date(form.expiresAt) <= new Date()) { setMessage('investors.future'); return; }
    locked.current = true; setBusy(true); setMessage(''); setIssued(null);
    try {
      const payload = { label: form.label.trim(), scope: form.scope, expiresAt: form.expiresAt ? form.expiresAt + ':00' : null };
      if (form.scope === 'FULL_TRANSACTION_TRAIL') payload.cooperativeId = Number(form.cooperativeId);
      const { data } = await api.post('/admin/investor-tokens', payload);
      setIssued(data); setRevokeId(String(data.id));
    } catch { setMessage('investors.issueError'); }
    finally { locked.current = false; setBusy(false); }
  }
  async function revoke(e) {
    e.preventDefault();
    if (locked.current || !window.confirm(t('investors.confirm', { id: revokeId }))) return;
    locked.current = true; setBusy(true); setMessage('');
    try { await api.delete(`/admin/investor-tokens/${revokeId}/revoke`); if (String(issued?.id) === revokeId) setIssued(null); setMessage('investors.revoked'); }
    catch { setMessage('investors.revokeError'); }
    finally { locked.current = false; setBusy(false); }
  }
  const field = 'block w-full rounded border bg-background p-2 mt-1';
  return <div className="space-y-6 max-w-3xl">
    <PageHeader title={t('investors.title')} subtitle={t('investors.subtitle')} />
    {message && <p role="status" className="rounded border p-3">{t(message)}</p>}
    <form onSubmit={issue} className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="font-semibold">{t('investors.issue')}</h2>
      <label className="block">{t('investors.label')}<input className={field} name="label" required maxLength={255} value={form.label} onChange={change} /></label>
      <label className="block">{t('investors.scope')}<select className={field} name="scope" value={form.scope} onChange={change}><option value="AGGREGATE_ONLY">{t('investors.aggregate')}</option><option value="FULL_TRANSACTION_TRAIL">{t('investors.full')}</option></select></label>
      {form.scope === 'FULL_TRANSACTION_TRAIL' && <label className="block">{t('investors.cooperative')}<input className={field} type="number" min="1" step="1" name="cooperativeId" required value={form.cooperativeId} onChange={change} /></label>}
      <label className="block">{t('investors.expiry')}<input className={field} type="datetime-local" name="expiresAt" value={form.expiresAt} onChange={change} /></label>
      <Button disabled={busy || !!issued} type="submit">{t('investors.issue')}</Button>
    </form>
    {issued && <section className="rounded-xl border border-gold bg-card p-5 space-y-3" aria-live="polite">
      <p className="font-semibold">{t('investors.once')}</p><p>{t('investors.id')}: <strong>{issued.id}</strong></p>
      <code className="block break-all select-all">{issued.rawToken}</code>
      <div className="flex gap-2"><Button onClick={async () => { try { await navigator.clipboard.writeText(issued.rawToken); setMessage('investors.copied'); } catch { setMessage('investors.copyError'); } }}>{t('investors.copy')}</Button><Button variant="outline" onClick={() => setIssued(null)}>{t('investors.dismiss')}</Button></div>
    </section>}
    <form onSubmit={revoke} className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="font-semibold">{t('investors.revoke')}</h2><p className="text-sm text-muted-foreground">{t('investors.stopgap')}</p>
      <label className="block">{t('investors.id')}<input className={field} type="number" min="1" step="1" required value={revokeId} onChange={e => setRevokeId(e.target.value)} /></label>
      <Button type="submit" variant="destructive" disabled={busy}>{t('investors.revoke')}</Button>
    </form>
  </div>;
}
