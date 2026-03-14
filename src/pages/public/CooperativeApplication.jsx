import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileBadge2,
  Leaf,
  Loader2,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { submitCooperativeApplication } from "../../services/cooperativeService";

const CATEGORY_OPTIONS = [
  "COFFEE",
  "TRANSPORT",
  "LIVESTOCK",
  "TRADE",
  "FISHERY",
  "HANDICRAFT",
  "SAVINGS",
  "HOUSING",
];

const TYPE_OPTIONS = [
  "AGRICULTURE",
  "FINANCIAL",
  "SERVICE",
  "TRANSPORT",
  "ARTISAN",
];

const initialFormState = {
  name: "",
  rcaRegistrationNumber: "",
  tinNumber: "",
  category: "",
  type: "",
  province: "",
  district: "",
  sector: "",
  representativeName: "",
  representativePhone: "",
};

const Field = ({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
}) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Icon className="h-4 w-4 text-slate-400" />
        </span>
      )}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className={`w-full rounded-2xl border border-slate-200 bg-white/85 py-3.5 pr-4 text-sm text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.05)] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 ${
          Icon ? "pl-11" : "pl-4"
        }`}
      />
    </div>
  </div>
);

const SelectField = ({ id, label, icon: Icon, value, onChange, options, placeholder }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Icon className="h-4 w-4 text-slate-400" />
        </span>
      )}
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required
        className={`w-full appearance-none rounded-2xl border border-slate-200 bg-white/85 py-3.5 pr-11 text-sm text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.05)] outline-none transition-all duration-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 ${
          Icon ? "pl-11" : "pl-4"
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
    </div>
  </div>
);

const CooperativeApplication = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const benefitItems = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: "Secure review process",
        description: "Your submission goes directly to the platform's super admin for verification.",
      },
      {
        icon: Sparkles,
        title: "Fast onboarding",
        description: "Approved cooperatives can be activated and configured without re-entering details.",
      },
      {
        icon: FileBadge2,
        title: "Professional intake",
        description: "Provide your legal and representative details once in a clean application flow.",
      },
    ],
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
    );

    try {
      const response = await submitCooperativeApplication(payload);
      if (response.status === 200 || response.status === 201) {
        setIsSubmitted(true);
        setFormData(initialFormState);
        return;
      }

      setError("We could not submit your application right now. Please try again.");
    } catch (err) {
      setError(err.response?.data?.message || "We could not submit your application right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_25%),linear-gradient(135deg,#020617_0%,#0f172a_42%,#111827_100%)] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float absolute -left-20 top-10 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="animate-float-delayed absolute right-0 top-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="animate-float-slow absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.02fr_1.18fr]">
          <section className="glass-dark rounded-[32px] border border-white/10 p-7 shadow-2xl shadow-black/20 sm:p-10 lg:p-12">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold tracking-[0.18em] text-slate-200 hover:border-teal-400/40 hover:bg-white/[0.07] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>

            <div className="mt-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-200">
                <Leaf className="h-3.5 w-3.5" />
                Guest application portal
              </div>
              <h1 className="max-w-xl text-4xl font-black leading-tight text-white sm:text-5xl">
                Register your cooperative for onboarding on <span className="gradient-text">Smart-Coop</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Submit your cooperative details as a guest. Our team will review the application,
                validate the registration information, and contact your representative shortly.
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              {benefitItems.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 shadow-[0_10px_35px_rgba(2,6,23,0.22)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/80 to-indigo-500/80 shadow-lg shadow-teal-500/20">
                      <Icon className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">{title}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.06] to-white/[0.02] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Before you submit</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                  Ensure your RCA registration number and TIN match your official records.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                  Use a reachable representative phone number so the review team can follow up quickly.
                </li>
              </ul>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.94] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8 lg:p-10 text-slate-900">
            {!isSubmitted ? (
              <>
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-teal-600">Cooperative application</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">Submit your organization details</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Complete the form below and we&apos;ll send your application for administrative review.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Estimated review</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">1–3 business days</p>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 animate-slide-down">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
                      <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                    </div>
                    <p className="pt-1 font-medium">{error}</p>
                  </div>
                )}

                <form className="mt-6 space-y-7" onSubmit={handleSubmit}>
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="h-px flex-1 bg-slate-200" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Legal details</p>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        id="name"
                        label="Cooperative name"
                        icon={Building2}
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Sunrise Coffee Cooperative"
                      />
                      <Field
                        id="rcaRegistrationNumber"
                        label="RCA registration number"
                        icon={FileBadge2}
                        value={formData.rcaRegistrationNumber}
                        onChange={handleChange}
                        placeholder="e.g. RCA-2026-001"
                      />
                      <Field
                        id="tinNumber"
                        label="TIN number"
                        icon={FileBadge2}
                        value={formData.tinNumber}
                        onChange={handleChange}
                        placeholder="e.g. 1234567890"
                      />
                      <SelectField
                        id="category"
                        label="Category"
                        icon={Sparkles}
                        value={formData.category}
                        onChange={handleChange}
                        options={CATEGORY_OPTIONS}
                        placeholder="Select category"
                      />
                      <div className="sm:col-span-2">
                        <SelectField
                          id="type"
                          label="Type"
                          icon={Building2}
                          value={formData.type}
                          onChange={handleChange}
                          options={TYPE_OPTIONS}
                          placeholder="Select type"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="h-px flex-1 bg-slate-200" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Location</p>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field
                        id="province"
                        label="Province"
                        icon={MapPin}
                        value={formData.province}
                        onChange={handleChange}
                        placeholder="e.g. Kigali"
                      />
                      <Field
                        id="district"
                        label="District"
                        icon={MapPin}
                        value={formData.district}
                        onChange={handleChange}
                        placeholder="e.g. Gasabo"
                      />
                      <Field
                        id="sector"
                        label="Sector"
                        icon={MapPin}
                        value={formData.sector}
                        onChange={handleChange}
                        placeholder="e.g. Remera"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="h-px flex-1 bg-slate-200" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Representative</p>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        id="representativeName"
                        label="Representative name"
                        icon={UserRound}
                        value={formData.representativeName}
                        onChange={handleChange}
                        placeholder="e.g. Jean Bosco"
                      />
                      <Field
                        id="representativePhone"
                        label="Representative phone"
                        icon={Phone}
                        type="tel"
                        value={formData.representativePhone}
                        onChange={handleChange}
                        placeholder="e.g. 0788123456"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-md text-xs leading-5 text-slate-500">
                      By submitting this form, you confirm that the information provided is accurate and can be reviewed by Smart-Coop administrators.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-70 ${
                        isSubmitting
                          ? "bg-gradient-to-r from-teal-600 to-indigo-600"
                          : "bg-gradient-to-r from-teal-600 to-indigo-600 shadow-teal-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-500/30"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit application
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex min-h-[680px] flex-col items-center justify-center text-center animate-fade-in">
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/25">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                  Application received
                </div>
                <h2 className="mt-5 max-w-xl text-3xl font-black text-slate-900 sm:text-4xl">
                  Thank you for your submission.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-500">
                  Your application has been received! Our Super Admin will review your details and contact you shortly.
                </p>
                <div className="mt-10 grid w-full max-w-xl gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left sm:grid-cols-2">
                  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">What happens next</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Your records will be reviewed for completeness and eligibility.</p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Follow-up</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">The representative will be contacted using the phone number provided.</p>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-500/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to Login
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default CooperativeApplication;

