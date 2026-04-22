import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Mail, Lock, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import api from "@/services/api";

const initialForm = {
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

const stepLabels = {
  1: "Request OTP",
  2: "Verify OTP",
  3: "Reset Password",
};

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const progress = useMemo(() => {
    return [1, 2, 3].map((item) => ({
      step: item,
      active: item === step,
      done: item < step,
    }));
  }, [step]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email: formData.email.trim() });
      setSuccess("OTP sent successfully. Please check your email.");
      setStep(2);
    } catch (err) {
      console.error("Forgot password request failed:", err);
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (status === 404 ? "Email not found." : "Network Error. Please try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await api.post("/auth/verify-otp", {
        email: formData.email.trim(),
        otp: formData.otp.trim(),
      });
      setSuccess("OTP verified successfully.");
      setStep(3);
    } catch (err) {
      console.error("OTP verification failed:", err);
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (status === 400 || status === 401 ? "Invalid OTP." : "Network Error. Please try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    resetMessages();

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess("Your password has been reset successfully. You can now sign in.");
      setStep(4);
    } catch (err) {
      console.error("Password reset failed:", err);
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (status === 400 ? "Unable to reset password. Please verify your details." : "Network Error. Please try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isFinished = step === 4;

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 lg:grid-cols-2">
          <div className="hidden bg-emerald-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4" />
                Secure password recovery
              </div>
              <h1 className="mt-8 text-4xl font-bold tracking-tight">Forgot your password?</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-emerald-50/90">
                We’ll help you verify your identity with a 6-digit OTP and get you back into your Smart-Coop account quickly.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-sm font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                Fast, secure, and simple
              </div>
              <p className="mt-2 text-sm text-emerald-50/80">
                Request OTP, verify your code, and set a new password in one smooth flow.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-600">Password Recovery</p>
                <h2 className="text-2xl font-bold text-gray-900">{isFinished ? "Done" : stepLabels[step]}</h2>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>

            <div className="mb-8 flex items-center gap-2">
              {progress.map((item) => (
                <div key={item.step} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      item.done
                        ? "bg-emerald-600 text-white"
                        : item.active
                          ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {item.done ? <CheckCircle2 className="h-4 w-4" /> : item.step}
                  </div>
                  {item.step < 3 && <div className={`h-1 flex-1 rounded-full ${item.done ? "bg-emerald-500" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-300 bg-white px-10 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label htmlFor="otp" className="mb-2 block text-sm font-medium text-gray-700">
                    6-Digit OTP
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.otp}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                      setFormData((prev) => ({ ...prev, otp: value }));
                    }}
                    placeholder="Enter OTP"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-lg tracking-[0.35em] shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || formData.otp.length !== 6}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter a new password"
                      className="w-full rounded-xl border border-gray-300 bg-white px-10 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm the new password"
                      className="w-full rounded-xl border border-gray-300 bg-white px-10 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}

            {isFinished && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                  <h3 className="mt-4 text-xl font-bold text-gray-900">Password reset successful</h3>
                  <p className="mt-2 text-sm text-gray-600">You can now sign in with your new password.</p>
                </div>

                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Return to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;

