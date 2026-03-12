import { LogOut, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const formatRole = (role = "") =>
  role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const pageTitles = {
  "/dashboard": "Dashboard",
  "/cooperatives": "Cooperatives",
  "/users": "Staff & Users",
  "/items": "Catalog Items",
  "/activities": "Activities",
  "/my-activities": "My Activities",
  "/payments": "Payments",
  "/profile": "My Profile",
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const pageTitle = pageTitles[location.pathname] || "Dashboard";
  const initials = (user?.username || "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/60 bg-white/80 px-4 shadow-sm backdrop-blur-xl sm:px-6">
      {/* Left: Mobile toggle + Page title */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 md:hidden"
          aria-label="Toggle sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Right: User info + Logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50/80 px-3 py-1.5 border border-gray-100">
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 shadow-md shadow-teal-500/20">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          {/* Name/Role */}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-900">{user?.username || "User"}</p>
            <p className="text-[10px] font-medium text-gray-400">{formatRole(user?.role || "") || "Role"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
