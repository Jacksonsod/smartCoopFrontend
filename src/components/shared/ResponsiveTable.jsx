/**
 * ResponsiveTable — wraps any table content in overflow-x-auto.
 *
 * Fixes the confirmed issue where Activities, PaymentsManagement,
 * ActivitiesLedger, and SystemLogs tables were clipped at 390px mobile
 * width with no horizontal scroll (zero overflow handling today).
 *
 * Props:
 *   children   — the <Table>...</Table> subtree (or any table markup)
 *   minWidth   {string} — min-width on the inner container (default '640px')
 *   className  {string} — extra classes on the outer scroll container
 */
export default function ResponsiveTable({ children, minWidth = '640px', className = '' }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}
