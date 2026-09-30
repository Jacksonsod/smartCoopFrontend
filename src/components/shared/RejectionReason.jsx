import { useTranslation } from "react-i18next";
export default function RejectionReason({ activity, showStatus = false }) {
  const { t } = useTranslation();
  const rejected = [activity?.status, activity?.paymentStatus].some(s => String(s).toUpperCase() === 'REJECTED');
  if (!rejected) return null;
  const reason = activity.rejectionReason || activity.rejection_reason;
  return <div className="mt-1 max-w-sm whitespace-normal break-words text-xs text-cherry">
    {showStatus && <strong className="block">{t('status.REJECTED')}</strong>}
    <span>{reason ? t('rejection.reason', { reason }) : t('rejection.missing')}</span>
  </div>;
}
