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

// ─── Styled Placeholder Pages ────────────────────────────────────────────────
const PlaceholderPage = ({ icon: Icon, title, description, gradient }) => (
  <div className="flex items-center justify-center py-20 animate-fade-in">
    <div className="text-center">
      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${gradient} shadow-xl mb-6`}>
        <Icon className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">{description}</p>
      <div className="mt-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-teal-500/20">
          ✨ Coming Soon
        </span>
      </div>
    </div>
  </div>
);

const Activities = () => (
  <PlaceholderPage
    icon={ClipboardList}
    title="Activities"
    description="Track and manage all cooperative activities, field visits, and operations in one place."
    gradient="from-indigo-500 to-indigo-600"
  />
);

const MyActivities = () => (
  <PlaceholderPage
    icon={Shield}
    title="My Activities"
    description="View your personal activity history, upcoming tasks, and participation records."
    gradient="from-teal-500 to-teal-600"
  />
);

const Payments = () => (
  <PlaceholderPage
    icon={CreditCard}
    title="Payments"
    description="Process and track payments, invoices, and financial transactions for your cooperative."
    gradient="from-purple-500 to-purple-600"
  />
);

const Profile = () => (
  <PlaceholderPage
    icon={UserCircle}
    title="My Profile"
    description="Manage your personal information, preferences, and account settings."
    gradient="from-blue-500 to-blue-600"
  />
);

const Unauthorized = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100/50 px-4">
    <div className="text-center animate-scale-in">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-red-600 shadow-xl shadow-red-500/25 mb-6">
        <Shield className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900">Access Denied</h1>
      <p className="mt-3 text-sm text-gray-400 max-w-sm mx-auto">You do not have permission to access this page. Please contact your administrator if you believe this is an error.</p>
      <a href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-indigo-600 hover:shadow-xl hover:-translate-y-0.5">
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
