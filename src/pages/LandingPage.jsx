import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileText,
  Leaf,
  Menu,
  Package,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ─── Intersection observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ value, suffix = "", label, inView }) => {
  const count = useCountUp(value, 1800, inView);
  return (
    <div className="text-center">
      <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-sm sm:text-base text-emerald-100/80 font-medium">{label}</p>
    </div>
  );
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <div
    className="group relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300"
    style={{ animationDelay: delay }}
  >
    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      Learn more <ArrowRight className="h-3.5 w-3.5" />
    </div>
  </div>
);

// ─── Role Card ────────────────────────────────────────────────────────────────
const RoleCard = ({ icon: Icon, role, desc, perms, color }) => (
  <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 space-y-3 hover:border-emerald-500/30 dark:hover:border-emerald-500/20 transition-colors duration-200">
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 dark:text-white">{role}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
    </div>
    <ul className="space-y-1.5">
      {perms.map((p) => (
        <li key={p} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          {p}
        </li>
      ))}
    </ul>
  </div>
);

// ─── Step Card ────────────────────────────────────────────────────────────────
const StepCard = ({ num, title, desc }) => (
  <div className="relative flex gap-5">
    <div className="flex flex-col items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-600/30">
        {num}
      </div>
      {num < 4 && <div className="mt-2 w-px flex-1 bg-gradient-to-b from-emerald-500/40 to-transparent" />}
    </div>
    <div className="pb-8">
      <p className="font-bold text-gray-900 dark:text-white text-sm">{title}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsRef, statsInView] = useInView(0.3);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Users,
      title: "Member Management",
      desc: "Register, track, and manage all cooperative members with real-time status updates and role-based access.",
      color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600",
      delay: "0ms",
    },
    {
      icon: BarChart3,
      title: "Activity Tracking",
      desc: "Record deliveries, services, and transactions with full audit trails and instant ledger updates.",
      color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600",
      delay: "50ms",
    },
    {
      icon: CreditCard,
      title: "Payment Processing",
      desc: "Automate MoMo payments, approve pending payouts, and generate detailed financial reports.",
      color: "bg-purple-50 dark:bg-purple-950/40 text-purple-600",
      delay: "100ms",
    },
    {
      icon: Shield,
      title: "Quality Inspection",
      desc: "Empower quality officers to review, approve, or reject activities with detailed notes and status tracking.",
      color: "bg-amber-50 dark:bg-amber-950/40 text-amber-600",
      delay: "150ms",
    },
    {
      icon: FileText,
      title: "Reports & Ledger",
      desc: "Download PDF invoices, Excel exports, and a full activities ledger for any time period.",
      color: "bg-rose-50 dark:bg-rose-950/40 text-rose-600",
      delay: "200ms",
    },
    {
      icon: Bell,
      title: "Notifications",
      desc: "Real-time in-app notifications keep every team member informed of important cooperative events.",
      color: "bg-teal-50 dark:bg-teal-950/40 text-teal-600",
      delay: "250ms",
    },
  ];

  const roles = [
    {
      icon: Sparkles,
      role: "Super Admin",
      desc: "Platform-wide oversight",
      color: "bg-purple-100 dark:bg-purple-950/50 text-purple-700",
      perms: ["Manage all cooperatives", "Approve registrations", "View system logs", "Control user access"],
    },
    {
      icon: Users,
      role: "Coop Admin",
      desc: "Cooperative operations",
      color: "bg-blue-100 dark:bg-blue-950/50 text-blue-700",
      perms: ["Record activities", "Manage members", "View payments", "Helpdesk management"],
    },
    {
      icon: Package,
      role: "Field Officer",
      desc: "On-ground operations",
      color: "bg-amber-100 dark:bg-amber-950/50 text-amber-700",
      perms: ["Log member deliveries", "Register new members", "View activity history", "Track daily targets"],
    },
    {
      icon: Shield,
      role: "Quality Inspector",
      desc: "Activity verification",
      color: "bg-rose-100 dark:bg-rose-950/50 text-rose-700",
      perms: ["Review activities", "Approve / Reject entries", "Add inspection notes", "Monitor quality metrics"],
    },
    {
      icon: BookOpen,
      role: "Accountant",
      desc: "Financial management",
      color: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700",
      perms: ["Process MoMo payments", "Manage activities ledger", "Export financial data", "Download invoices"],
    },
    {
      icon: TrendingUp,
      role: "Member",
      desc: "Personal tracking",
      color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
      perms: ["View own activities", "Track revenue earned", "Report problems", "Download payment receipts"],
    },
  ];

  const steps = [
    {
      num: 1,
      title: "Register your cooperative",
      desc: "Submit your cooperative's details through our simple registration form. Our super admin reviews and activates your account.",
    },
    {
      num: 2,
      title: "Set up your team",
      desc: "Add coop admins, field officers, quality inspectors, accountants, and members — each with role-appropriate access.",
    },
    {
      num: 3,
      title: "Record activities & track performance",
      desc: "Field officers log daily deliveries. Quality inspectors verify them. The ledger updates automatically.",
    },
    {
      num: 4,
      title: "Process payments & generate reports",
      desc: "Accountants approve MoMo payouts, export ledgers, and download PDF invoices for every transaction.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-gray-950/90 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-md shadow-emerald-600/30">
              <Leaf className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight">Smart-Coop</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">How it works</a>
            <a href="#roles" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Roles</a>
            <Link to="/apply" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Apply</Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/apply"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-emerald-600/35 transition-all duration-200 hover:-translate-y-px"
            >
              Register Cooperative
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 pb-5 pt-2 space-y-1 animate-slide-down">
            {["#features", "#how-it-works", "#roles"].map((href) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors capitalize"
              >
                {href.replace("#", "").replace(/-/g, " ")}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/apply"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Register Cooperative
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-950 dark:to-emerald-950/20" />

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-400/10 dark:bg-teal-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none' stroke='%23047857' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-16">
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-1.5 mb-6">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Rwanda's #1 Cooperative Management Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 dark:text-white leading-[1.08] tracking-tight mb-6">
              Manage your{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  cooperative
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/40 to-teal-400/40 rounded-full" />
              </span>
              {" "}smarter
            </h1>

            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10">
              Smart-Coop is an end-to-end cooperative resource platform — track activities, process payments, manage members, and generate financial reports, all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/apply"
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                Register your Cooperative
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3.5 text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 hover:-translate-y-0.5 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-gray-500 dark:text-gray-500">
              {["End-to-end encrypted", "Role-based access", "Real-time updates"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard preview card */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none animate-slide-up" style={{ animationDelay: "150ms" }}>
            <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl shadow-gray-900/10 dark:shadow-black/40 overflow-hidden">
              {/* Mock header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/50 dark:bg-gray-950/50">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  smart-coop.app / dashboard
                </div>
                <div className="w-12" />
              </div>

              {/* Mock content */}
              <div className="p-4 space-y-3">
                {/* Metric row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Total Activities", value: "1,284", color: "text-emerald-600" },
                    { label: "Revenue", value: "RF 48K", color: "text-blue-600" },
                    { label: "Members", value: "67", color: "text-purple-600" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">{m.label}</p>
                      <p className={`text-lg font-extrabold mt-0.5 ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                  <p className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-2">Activity This Week</p>
                  <div className="flex items-end gap-1 h-16">
                    {[40, 65, 45, 80, 95, 60, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-80"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <p key={i} className="flex-1 text-center text-[8px] text-gray-400 dark:text-gray-600">{d}</p>
                    ))}
                  </div>
                </div>

                {/* Recent activity list */}
                <div className="space-y-2">
                  <p className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Recent Activities</p>
                  {[
                    { name: "thomas", item: "timber", qty: "5 Kg", status: "PAID" },
                    { name: "alice", item: "coffee", qty: "12 Kg", status: "PENDING" },
                    { name: "robert", item: "maize", qty: "8 Kg", status: "PAID" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-[9px] font-bold text-white">
                          {r.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{r.name}</p>
                          <p className="text-[9px] text-gray-400 dark:text-gray-500">{r.item} · {r.qty}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === "PAID"
                          ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 hidden sm:flex items-center gap-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl px-4 py-3 animate-count-pop" style={{ animationDelay: "600ms" }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Revenue Growth</p>
                <p className="text-sm font-extrabold text-emerald-600">+24% this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <a href="#features" className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 dark:text-gray-600 hover:text-emerald-500 transition-colors">
          <span className="text-[10px] font-medium uppercase tracking-widest">Explore</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      {/* ── Stats Banner ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 py-16" ref={statsRef}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard value={500} suffix="+" label="Cooperatives Registered" inView={statsInView} />
            <StatCard value={12000} suffix="+" label="Members Tracked" inView={statsInView} />
            <StatCard value={98} suffix="%" label="Payment Accuracy" inView={statsInView} />
            <StatCard value={6} label="User Roles Supported" inView={statsInView} />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-1.5 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Platform Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
              Everything your cooperative needs
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-base">
              From member onboarding to payment processing, Smart-Coop handles every operational layer of your cooperative.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-gray-50/70 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: Steps */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-1.5 mb-5">
                <Zap className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">How It Works</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight mb-3">
                Up and running in minutes
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-sm">
                Our streamlined onboarding gets your cooperative operational immediately.
              </p>
              <div>
                {steps.map((s) => (
                  <StepCard key={s.num} {...s} />
                ))}
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative lg:sticky lg:top-24">
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
                  {["Overview", "Payments", "Reports"].map((tab, i) => (
                    <button
                      key={tab}
                      className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors ${
                        i === 0
                          ? "text-emerald-600 border-b-2 border-emerald-600 bg-white dark:bg-gray-900"
                          : "text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-4">
                  {/* KPI row */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Active Members", value: "24", delta: "+3", up: true },
                      { label: "Pending Payments", value: "RF 12,400", delta: "-8%", up: false },
                    ].map((k) => (
                      <div key={k.label} className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                        <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">{k.label}</p>
                        <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">{k.value}</p>
                        <p className={`text-xs font-semibold mt-1 ${k.up ? "text-emerald-500" : "text-amber-500"}`}>{k.delta} this week</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Activity Completion</p>
                    {[
                      { label: "Timber deliveries", pct: 82, color: "bg-emerald-500" },
                      { label: "Coffee processing", pct: 65, color: "bg-blue-500" },
                      { label: "Maize tracking", pct: 48, color: "bg-purple-500" },
                    ].map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">{b.label}</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{b.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent approvals */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Recent Approvals</p>
                    {[
                      { name: "thomas · 5 Kg timber", status: "Approved", color: "text-emerald-500" },
                      { name: "alice · 12 Kg coffee", status: "Pending", color: "text-amber-500" },
                    ].map((r) => (
                      <div key={r.name} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2.5">
                        <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{r.name}</p>
                        <span className={`text-[10px] font-bold ${r.color}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Roles ──────────────────────────────────────────────────────────── */}
      <section id="roles" className="py-24 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-1.5 mb-4">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Role-Based Access</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
              Built for every stakeholder
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Six distinct roles, each with tailored dashboards and permissions — giving everyone exactly what they need.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <RoleCard key={r.role} {...r} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-6">
            Ready to modernize your cooperative?
          </h2>
          <p className="text-emerald-100/80 text-lg max-w-2xl mx-auto mb-10">
            Join hundreds of cooperatives already using Smart-Coop to track activities, manage payments, and grow together.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/apply"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-bold text-emerald-700 shadow-xl hover:bg-emerald-50 hover:-translate-y-0.5 transition-all duration-200"
            >
              Register your Cooperative
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-4 text-sm font-bold text-white hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-sm"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 dark:bg-black border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-white text-[15px]">Smart-Coop</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Rwanda's modern cooperative resource management platform — built to empower farmers, field officers, and administrators.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Platform</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Sign In", to: "/login" },
                  { label: "Register Cooperative", to: "/apply" },
                  { label: "Features", href: "#features" },
                  { label: "Roles", href: "#roles" },
                ].map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className="text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className="text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Info */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">System</p>
              <ul className="space-y-2.5">
                {[
                  "Role-based access control",
                  "End-to-end data security",
                  "MoMo payment integration",
                  "Real-time notifications",
                  "PDF & Excel exports",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} Smart-Coop. All rights reserved.
            </p>
            <p className="text-xs text-gray-700">
              Built for Rwandan cooperative excellence 🌱
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
