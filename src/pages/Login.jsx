import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Leaf, LockKeyhole, UserRound, Loader2 } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ─── Premium Brand Header Component for overlay ───────────────────
const BrandHeader = () => (
  <div className="absolute inset-0 flex flex-col items-start justify-start p-8 lg:p-12 z-20">
    <div className="flex items-center gap-3 mb-8 animate-fade-in">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
        <Leaf className="h-6 w-6 text-white" />
      </div>
      <span className="font-semibold text-white text-lg tracking-tight">Smart-Coop</span>
    </div>

    <div className="mt-auto mb-8 max-w-sm animate-slide-up" style={{ animationDelay: "100ms" }}>
      <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
        Cooperative Resource Planning
      </h2>
      <p className="text-sm text-white/80 leading-relaxed">
        Unified platform for managing members, tracking activities, processing payments, and growing your cooperative together.
      </p>
      <div className="mt-6 flex items-center gap-4 text-xs text-white/60">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
          Secure & Scalable
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
          Real-time Analytics
        </div>
      </div>
    </div>
  </div>
);

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/login", {
        identifier: formData.identifier,
        password: formData.password,
      });
      const token = response.data?.token;

      if (!token) {
        throw new Error("No token returned from server.");
      }

      login(token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid credentials. Please check your username and password.");
      } else if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        setError("Server is waking up (free tier). Please wait 30 seconds and try again.");
      } else if (!err.response) {
        setError("Cannot reach the server. It may be starting up — please try again in a moment.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-50">
      {/* ─── Left Panel: Premium Background + Branding ─────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700">
        {/* Background Image (Placeholder) */}
        <div
          className="absolute inset-0 object-cover w-full h-full"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 800%22%3E%3Cdefs%3E%3ClinearGradient id=%22grad%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 style=%22stop-color:%23059669;stop-opacity:0.1%22/%3E%3Cstop offset=%22100%25%22 style=%22stop-color:%230d9488;stop-opacity:0.05%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%221200%22 height=%22800%22 fill=%22url(%23grad)%22/%3E%3Ccircle cx=%2250%25%22 cy=%2250%25%22 r=%22300%22 fill=%22none%22 stroke=%22%2310b981%22 stroke-width=%221%22 opacity=%220.05%22/%3E%3Ccircle cx=%2250%25%22 cy=%2250%25%22 r=%22400%22 fill=%22none%22 stroke=%22%2310b981%22 stroke-width=%221%22 opacity=%220.03%22/%3E%3C/svg%3E')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 via-teal-900/40 to-emerald-900/50 backdrop-blur-xs" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-teal-400/5 rounded-full blur-3xl" style={{ animationDelay: "2s" }} />
        </div>

        {/* Brand Header */}
        <BrandHeader />
      </div>

      {/* ─── Right Panel: Login Form ────────────────────────────────── */}
      <div className="flex w-full items-center justify-center px-4 sm:px-6 py-10 lg:w-1/2 lg:px-8">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 mb-4">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Smart-Coop</h1>
            <p className="text-sm text-gray-500 mt-1">Cooperative Resource Platform</p>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-600 mt-1">Sign in to access your cooperative dashboard</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6 animate-slide-down">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username/Email Field */}
            <div className="space-y-2">
              <Label htmlFor="identifier" className="font-medium text-sm">
                Username or Email
              </Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="pl-10 h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-medium text-sm">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="pl-10 h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Footer Links */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Don&apos;t have an account?{" "}
              <Link to="/apply" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Register your cooperative
              </Link>
            </p>
            <p className="text-xs text-gray-400 text-center">
              &copy; {new Date().getFullYear()} Smart-Coop. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;

