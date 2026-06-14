import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
  UserCircle,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    nationalId: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    profilePictureUrl: "",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/profile/me");
        setProfile(data);
        setForm({
          fullName: data?.fullName || "",
          nationalId: data?.nationalId || "",
          address: data?.address || "",
          dateOfBirth: data?.dateOfBirth || "",
          gender: data?.gender || "",
          profilePictureUrl: data?.profilePictureUrl || "",
        });
      } catch {
        setProfile(null);
      }
      finally { setLoading(false); }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const { data } = await api.put("/profile/me", form);
      setProfile(data);
      setEditing(false);
      setSuccess("Profile updated successfully!"); setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    setEditing(false); setError("");
    if (profile) {
      setForm({
        fullName: profile.fullName || "",
        nationalId: profile.nationalId || "",
        address: profile.address || "",
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender || "",
        profilePictureUrl: profile.profilePictureUrl || "",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
        <p className="text-sm text-gray-400">Loading profile...</p>
      </div>
    );
  }

  const isLegacy = localStorage.getItem("designMode") === "legacy";

  if (isLegacy) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and update your personal information</p>
          </div>
          {!editing && (
            <Button variant="outline" className="dark:border-gray-800 dark:hover:bg-gray-900" onClick={() => setEditing(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-205 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 animate-slide-down">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="animate-slide-down">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Account Info (read-only) */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-3 border-b dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
              <Shield className="h-4 w-4 text-emerald-600" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-xs">Username</p>
                  <p className="text-gray-900 dark:text-white font-medium">{user?.username || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-xs">Email</p>
                  <p className="text-gray-900 dark:text-white font-medium">{user?.email || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-xs">Phone</p>
                  <p className="text-gray-900 dark:text-white font-medium">{user?.phone || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-xs">Role</p>
                  <Badge className="bg-emerald-50 dark:bg-emerald-950/35 text-emerald-700 dark:text-emerald-400 dark:border-emerald-900/50" variant="secondary">{user?.role || "-"}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-3 border-b dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
              <UserCircle className="h-4 w-4 text-emerald-600" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">Full Name</Label>
                    <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nationalId" className="text-gray-700 dark:text-gray-300">National ID</Label>
                    <Input id="nationalId" name="nationalId" value={form.nationalId} onChange={handleChange} placeholder="e.g., 1199880012345678" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth" className="text-gray-700 dark:text-gray-300">Date of Birth</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-gray-700 dark:text-gray-300">Gender</Label>
                    <select id="gender" name="gender" value={form.gender} onChange={handleChange}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent dark:bg-gray-950 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-gray-900 dark:text-white">
                      <option value="" className="dark:bg-gray-950">Select gender</option>
                      <option value="Male" className="dark:bg-gray-950">Male</option>
                      <option value="Female" className="dark:bg-gray-950">Female</option>
                      <option value="Other" className="dark:bg-gray-950">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">Address</Label>
                  <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="KG 123 St, Kigali" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
                  <Button type="button" variant="outline" className="dark:border-gray-800 dark:hover:bg-gray-900" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Full Name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{profile?.fullName || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-xs">National ID</p>
                    <p className="text-gray-900 dark:text-white font-medium">{profile?.nationalId || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Date of Birth</p>
                    <p className="text-gray-900 dark:text-white font-medium">{profile?.dateOfBirth || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Gender</p>
                    <p className="text-gray-900 dark:text-white font-medium">{profile?.gender || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm sm:col-span-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Address</p>
                    <p className="text-gray-900 dark:text-white font-medium">{profile?.address || "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Modernized Render ─────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and update your personal information</p>
        </div>
        {!editing && (
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            className="rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 font-bold text-xs h-9 px-3.5 gap-1.5 dark:text-gray-300 dark:hover:text-white"
          >
            <Edit3 className="h-4 w-4 text-gray-500 dark:text-gray-450" /> Edit Profile
          </Button>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900 text-emerald-700 dark:text-emerald-450 animate-slide-down rounded-xl shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="font-semibold text-xs">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="animate-slide-down rounded-xl shadow-xs">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-semibold text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Account Info (read-only) */}
      <Card className="border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xs bg-white dark:bg-gray-900">
        <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-950 dark:text-white">
            <Shield className="h-4 w-4 text-emerald-600" /> Account Security Info
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex items-center gap-3.5 text-xs">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-450">
                <User className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Username</p>
                <p className="text-gray-900 dark:text-gray-100 font-semibold mt-0.5">{user?.username || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 text-xs">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-450">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Email Address</p>
                <p className="text-gray-900 dark:text-gray-100 font-semibold mt-0.5">{user?.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 text-xs">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-450">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Phone Number</p>
                <p className="text-gray-900 dark:text-gray-100 font-semibold mt-0.5 font-mono">{user?.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 text-xs">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-450">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">System Role</p>
                <Badge
                  className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border-emerald-250 dark:border-emerald-900/50 mt-1 font-bold text-[9px] px-2"
                  variant="outline"
                >
                  {user?.role?.replace(/^ROLE_/, "") || "—"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card className="border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xs bg-white dark:bg-gray-900">
        <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-950 dark:text-white">
            <UserCircle className="h-4 w-4 text-emerald-600" /> Personal Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold text-gray-800 dark:text-gray-300">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="rounded-xl border-gray-250 focus-visible:ring-emerald-500/25 text-xs h-9.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nationalId" className="text-xs font-semibold text-gray-800 dark:text-gray-300">National ID</Label>
                  <Input
                    id="nationalId"
                    name="nationalId"
                    value={form.nationalId}
                    onChange={handleChange}
                    placeholder="e.g., 1199880012345678"
                    className="rounded-xl border-gray-250 dark:border-gray-800 focus-visible:ring-emerald-500/25 text-xs h-9.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth" className="text-xs font-semibold text-gray-800 dark:text-gray-300">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className="rounded-xl border-gray-250 dark:border-gray-800 focus-visible:ring-emerald-500/25 text-xs h-9.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-xs font-semibold text-gray-800 dark:text-gray-300">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="flex h-9.5 w-full rounded-xl border border-gray-250 dark:border-gray-800 bg-transparent dark:bg-gray-950 px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:border-emerald-500 text-gray-900 dark:text-white"
                  >
                    <option value="" className="dark:bg-gray-950">Select gender</option>
                    <option value="Male" className="dark:bg-gray-950">Male</option>
                    <option value="Female" className="dark:bg-gray-950">Female</option>
                    <option value="Other" className="dark:bg-gray-950">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold text-gray-800 dark:text-gray-300">Physical Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="KG 123 St, Kigali"
                  className="rounded-xl border-gray-250 dark:border-gray-800 focus-visible:ring-emerald-500/25 text-xs h-9.5"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-50 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-xs font-bold h-9 dark:text-gray-300 dark:hover:text-white"
                >
                  <X className="mr-1.5 h-4 w-4 text-gray-500 dark:text-gray-450" /> Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs text-xs font-bold gap-1.5 h-9"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Profile
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex items-center gap-3.5 text-xs">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-450">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Full Name</p>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold mt-0.5">{profile?.fullName || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 text-xs">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-450">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">National ID</p>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold mt-0.5 font-mono">{profile?.nationalId || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 text-xs">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-450">
                  <CalendarDays className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Date of Birth</p>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold mt-0.5">{profile?.dateOfBirth || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 text-xs">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-450">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Gender</p>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold mt-0.5">{profile?.gender || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 text-xs sm:col-span-2">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-450">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Physical Address</p>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold mt-0.5">{profile?.address || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
