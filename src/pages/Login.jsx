import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Leaf, LockKeyhole, UserRound } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

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
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center px-4 py-10">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-float absolute -top-20 -left-20 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="animate-float-delayed absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="animate-float-slow absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-teal-400/8 blur-3xl" />
        <div className="animate-float-delayed absolute top-10 left-1/4 h-48 w-48 rounded-full bg-indigo-400/5 blur-2xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md animate-scale-in">
        {/* Top gradient accent bar */}
        <div className="mx-auto mb-0 h-1 w-24 rounded-full bg-gradient-to-r from-teal-500 via-indigo-500 to-teal-500" />

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.95] p-10 shadow-2xl shadow-black/20 backdrop-blur-xl">
          {/* Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 mb-5 shadow-xl shadow-teal-500/25">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold gradient-text">Smart-Coop</h1>
            <p className="mt-2 text-sm text-gray-400 tracking-wide">Cooperative Management Platform</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200/60 bg-red-50/80 px-4 py-3.5 text-sm text-red-700 animate-slide-down">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username / Email */}
            <div>
              <label
                htmlFor="identifier"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Username or Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <UserRound className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <LockKeyhole className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${
                isSubmitting
                  ? "animate-pulse bg-gradient-to-r from-teal-600 to-indigo-600"
                  : "bg-gradient-to-r from-teal-600 to-indigo-600 shadow-teal-500/25 hover:from-teal-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5"
              }`}
            >
              {isSubmitting ? "Authenticating..." : "Sign In"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/apply"
                className="font-semibold text-teal-600 transition-colors hover:text-indigo-600"
              >
                Register your cooperative here.
              </Link>
            </p>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Smart-Coop &middot; All rights reserved
          </p>
        </div>
      </div>
    </main>
  );
};

export default Login;
