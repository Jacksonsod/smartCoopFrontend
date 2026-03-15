import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Leaf,
  Package,
  ReceiptText,
  Shield,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

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
    title: "System Logs",
    path: "/logs",
    icon: FileText,
    allowedRoles: ["SUPER_ADMIN"],
    section: "Management",
  },
  {
    title: "Catalog Items",
    path: "/items",
    icon: Package,
    allowedRoles: ["COOP_ADMIN", "ACCOUNTANT"],
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

const SidebarContent = ({ onLinkClick }) => {
  const { user } = useAuth();

  const allowedNavItems = navItems.filter(
    (item) => Array.isArray(item.allowedRoles) && item.allowedRoles.includes(user?.role)
  );

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
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Leaf className="h-5 w-5" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Smart-Coop</h1>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-5 px-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onLinkClick}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={[
                            "h-[18px] w-[18px]",
                            isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-500",
                          ].join(" ")}
                        />
                        <span>{item.title}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
};

const Sidebar = ({ open, onOpenChange }) => {
  return (
    <>
      {/* Desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-gray-200 bg-white md:block">
        <SidebarContent />
      </aside>

      {/* Mobile */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 border-r border-gray-200 bg-white p-0 [&>button]:hidden">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarContent onLinkClick={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
