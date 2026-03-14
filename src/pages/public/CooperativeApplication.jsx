import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
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
import { submitCooperativeApplication } from "@/services/cooperativeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CATEGORY_OPTIONS = [
  "COFFEE", "TRANSPORT", "LIVESTOCK", "TRADE",
  "FISHERY", "HANDICRAFT", "SAVINGS", "HOUSING",
];

const TYPE_OPTIONS = [
  "AGRICULTURE", "FINANCIAL", "SERVICE", "TRANSPORT", "ARTISAN",
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

const Field = ({ id, label, icon: Icon, value, onChange, placeholder, type = "text" }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      )}
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={Icon ? "pl-9" : ""}
        required
      />
    </div>
  </div>
);

const SelectField = ({ id, label, icon: Icon, value, onChange, options, placeholder }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
      )}
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required
        className={`flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
          Icon ? "pl-9" : ""
        } ${!value ? "text-gray-500" : "text-foreground"}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          {/* Left: Info panel */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 mb-3">
              <Leaf className="h-4 w-4" />
              Guest Application
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Register your cooperative
            </h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Submit your cooperative details as a guest. Our team will review the application,
              validate the registration information, and contact your representative shortly.
            </p>

            <div className="mt-6 space-y-3">
              {benefitItems.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card className="mt-6">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Before you submit</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Ensure your RCA registration number and TIN match your official records.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Use a reachable representative phone number so the review team can follow up quickly.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right: Form */}
          <Card className="shadow-sm">
            <CardContent className="p-6 sm:p-8">
              {!isSubmitted ? (
                <>
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Cooperative application</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">Submit your organization details</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Complete the form below and we&apos;ll send your application for review.
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mb-4 animate-slide-down">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Legal details */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <Separator className="flex-1" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Legal details</span>
                        <Separator className="flex-1" />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field id="name" label="Cooperative name" icon={Building2} value={formData.name} onChange={handleChange} placeholder="e.g. Sunrise Coffee Cooperative" />
                        <Field id="rcaRegistrationNumber" label="RCA registration number" icon={FileBadge2} value={formData.rcaRegistrationNumber} onChange={handleChange} placeholder="e.g. RCA-2026-001" />
                        <Field id="tinNumber" label="TIN number" icon={FileBadge2} value={formData.tinNumber} onChange={handleChange} placeholder="e.g. 1234567890" />
                        <SelectField id="category" label="Category" icon={Sparkles} value={formData.category} onChange={handleChange} options={CATEGORY_OPTIONS} placeholder="Select category" />
                        <div className="sm:col-span-2">
                          <SelectField id="type" label="Type" icon={Building2} value={formData.type} onChange={handleChange} options={TYPE_OPTIONS} placeholder="Select type" />
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <Separator className="flex-1" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Location</span>
                        <Separator className="flex-1" />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field id="province" label="Province" icon={MapPin} value={formData.province} onChange={handleChange} placeholder="e.g. Kigali" />
                        <Field id="district" label="District" icon={MapPin} value={formData.district} onChange={handleChange} placeholder="e.g. Gasabo" />
                        <Field id="sector" label="Sector" icon={MapPin} value={formData.sector} onChange={handleChange} placeholder="e.g. Remera" />
                      </div>
                    </div>

                    {/* Representative */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <Separator className="flex-1" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Representative</span>
                        <Separator className="flex-1" />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field id="representativeName" label="Representative name" icon={UserRound} value={formData.representativeName} onChange={handleChange} placeholder="e.g. Jean Bosco" />
                        <Field id="representativePhone" label="Representative phone" icon={Phone} type="tel" value={formData.representativePhone} onChange={handleChange} placeholder="e.g. 0788123456" />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="max-w-md text-xs text-gray-400">
                        By submitting, you confirm the information is accurate and can be reviewed by Smart-Coop administrators.
                      </p>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" />Submit application</>
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex min-h-[500px] flex-col items-center justify-center text-center animate-fade-in">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Application received!</h2>
                  <p className="mt-2 max-w-sm text-sm text-gray-500">
                    Our Super Admin will review your details and contact you shortly.
                  </p>

                  <div className="mt-6 grid w-full max-w-md gap-3 sm:grid-cols-2">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">What happens next</p>
                        <p className="mt-1 text-sm text-gray-600">Your records will be reviewed for completeness and eligibility.</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Follow-up</p>
                        <p className="mt-1 text-sm text-gray-600">The representative will be contacted using the phone number provided.</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Link to="/login">
                    <Button variant="outline" className="mt-6">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Return to Login
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default CooperativeApplication;
