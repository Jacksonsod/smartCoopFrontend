import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import ResponsiveTable from "@/components/shared/ResponsiveTable";

const currency = value => new Intl.NumberFormat('en-RW', {
  style: 'currency', currency: 'RWF', maximumFractionDigits: 0,
}).format(Number(value) || 0);
const date = value => {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }).format(parsed)
    : '—';
};

export function PaymentStatus({ status = 'PENDING' }) {
  const { t } = useTranslation();
  const value = String(status).toUpperCase();
  const styles = {
    PAID: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
    COMPLETED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
    FAILED: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400',
    PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
  };
  return <Badge variant="outline" className={styles[value]}>{t('status.' + value, value)}</Badge>;
}

// Rendering only: callers own requests, role authorization, scope and actions.
export default function PaymentTable({ payments, columns, renderActions, renderDetails, processingId, legacy = false }) {
  const { t } = useTranslation();
  const definitions = {
    member: { label: t('payments.col.member'), render: p => <span className="font-semibold">{p.memberName || p.memberUsername || '—'}</span> },
    item: { label: t('common.type'), render: p => p.itemName || '—' },
    quantity: { label: t('activities.col.quantity'), render: p => p.metricValue ?? '—' },
    amount: { label: t('payments.col.amount'), render: p => currency(p.amount ?? p.totalAmount ?? p.revenue) },
    phone: { label: t('payments.col.phone'), render: p => p.phoneNumber || p.phone || '—' },
    date: { label: t('payments.col.date'), render: p => date(p.date || p.createdAt || p.paymentDate) },
    status: { label: t('payments.col.status'), render: p => <><PaymentStatus status={p.status || 'PENDING'} />{renderDetails?.(p)}</> },
  };
  const selected = columns.map(key => ({ key, ...definitions[key] }));
  return <>
    <div className={legacy ? '' : 'hidden md:block'}>
      <ResponsiveTable minWidth="700px" className="rounded-xl border bg-card">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/50"><tr>{selected.map(column => <th key={column.key} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{column.label}</th>)}{renderActions && <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{t('common.actions')}</th>}</tr></thead>
          <tbody>{payments.map(payment => <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/20" aria-busy={processingId === payment.id}>
            {selected.map(column => <td key={column.key} className="px-4 py-3 align-top">{column.render(payment)}</td>)}
            {renderActions && <td className="px-4 py-3 align-top">{renderActions(payment)}</td>}
          </tr>)}</tbody>
        </table>
      </ResponsiveTable>
    </div>
    {!legacy && <div className="grid gap-4 md:hidden">{payments.map(payment => <article key={payment.id} aria-busy={processingId === payment.id} className="rounded-xl border bg-card p-4 space-y-4">
      <dl className="grid grid-cols-2 gap-3">{selected.map(column => <div key={column.key} className="min-w-0"><dt className="text-xs text-muted-foreground">{column.label}</dt><dd className="mt-1 break-words text-sm">{column.render(payment)}</dd></div>)}</dl>
      {renderActions && <div className="border-t pt-3">{renderActions(payment)}</div>}
    </article>)}</div>}
  </>;
}
