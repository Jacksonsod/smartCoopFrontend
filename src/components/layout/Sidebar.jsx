import {
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Leaf,
  MessageSquare,
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
    allowedRoles: ["SUPER_ADMIN", "COOP_ADMIN", "ACCOUNTANT", "FIELD_OFFICER", "QUALITY_INSPECTOR", "MEMBER"],
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
    title: "Pending Cooperatives",
    path: "/pending-cooperatives",
    icon: ClipboardList,
    allowedRoles: ["SUPER_ADMIN"],
    section: "Management",
  },
  {
    title: "Staff & Users",
    path: "/users",
    icon: Users,
    allowedRoles: ["SUPER_ADMIN", "COOP_ADMIN", "FIELD_OFFICER"],
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
    allowedRoles: ["COOP_ADMIN", "FIELD_OFFICER", "ACCOUNTANT", "QUALITY_INSPECTOR"],
    section: "Operations",
  },
  {
    title: "Helpdesk",
    path: "/helpdesk",
    icon: MessageSquare,
    allowedRoles: ["COOP_ADMIN"],
    section: "Operations",
  },
  {
    title: "Pending Payments",
    path: "/payments",
    icon: CreditCard,
    allowedRoles: ["COOP_ADMIN"],
    section: "Finance",
  },
  {
    title: "Manage Payments",
    path: "/payments-manage",
    icon: ReceiptText,
    allowedRoles: ["ACCOUNTANT"],
    section: "Finance",
  },
  {
    title: "Activities Ledger",
    path: "/ledger",
    icon: BookOpen,
    allowedRoles: ["ACCOUNTANT"],
    section: "Finance",
  },
  {
    title: "Report Problem",
    path: "/report-problem",
    icon: FileText,
    allowedRoles: ["MEMBER"],
    section: "Personal",
  },
  {
    title: "My Profile",
    path: "/profile",
    icon: UserCircle,
    allowedRoles: ["SUPER_ADMIN", "COOP_ADMIN", "ACCOUNTANT", "FIELD_OFFICER", "QUALITY_INSPECTOR", "MEMBER"],
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
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/10">
          <Leaf className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight leading-none">Smart-Coop</h1>
          <span className="text-[10px] text-sidebar-foreground/60 font-medium mt-0.5 block">Cooperative Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 space-y-6 px-3.5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="space-y-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/45">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onLinkClick}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200",
                        isActive
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/15 scale-[1.02]"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={[
                            "h-[16px] w-[16px] transition-colors duration-200",
                            isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground",
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
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar md:block">
        <SidebarContent />
      </aside>

      {/* Mobile */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 border-r border-sidebar-border bg-sidebar p-0 [&>button]:hidden">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
