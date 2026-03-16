// ...existing code...
{["ACCOUNTANT", "ROLE_ACCOUNTANT"].includes(user?.role) && (
  <>
    <SidebarLink to="/accountant/dashboard" icon={<HomeIcon />} label={t("sidebar.dashboard") || "Dashboard"} />
    <SidebarLink to="/accountant/ledger" icon={<ListIcon />} label={t("sidebar.ledger") || "Activities Ledger"} />
    <SidebarLink to="/accountant/payments" icon={<DollarSignIcon />} label={t("sidebar.payments") || "Manage Payments"} />
  </>
)}
// ...existing code...
