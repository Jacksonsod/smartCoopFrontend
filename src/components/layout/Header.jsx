import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, LogOut, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getMyNotifications, getUnreadCount, markAsRead } from "@/services/notificationService";
import api from "@/services/api";
import EditProfileModal from "./EditProfileModal";

const formatRole = (role = "") =>
  role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const pageTitles = {
  "/dashboard": "Dashboard",
  "/cooperatives": "Cooperatives",
  "/users": "Staff & Users",
  "/items": "Catalog Items",
  "/logs": "System Logs",
  "/activities": "Activities",
  "/my-activities": "My Activities",
  "/payments": "Payments",
  "/profile": "My Profile",
};

const extractNotifications = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const formatNotificationTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const resolveNotificationRoute = (notification) =>
  notification?.route ||
  notification?.path ||
  notification?.link ||
  notification?.url ||
  notification?.redirectTo ||
  "";

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dbUser, setDbUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [designMode, setDesignMode] = useState(() => localStorage.getItem("designMode") || "modern");
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const pageTitle = pageTitles[location.pathname] || "Dashboard";
  
  const displayUser = dbUser || user;
  const initials = (displayUser?.fullName || displayUser?.firstName || displayUser?.username || "U").charAt(0).toUpperCase();
  
  const notificationItems = useMemo(
    () =>
      notifications.map((notification, index) => ({
        id: notification?.id || `${notification?.title || "notification"}-${index}`,
        isRead: Boolean(notification?.isRead),
        title: notification?.title || "Notification",
        message: notification?.message || notification?.body || "No details available.",
        time: formatNotificationTime(notification?.createdAt || notification?.timestamp || notification?.time),
        route: resolveNotificationRoute(notification),
      })),
    [notifications]
  );

  useEffect(() => {
    let mounted = true;

    const fetchNotificationData = async () => {
      try {
        const [notificationsResponse, unreadResponse, userResponse] = await Promise.all([
          getMyNotifications(),
          getUnreadCount(),
          api.get("/profile/me").catch(() => null)
        ]);

        if (!mounted) return;

        if (userResponse?.data) {
          setDbUser(userResponse.data);
        }

        const list = extractNotifications(notificationsResponse?.data);
        const countFromApi = Number(unreadResponse?.data);
        const safeCount = Number.isFinite(countFromApi)
          ? countFromApi
          : list.filter((notification) => !notification?.isRead).length;

        setNotifications(list);
        setUnreadCount(Math.max(0, safeCount));
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        if (!mounted) return;
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotificationData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    if (isDropdownOpen || profileDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isDropdownOpen, profileDropdownOpen]);

  const handleNotificationClick = async (notification) => {
    const wasUnread = !notification?.isRead;

    if (wasUnread && notification?.id) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }

      setNotifications((prev) => prev.map((item) => (
        item?.id === notification.id ? { ...item, isRead: true } : item
      )));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setIsDropdownOpen(false);

    const targetRoute = resolveNotificationRoute(notification);
    if (!targetRoute) return;

    if (/^https?:\/\//i.test(targetRoute)) {
      window.location.href = targetRoute;
      return;
    }

    navigate(targetRoute);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md px-4 sm:px-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-9 w-9 md:hidden hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-400"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">{pageTitle}</h2>
          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Design Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5 border border-gray-200 dark:border-gray-800 mr-1 shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => {
              localStorage.setItem("designMode", "modern");
              setDesignMode("modern");
              window.location.reload();
            }}
            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all duration-150 ${
              designMode === "modern"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
            }`}
          >
            Modern
          </button>
          <button
            onClick={() => {
              localStorage.setItem("designMode", "legacy");
              setDesignMode("legacy");
              window.location.reload();
            }}
            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all duration-150 ${
              designMode === "legacy"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
            }`}
          >
            Original
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 transition-all hover:bg-gray-100/85 dark:hover:bg-gray-900 hover:text-gray-800 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-500/30"
            aria-label="Open notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-emerald-600 px-1 text-center text-[9px] font-bold leading-4 text-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl animate-slide-down z-50">
              <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/50 dark:bg-gray-900/50">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Notifications</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-550 font-medium">{unreadCount} unread messages</p>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                {notificationItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-gray-400 dark:text-gray-550">No notifications yet.</div>
                ) : (
                  notificationItems.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={[
                        "w-full px-4 py-3.5 text-left transition-colors last:border-b-0",
                        notification.isRead 
                          ? "bg-white dark:bg-gray-900 hover:bg-gray-50/70 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-305" 
                          : "bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-gray-800 dark:text-gray-200",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{notification.title}</p>
                        {!notification.isRead && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0 mt-1" />}
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{notification.message}</p>
                      <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium">{notification.time || "Just now"}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 outline-none transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-900/80 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
          >
            <Avatar className="h-8.5 w-8.5 border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
              <AvatarFallback className="bg-emerald-600 text-xs font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-gray-950 dark:text-white truncate max-w-[120px]">{displayUser?.fullName || displayUser?.firstName || displayUser?.username || "User"}</p>
              <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/10 dark:ring-emerald-500/20 mt-0.5">
                {formatRole(user?.role || "")}
              </span>
            </div>
          </button>
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl py-1.5 border border-gray-100 dark:border-gray-800 z-50 animate-slide-down">
              <div className="text-xs text-gray-950 dark:text-white font-bold px-4 py-2.5 border-b border-gray-50 dark:border-gray-800">
                <span className="block truncate">{displayUser?.fullName || displayUser?.firstName || displayUser?.username || "User"}</span>
                <span className="block text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-0.5 truncate">{displayUser?.email || formatRole(user?.role || "")}</span>
              </div>
              <div className="p-1">
                <button
                  className="flex items-center w-full px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                  onClick={() => { setEditProfileOpen(true); setProfileDropdownOpen(false); }}
                >
                  <svg className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5l-4 1 1-4L16.5 3.5z" /></svg>
                  Edit Profile
                </button>
                <button
                  className="flex items-center w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-305 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-500 dark:text-red-450" />
                  Logout
                </button>
              </div>
            </div>
          )}
          {/* Edit Profile Modal */}
          {editProfileOpen && (
            <EditProfileModal open={editProfileOpen} onClose={() => setEditProfileOpen(false)} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
