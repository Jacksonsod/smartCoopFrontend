import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getReportSummary } from "@/services/api";
import { Button } from "@/components/ui/button";
const empty = { fromDate: "", toDate: "", status: "", itemId: "", memberId: "" };
export default function ReportSummary({ items, members }) {
  const { t, i18n } = useTranslation();
  const [draft, setDraft] = useState(empty);
  const [filters, setFilters] = useState(empty);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false); setSummary(null);
    getReportSummary(filters).then(({ data }) => { if (active) setSummary(data); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);
  const change = e => setDraft(current => ({ ...current, [e.target.name]: e.target.value }));
  return <section className="rounded-xl border bg-card p-5 space-y-4" aria-labelledby="report-heading">
    <h2 id="report-heading" className="font-semibold">{t('report.title')}</h2>
    <p className="text-sm text-muted-foreground">{t('report.scope')}</p>
    <form onSubmit={e => { e.preventDefault(); setFilters({ ...draft }); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {['fromDate', 'toDate'].map(name => <label key={name} className="text-sm space-y-1">{t('report.' + name)}<input className="block w-full rounded border bg-background p-2" type="date" name={name} value={draft[name]} onChange={change} min={name === 'toDate' ? draft.fromDate : undefined} max={name === 'fromDate' ? draft.toDate : undefined} /></label>)}
      <label className="text-sm space-y-1">{t('report.status')}<select className="block w-full rounded border bg-background p-2" name="status" value={draft.status} onChange={change}><option value="">{t('report.all')}</option>{['PENDING','UNPROCESSED','APPROVED','REJECTED','PAID'].map(s => <option key={s} value={s}>{t('status.' + s, s)}</option>)}</select></label>
      {[['itemId', items, 'item'], ['memberId', members, 'member']].map(([name, options, label]) => <label key={name} className="text-sm space-y-1">{t('report.' + label)}<select className="block w-full rounded border bg-background p-2" name={name} value={draft[name]} onChange={change}><option value="">{t('report.all')}</option>{options.map(o => <option key={o.id} value={o.id}>{o.name || o.fullName || o.username || o.id}</option>)}</select></label>)}
      <div className="flex gap-2"><Button disabled={loading} type="submit">{t('report.apply')}</Button><Button type="button" variant="outline" disabled={loading} onClick={() => { setDraft(empty); setFilters({ ...empty }); }}>{t('report.reset')}</Button></div>
    </form>
    <div aria-live="polite" aria-busy={loading}>
      {loading && <p>{t('common.loading')}</p>}
      {error && <p role="alert" className="text-cherry">{t('report.error')}</p>}
      {summary && <dl className="grid gap-4 sm:grid-cols-3">{['totalActivities','totalRevenue','pendingPaymentsAmount'].map(key => <div key={key}><dt className="text-sm text-muted-foreground">{t('report.' + key)}</dt><dd className="text-2xl font-semibold">{new Intl.NumberFormat(i18n.language, key === 'totalActivities' ? {} : { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(summary[key] ?? 0)}</dd></div>)}</dl>}
    </div>
  </section>;
}
