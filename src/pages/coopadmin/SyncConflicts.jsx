import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
function parsePayload(value) { try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return value; } }
function Conflict({ entry, onResolved }) {
  const { t } = useTranslation();
  const payload = parsePayload(entry.entityPayload);
  const [resolution, setResolution] = useState('KEEP_SERVER');
  const [merged, setMerged] = useState(JSON.stringify(payload, null, 2) ?? '{}');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  async function resolve(e) {
    e.preventDefault(); if (locked.current) return;
    const body = { resolutionType: resolution };
    if (resolution === 'MERGE') {
      try { const value = JSON.parse(merged); if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(); body.mergedPayload = value; }
      catch { setError('conflicts.invalid'); return; }
    }
    if (!window.confirm(t('conflicts.confirm', { id: entry.id, resolution: t('conflicts.' + resolution) }))) return;
    locked.current = true; setBusy(true); setError('');
    try { await api.post(`/sync/conflicts/${entry.id}/resolve`, body); onResolved(entry.id); }
    catch { setError('conflicts.resolveError'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <article className="rounded-xl border bg-card p-5 space-y-4">
    <h2 className="font-semibold">{t('conflicts.entry', { id: entry.id })} · {entry.entityType}</h2>
    <div className="grid gap-4 md:grid-cols-2">
      <section className="min-w-0"><h3 className="font-medium mb-2">{t('conflicts.server')}</h3><p className="rounded border p-3 text-sm">{t('conflicts.unavailable', { id: entry.conflictWithEntityId ?? '—' })}</p></section>
      <section className="min-w-0"><h3 className="font-medium mb-2">{t('conflicts.client')}</h3><pre className="rounded border bg-muted p-3 text-xs whitespace-pre-wrap break-all max-h-80 overflow-auto">{JSON.stringify(payload, null, 2)}</pre></section>
    </div>
    <form onSubmit={resolve} className="space-y-3">
      <label className="block">{t('conflicts.resolution')}<select className="block rounded border bg-background p-2 mt-1" value={resolution} onChange={e => setResolution(e.target.value)} disabled={busy}>{['KEEP_SERVER','KEEP_CLIENT','MERGE'].map(value => <option key={value} value={value}>{t('conflicts.' + value)}</option>)}</select></label>
      {resolution === 'MERGE' && <label className="block">{t('conflicts.merged')}<textarea className="block w-full rounded border bg-background p-3 font-mono text-sm mt-1" rows={10} value={merged} onChange={e => setMerged(e.target.value)} disabled={busy} /></label>}
      {error && <p role="alert" className="text-cherry">{t(error)}</p>}
      <Button disabled={busy} type="submit">{busy ? t('common.loading') : t('conflicts.resolve')}</Button>
    </form>
  </article>;
}
export default function SyncConflicts() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [resolved, setResolved] = useState(false);
  useEffect(() => { let active = true; setLoading(true); setError(false);
    api.get('/sync/conflicts').then(({ data }) => { if (!Array.isArray(data)) throw Error(); if (active) setEntries(data); })
      .catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  return <div className="space-y-5"><PageHeader title={t('conflicts.title')} actions={<Button variant="outline" disabled={loading} onClick={() => setRevision(r => r + 1)}>{t('conflicts.refresh')}</Button>} />
    {resolved && <p role="status">{t('conflicts.saved')}</p>}
    {loading ? <p>{t('common.loading')}</p> : error ? <p role="alert" className="text-cherry">{t('conflicts.loadError')}</p> : entries.length === 0 ? <p className="rounded-xl border p-8 text-center">{t('conflicts.empty')}</p> : entries.map(entry => <Conflict key={entry.id} entry={entry} onResolved={id => { setEntries(rows => rows.filter(row => row.id !== id)); setResolved(true); }} />)}
  </div>;
}
