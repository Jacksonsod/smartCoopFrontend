import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
export default function BillingToggle({ cooperative, onSaved }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const locked = useRef(false);
  async function toggle() {
    if (locked.current) return;
    const next = !cooperative.isPayingCustomer;
    if (!window.confirm(t('billing.confirm', { name: cooperative.name, status: t(next ? 'billing.paying' : 'billing.notPaying') }))) return;
    locked.current = true; setBusy(true); setError(false);
    try {
      const { data } = await api.patch(`/admin/cooperatives/${cooperative.id}/billing-status`, { isPayingCustomer: next });
      onSaved(typeof data.isPayingCustomer === 'boolean' ? data.isPayingCustomer : next);
    } catch { setError(true); }
    finally { locked.current = false; setBusy(false); }
  }
  return <div><button type="button" role="switch" aria-checked={cooperative.isPayingCustomer} aria-label={t('billing.label', { name: cooperative.name })} disabled={busy} onClick={toggle} className="rounded-full border px-3 py-1 font-medium disabled:opacity-50 aria-checked:bg-terrace aria-checked:text-white">{busy ? t('common.loading') : t(cooperative.isPayingCustomer ? 'billing.paying' : 'billing.notPaying')}</button>{error && <p role="alert" className="mt-1 text-cherry">{t('billing.error')}</p>}</div>;
}
