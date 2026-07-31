import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/users';
import { authApi } from '../api/auth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { User as UserIcon, Lock, Shield, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

export const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const updatedUser = await userApi.updateProfile({ fullName, email, phone });
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoadingPassword(true);
    try {
      await authApi.changePassword({ currentPassword: oldPassword, newPassword });
      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          User Profile & Security Settings
        </h2>
        <p className="text-sm text-slate-500">Manage your personal credentials, contact details, and account security.</p>
      </div>

      {/* User Summary Card */}
      <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
          {user?.fullName?.charAt(0) || 'U'}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{user?.fullName}</h3>
            <Badge variant="purple">{user?.role}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">@{user?.username} • System Account</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-indigo-600" />
            Personal Details
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="w-4 h-4" />} />
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} leftIcon={<Phone className="w-4 h-4" />} />

            <Button type="submit" variant="primary" isLoading={loadingProfile} className="w-full">
              Save Profile Changes
            </Button>
          </form>
        </Card>

        {/* Change Password */}
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            Security & Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input label="Current Password" type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            <Input label="New Password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Input label="Confirm New Password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

            <Button type="submit" variant="secondary" isLoading={loadingPassword} className="w-full">
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
