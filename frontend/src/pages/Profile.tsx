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
    if (!oldPassword.trim()) {
      toast.error('Current password is required');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setLoadingPassword(true);
    try {
      await authApi.changePassword({ currentPassword: oldPassword, newPassword, confirmPassword });
      toast.success('Password updated successfully! Please sign in again if prompted.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 22, color: 'var(--text)', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
          Profile & Security
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--mute)', margin: 0 }}>Manage your credentials, contact details, and account password.</p>
      </div>

      {/* User Summary Card */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5" style={{ background: 'var(--ink)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4 }}>
        <div style={{ width: 44, height: 44, borderRadius: 4, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 20, color: '#e8e6e2', flexShrink: 0 }}>
          {user?.fullName?.charAt(0) || 'U'}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 17, color: '#f0ede8', margin: 0, letterSpacing: '-0.01em' }}>{user?.fullName}</h3>
            <Badge variant="purple">{user?.role}</Badge>
          </div>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>@{user?.username} · System Account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: '0 0 18px 0', letterSpacing: '-0.01em' }}>
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
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: '0 0 18px 0', letterSpacing: '-0.01em' }}>
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
