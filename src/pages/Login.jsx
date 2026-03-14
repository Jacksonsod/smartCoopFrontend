import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Leaf, LockKeyhole, UserRound } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ─── Decorative SVG Illustration ─────────────────────────────────
const CoopIllustration = () => (
  <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md mx-auto">
    {/* Background circle */}
    <circle cx="250" cy="250" r="200" fill="#ecfdf5" />
    <circle cx="250" cy="250" r="160" fill="#d1fae5" opacity="0.5" />

    {/* Ground / field */}
    <ellipse cx="250" cy="380" rx="180" ry="30" fill="#a7f3d0" />

    {/* Central barn / coop building */}
    <rect x="180" y="220" width="140" height="120" rx="4" fill="#065f46" />
    <polygon points="170,225 250,165 330,225" fill="#047857" />
    {/* Roof accent */}
    <polygon points="185,225 250,175 315,225" fill="#059669" />
    {/* Door */}
    <rect x="230" y="290" width="40" height="50" rx="20" fill="#34d399" />
    <circle cx="260" cy="318" r="3" fill="#065f46" />
    {/* Windows */}
    <rect x="198" y="248" width="24" height="20" rx="3" fill="#6ee7b7" />
    <rect x="278" y="248" width="24" height="20" rx="3" fill="#6ee7b7" />
    <line x1="210" y1="248" x2="210" y2="268" stroke="#059669" strokeWidth="1.5" />
    <line x1="198" y1="258" x2="222" y2="258" stroke="#059669" strokeWidth="1.5" />
    <line x1="290" y1="248" x2="290" y2="268" stroke="#059669" strokeWidth="1.5" />
    <line x1="278" y1="258" x2="302" y2="258" stroke="#059669" strokeWidth="1.5" />

    {/* Silo left */}
    <rect x="120" y="260" width="35" height="80" rx="4" fill="#047857" />
    <ellipse cx="137" cy="260" rx="17.5" ry="8" fill="#059669" />
    <rect x="128" y="245" width="18" height="20" rx="9" fill="#059669" />

    {/* Silo right */}
    <rect x="345" y="275" width="30" height="65" rx="4" fill="#047857" />
    <ellipse cx="360" cy="275" rx="15" ry="7" fill="#059669" />
    <rect x="352" y="262" width="16" height="18" rx="8" fill="#059669" />

    {/* Left tree */}
    <rect x="90" y="310" width="8" height="40" rx="2" fill="#92400e" />
    <circle cx="94" cy="295" r="22" fill="#34d399" />
    <circle cx="82" cy="305" r="16" fill="#6ee7b7" />
    <circle cx="106" cy="302" r="18" fill="#10b981" />

    {/* Right tree */}
    <rect x="390" y="315" width="8" height="35" rx="2" fill="#92400e" />
    <circle cx="394" cy="300" r="20" fill="#34d399" />
    <circle cx="382" cy="308" r="14" fill="#6ee7b7" />
    <circle cx="406" cy="306" r="16" fill="#10b981" />

    {/* People figures */}
    {/* Person 1 */}
    <circle cx="155" cy="340" r="8" fill="#f59e0b" />
    <rect x="150" y="348" width="10" height="18" rx="5" fill="#f59e0b" />
    <line x1="150" y1="355" x2="143" y2="363" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    <line x1="160" y1="355" x2="167" y2="363" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

    {/* Person 2 */}
    <circle cx="340" cy="342" r="8" fill="#3b82f6" />
    <rect x="335" y="350" width="10" height="18" rx="5" fill="#3b82f6" />
    <line x1="335" y1="357" x2="328" y2="365" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
    <line x1="345" y1="357" x2="352" y2="365" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />

    {/* Person 3 (center, approaching) */}
    <circle cx="290" cy="345" r="7" fill="#8b5cf6" />
    <rect x="286" y="352" width="8" height="16" rx="4" fill="#8b5cf6" />

    {/* Sun */}
    <circle cx="400" cy="100" r="30" fill="#fbbf24" opacity="0.8" />
    <circle cx="400" cy="100" r="40" fill="#fbbf24" opacity="0.15" />
    {/* Sun rays */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 400 + Math.cos(rad) * 45;
      const y1 = 100 + Math.sin(rad) * 45;
      const x2 = 400 + Math.cos(rad) * 55;
      const y2 = 100 + Math.sin(rad) * 55;
      return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.5" />;
    })}

    {/* Clouds */}
    <g opacity="0.6">
      <ellipse cx="130" cy="110" rx="35" ry="14" fill="white" />
      <ellipse cx="155" cy="105" rx="25" ry="12" fill="white" />
      <ellipse cx="110" cy="108" rx="20" ry="10" fill="white" />
    </g>
    <g opacity="0.4">
      <ellipse cx="300" cy="80" rx="28" ry="11" fill="white" />
      <ellipse cx="320" cy="76" rx="20" ry="10" fill="white" />
    </g>

    {/* Wheat / crop lines */}
    {[200, 220, 240, 260, 280, 300].map((x) => (
      <g key={x}>
        <line x1={x} y1="395" x2={x} y2="410" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={x} cy="393" r="3" fill="#34d399" />
      </g>
    ))}

    {/* Leaf accent */}
    <g transform="translate(250, 150)">
      <path d="M0,-15 Q12,-10 8,5 Q4,12 0,15 Q-4,12 -8,5 Q-12,-10 0,-15Z" fill="#10b981" opacity="0.8" />
      <line x1="0" y1="-10" x2="0" y2="15" stroke="#065f46" strokeWidth="1" />
    </g>
  </svg>
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
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-50">
      {/* Left — Illustration Panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-12 relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #059669 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 text-center max-w-lg">
          <CoopIllustration />
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Cooperative Management, <span className="text-emerald-600">Simplified</span>
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Streamline your cooperative operations manage members, track activities, and grow together on one platform.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Secure Access
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Real-time Data
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Easy Reporting
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-sm animate-scale-in">
          {/* Logo */}
          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 mb-4">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your Smart-Coop account</p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-4 animate-slide-down">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Username or Email</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="pl-9 h-10"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="pl-9 h-10"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link to="/apply" className="font-medium text-emerald-600 hover:text-emerald-700">
                Register your cooperative
              </Link>
            </p>
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Smart-Coop
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
