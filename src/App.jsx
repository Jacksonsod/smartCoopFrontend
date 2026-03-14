import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import CooperativeApplication from "./pages/public/CooperativeApplication";
import CooperativeManagement from "./pages/admin/CooperativeManagement";
import UserManagement from "./pages/admin/UserManagement";
import Dashboard from "./pages/admin/Dashboard";
import CatalogItems from "./pages/admin/CatalogItems";
import StaffAndUsers from "./pages/admin/StaffAndUsers";
import { useAuth } from "./context/AuthContext";
import { ClipboardList, CreditCard, Shield, UserCircle } from "lucide-react";

const UsersPage = () => {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <UserManagement />;
  return <StaffAndUsers />;
};

// ─── Simple Placeholder Pages ─────────────────────────────────────
const PlaceholderPage = ({ icon: Icon, title, description }) => (
  <div className="flex items-center justify-center py-20 animate-fade-in">
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      <span className="mt-4 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        Coming Soon
      </span>
    </div>
  </div>
);

const Activities = () => (
  <PlaceholderPage
    icon={ClipboardList}
    title="Activities"
    description="Track and manage all cooperative activities, field visits, and operations in one place."
  />
);

const MyActivities = () => (
  <PlaceholderPage
    icon={Shield}
    title="My Activities"
    description="View your personal activity history, upcoming tasks, and participation records."
  />
);

const Payments = () => (
  <PlaceholderPage
    icon={CreditCard}
    title="Payments"
    description="Process and track payments, invoices, and financial transactions for your cooperative."
  />
);

const Profile = () => (
  <PlaceholderPage
    icon={UserCircle}
    title="My Profile"
    description="Manage your personal information, preferences, and account settings."
  />
);

const Unauthorized = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div className="text-center animate-scale-in">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
        <Shield className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
        You do not have permission to access this page. Please contact your administrator.
      </p>
      <a
        href="/dashboard"
        className="mt-4 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Go to Dashboard
      </a>
    </div>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/apply" element={<CooperativeApplication />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/cooperatives"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <CooperativeManagement />
                  </ProtectedRoute>
                }
              />
              <Route path="/users" element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN", "COOP_ADMIN"]}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/items" element={
                  <ProtectedRoute allowedRoles={["COOP_ADMIN"]}>
                    <CatalogItems />
                  </ProtectedRoute>
                }
              />
              <Route path="/activities" element={<Activities />} />
              <Route path="/my-activities" element={<MyActivities />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
