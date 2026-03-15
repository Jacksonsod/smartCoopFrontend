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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const pageTitle = pageTitles[location.pathname] || "Dashboard";
  const initials = (user?.username || "U").charAt(0).toUpperCase();
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
        const [notificationsResponse, unreadResponse] = await Promise.all([
          getMyNotifications(),
          getUnreadCount(),
        ]);

        if (!mounted) return;

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
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isDropdownOpen]);

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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-9 w-9 md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div>
          <h2 className="text-base font-semibold text-gray-900">{pageTitle}</h2>
          <p className="text-[11px] text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
            aria-label="Open notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">{unreadCount} unread</p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificationItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</div>
                ) : (
                  notificationItems.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={[
                        "w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0",
                        notification.isRead ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100",
                      ].join(" ")}
                    >
                      <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                      <p className="mt-1 text-xs text-gray-600">{notification.message}</p>
                      <p className="mt-2 text-[11px] text-gray-400">{notification.time || "Just now"}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-emerald-500/30">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-600 text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.username || "User"}</p>
                <p className="text-[11px] text-gray-400">{formatRole(user?.role || "")}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-gray-500">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
