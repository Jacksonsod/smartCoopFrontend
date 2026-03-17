import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
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
import SystemLogs from "./pages/admin/SystemLogs";
import MemberDashboard from "./pages/member/MemberDashboard";
import { useAuth } from "./context/AuthContext";
import { Shield } from "lucide-react";
import Activities from "./pages/admin/Activities";
import RaiseProblem from "./pages/member/RaiseProblem";
import AdminHelpdesk from "./pages/admin/AdminHelpdesk";
import PendingCooperatives from "./pages/superadmin/PendingCooperatives";
import AccountantDashboard from "./pages/accountant/Dashboard";
import ActivitiesLedger from "./pages/accountant/ActivitiesLedger";
import PaymentsManagement from "./pages/accountant/PaymentsManagement";
import Payments from "./pages/accountant/Payments";
import CoopAdminDashboard from "./pages/coopadmin/CoopAdminDashboard";
import QualityInspectorDashboard from "./pages/inspector/QualityInspectorDashboard";
import FieldOfficerDashboard from "./pages/fieldofficer/FieldOfficerDashboard";
import Profile from "./pages/Profile";


const UsersPage = () => {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <UserManagement />;
  return <StaffAndUsers />;
};

const DashboardEntry = () => {
  const { user } = useAuth();
  if (user?.role === "MEMBER") return <MemberDashboard />;
  if (user?.role === "COOP_ADMIN") return <CoopAdminDashboard />;
  if (user?.role === "ACCOUNTANT") return <AccountantDashboard />;
  if (user?.role === "QUALITY_INSPECTOR") return <QualityInspectorDashboard />;
  if (user?.role === "FIELD_OFFICER") return <FieldOfficerDashboard />;
  return <Dashboard />;
};

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
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/apply" element={<CooperativeApplication />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardEntry />} />
                <Route
                  path="/cooperatives"
                  element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                      <CooperativeManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pending-cooperatives"
                  element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                      <PendingCooperatives />
                    </ProtectedRoute>
                  }
                />
                <Route path="/users" element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "COOP_ADMIN", "FIELD_OFFICER"]}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/items" element={
                    <ProtectedRoute allowedRoles={["COOP_ADMIN", "ACCOUNTANT"]}>
                      <CatalogItems />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activities"
                  element={
                    <ProtectedRoute allowedRoles={["COOP_ADMIN", "FIELD_OFFICER", "ACCOUNTANT", "QUALITY_INSPECTOR"]}>
                      <Activities />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/logs"
                  element={
                    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                      <SystemLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-activities"
                  element={
                    <ProtectedRoute allowedRoles={["MEMBER"]}>
                      <MemberDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/report-problem" element={
                    <ProtectedRoute allowedRoles={["MEMBER"]}>
                      <RaiseProblem />
                    </ProtectedRoute>
                  }
                />
                <Route path="/payments" element={
                    <ProtectedRoute allowedRoles={["ACCOUNTANT", "COOP_ADMIN"]}>
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route path="/payments-manage" element={
                    <ProtectedRoute allowedRoles={["ACCOUNTANT"]}>
                      <PaymentsManagement />
                    </ProtectedRoute>
                  }
                />
                <Route path="/ledger" element={
                    <ProtectedRoute allowedRoles={["ACCOUNTANT"]}>
                      <ActivitiesLedger />
                    </ProtectedRoute>
                  }
                />
                <Route path="/profile" element={<Profile />} />
                <Route path="/helpdesk" element={
                    <ProtectedRoute allowedRoles={["COOP_ADMIN"]}>
                      <AdminHelpdesk />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Route>
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
