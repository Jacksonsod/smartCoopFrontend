import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Leaf,
  Package,
  ReceiptText,
  Shield,
  UserCircle,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["SUPER_ADMIN", "COOP_ADMIN", "ACCOUNTANT", "FIELD_OFFICER", "MEMBER"],
    section: "Overview",
  },
  {
    title: "Cooperatives",
    path: "/cooperatives",
    icon: Building2,
    allowedRoles: ["SUPER_ADMIN"],
    section: "Management",
  },
  {
    title: "Staff & Users",
    path: "/users",
    icon: Users,
    allowedRoles: ["SUPER_ADMIN", "COOP_ADMIN"],
    section: "Management",
  },
  {
    title: "Catalog Items",
    path: "/items",
    icon: Package,
    allowedRoles: ["COOP_ADMIN", "FIELD_OFFICER", "ACCOUNTANT"],
    section: "Operations",
  },
  {
    title: "Activities",
    path: "/activities",
    icon: ClipboardList,
    allowedRoles: ["COOP_ADMIN", "FIELD_OFFICER", "ACCOUNTANT"],
    section: "Operations",
  },
  {
    title: "My Activities",
    path: "/my-activities",
    icon: Shield,
    allowedRoles: ["MEMBER"],
    section: "Personal",
  },
  {
    title: "Payments",
    path: "/payments",
    icon: ReceiptText,
    allowedRoles: ["ACCOUNTANT"],
    section: "Operations",
  },
  {
    title: "My Profile",
    path: "/profile",
    icon: UserCircle,
    allowedRoles: ["MEMBER"],
    section: "Personal",
  },
];

const Sidebar = () => {
  const { user } = useAuth();

  const allowedNavItems = navItems.filter(
    (item) => Array.isArray(item.allowedRoles) && item.allowedRoles.includes(user?.role)
  );

  // Group items by section
  const sections = [];
  let lastSection = null;
  allowedNavItems.forEach((item) => {
    if (item.section !== lastSection) {
      sections.push({ label: item.section, items: [item] });
      lastSection = item.section;
    } else {
      sections[sections.length - 1].items.push(item);
    }
  });

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 bg-gradient-to-b from-gray-900 via-gray-900 to-slate-950 text-white md:block">
      {/* Logo Area */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-indigo-500 shadow-lg shadow-teal-500/20">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide gradient-text">Smart-Coop</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 space-y-6 px-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "border-l-[3px] border-teal-400 bg-gradient-to-r from-teal-500/15 to-transparent text-white shadow-[0_0_20px_rgba(20,184,166,0.08)]"
                          : "border-l-[3px] border-transparent text-gray-400 hover:translate-x-1 hover:bg-white/[0.04] hover:text-white",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={[
                            "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                            isActive
                              ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/30"
                              : "bg-white/[0.06] text-gray-400 group-hover:bg-white/[0.1] group-hover:text-white",
                          ].join(" ")}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span>{item.title}</span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-teal-950/30 to-transparent pointer-events-none" />
    </aside>
  );
};

export default Sidebar;
