"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { User, Camera, Save, Lock, Mail, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const isGoogleUser = user?.provider === 'google';

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    setFormData({
      name: user.name || "",
      email: user.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    
    if (user.photo) {
      // Handle photo URL - if it's a local upload, prepend backend URL
      const photoUrl = user.photo.startsWith('http') 
        ? user.photo 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.photo}`;
      setPhotoPreview(photoUrl);
    }
  }, [user, router]);

  const handlePhotoChange = (e) => {
    // Prevent Google users from changing photo
    if (isGoogleUser) {
      setError("Google users cannot change their profile photo");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      // Validate name
      if (!formData.name.trim()) {
        setError("Name is required");
        setLoading(false);
        return;
      }

      // Validate password change if requested
      if (formData.newPassword && !isGoogleUser) {
        if (!formData.currentPassword) {
          setError("Current password is required to set new password");
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setError("New password must be at least 6 characters");
          setLoading(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError("New passwords do not match");
          setLoading(false);
          return;
        }
      }

      const formDataObj = new FormData();
      formDataObj.append("name", formData.name.trim());
      
      // Only allow photo upload for non-Google users
      if (photoFile && !isGoogleUser) {
        formDataObj.append("photo", photoFile);
      }

      if (formData.newPassword && !isGoogleUser) {
        formDataObj.append("currentPassword", formData.currentPassword);
        formDataObj.append("newPassword", formData.newPassword);
      }

      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${cleanBaseUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update user in context with proper ID mapping
      if (updateUser && data.user) {
        const updatedUser = {
          ...data.user,
          _id: data.user.id || data.user._id, // Map 'id' to '_id' for consistency
          // Ensure photo URL is complete for local uploads
          photo: data.user.photo?.startsWith('http') 
            ? data.user.photo 
            : data.user.photo 
              ? `${cleanBaseUrl}${data.user.photo}`
              : null
        };
        updateUser(updatedUser);
      }

      setMessage(data.message || "Profile updated successfully!");
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
      // Reset photo file
      setPhotoFile(null);
      
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#064E3B]" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
            <p className="text-slate-600 mt-2">Manage your account information and preferences</p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Profile Photo Section */}
            <div className="p-8 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Profile Photo</h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="h-32 w-32 rounded-full object-cover border-4 border-slate-100"
                      style={{ imageRendering: '-webkit-optimize-contrast', backfaceVisibility: 'hidden' }}
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-[#064E3B] to-[#065f46] flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-100">
                      {formData.name?.[0]?.toUpperCase() || <User className="h-10 w-10" />}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => !isGoogleUser && fileInputRef.current?.click()}
                    disabled={isGoogleUser}
                    className={`absolute bottom-0 right-0 p-2 text-white rounded-full transition-colors shadow-lg ${
                      isGoogleUser 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-[#064E3B] hover:bg-[#065f46]'
                    }`}
                    title={isGoogleUser ? 'Google users cannot change profile photo' : 'Change photo'}
                  >
                    {isGoogleUser ? <Lock className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={isGoogleUser}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{formData.name}</h3>
                  <p className="text-sm text-slate-500 mb-2">{formData.email}</p>
                  {isGoogleUser && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium text-xs">
                      <svg className="h-3 w-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google Account
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                {isGoogleUser ? (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Lock className="h-3 w-3" />
                    Profile photo is managed by your Google account
                  </span>
                ) : (
                  'Upload a new photo '
                )}
              </p>
            </div>

            {/* Basic Information */}
            <div className="p-8 border-b border-slate-200 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#064E3B] focus:border-[#064E3B] outline-none transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Email cannot be changed
                </p>
              </div>
            </div>

            {/* Password Section - Only for non-Google users */}
            {!isGoogleUser && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2">Change Password</h2>
                  <p className="text-sm text-slate-600">Leave blank if you don't want to change your password</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#064E3B] focus:border-[#064E3B] outline-none transition-all pr-12"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#064E3B] focus:border-[#064E3B] outline-none transition-all pr-12"
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#064E3B] focus:border-[#064E3B] outline-none transition-all pr-12"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-8 bg-slate-50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#064E3B] text-white font-semibold rounded-xl hover:bg-[#065f46] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
