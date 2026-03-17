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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">View and update your personal information</p>
        </div>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700 animate-slide-down">
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-emerald-600" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-400 text-xs">Username</p>
                <p className="text-gray-900 font-medium">{user?.username || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-400 text-xs">Email</p>
                <p className="text-gray-900 font-medium">{user?.email || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-400 text-xs">Phone</p>
                <p className="text-gray-900 font-medium">{user?.phone || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-400 text-xs">Role</p>
                <Badge className="bg-emerald-50 text-emerald-700" variant="secondary">{user?.role || "-"}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="h-4 w-4 text-emerald-600" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter full name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nationalId">National ID</Label>
                  <Input id="nationalId" name="nationalId" value={form.nationalId} onChange={handleChange} placeholder="e.g., 1199880012345678" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Gender</Label>
                  <select id="gender" name="gender" value={form.gender} onChange={handleChange}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="KG 123 St, Kigali" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleCancel}>
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
                  <p className="text-gray-900 font-medium">{profile?.fullName || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-xs">National ID</p>
                  <p className="text-gray-900 font-medium">{profile?.nationalId || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-xs">Date of Birth</p>
                  <p className="text-gray-900 font-medium">{profile?.dateOfBirth || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-xs">Gender</p>
                  <p className="text-gray-900 font-medium">{profile?.gender || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm sm:col-span-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-xs">Address</p>
                  <p className="text-gray-900 font-medium">{profile?.address || "-"}</p>
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
