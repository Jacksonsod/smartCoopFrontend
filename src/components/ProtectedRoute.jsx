import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><span className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></span></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = user?.role?.replace(/^ROLE_/, "");
  console.log("[ProtectedRoute] user:", user, "allowedRoles:", allowedRoles, "normalizedRole:", normalizedRole);
  const accountantRoles = ["ACCOUNTANT", "ROLE_ACCOUNTANT"];
  if (
    allowedRoles.length &&
    !allowedRoles.includes(user?.role) &&
    !allowedRoles.includes(normalizedRole) &&
    !(allowedRoles.includes("ACCOUNTANT") && accountantRoles.includes(user?.role))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
