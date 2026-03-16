import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslate } from "@/lib/i18n";
import axios from "axios";

const initialState = { title: "", description: "" };

const RaiseIssue = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/v1/issues", form);
      setSuccess(true);
      setForm(initialState);
    } catch (err) {
      setError(err.response?.data?.message || t("support.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto py-10">
      <Card>
        <CardContent className="p-6">
          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="title">{t("support.title")}</Label>
                <Input id="title" name="title" value={form.title} onChange={handleChange} required placeholder={t("support.titlePlaceholder")}/>
              </div>
              <div>
                <Label htmlFor="description">{t("support.description")}</Label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} required rows={5} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder={t("support.descriptionPlaceholder")}/>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
              <Button type="submit" className="bg-emerald-600 text-white" disabled={loading}>
                {loading ? t("support.submitting") : t("support.submit")}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center text-center min-h-[200px] animate-fade-in">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-4" />
              <h2 className="text-lg font-bold text-gray-900">{t("support.successTitle")}</h2>
              <p className="mt-2 text-sm text-gray-500">{t("support.successMsg")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default RaiseIssue;

