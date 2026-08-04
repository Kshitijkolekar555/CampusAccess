import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Shield, Eye, EyeOff, Lock, User as UserIcon, GraduationCap, UserPlus, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [loginType, setLoginType] = useState<'STANDARD' | 'STUDENT_PRN' | 'SIGNUP'>('STANDARD');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [prn, setPrn] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sign Up Form State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'ADMIN' | 'STUDENT' | 'SECURITY_GUARD' | 'STAFF' | 'VISITOR'>('STUDENT');

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all credentials');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({ username, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.fullName}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handlePrnVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prn.trim()) {
      toast.error('Please enter your PRN number');
      return;
    }

    setLoading(true);
    try {
      const studentData = await authApi.verifyPrn(prn.trim());
      const studentUser = {
        id: Date.now(),
        username: studentData.prn,
        role: 'STUDENT' as const,
        fullName: studentData.studentName,
        phone: studentData.mobileNumber,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setAuth(studentUser, studentData.accessToken, studentData.refreshToken);
      toast.success(`PRN Verified! Welcome, ${studentData.studentName}`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'PRN Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regUsername || !regPassword) {
      toast.error('Please fill in required fields (Full Name, Username, Password)');
      return;
    }

    setLoading(true);
    try {
      const newUser = await authApi.register({
        fullName: regFullName,
        username: regUsername,
        email: regEmail || `${regUsername.toLowerCase()}@pict.edu`,
        phone: regPhone || '9876543210',
        password: regPassword,
        role: regRole,
      });

      toast.success(`Account created for ${newUser.fullName}! Signing in...`);
      
      // Auto login after registration
      const data = await authApi.login({ username: regUsername, password: regPassword });
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      const errMsg =
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).join(', ')
          : err.response?.data?.message || 'Registration failed.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">CampusAccess</h2>
          <p className="text-xs font-medium text-slate-400 mt-1">Enterprise Security & Gate Control</p>
        </div>

        {/* Login / Sign Up Toggle */}
        <div className="flex bg-slate-950/80 p-1 rounded-2xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => setLoginType('STANDARD')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              loginType === 'STANDARD'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Role Login
          </button>
          <button
            type="button"
            onClick={() => setLoginType('STUDENT_PRN')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
              loginType === 'STUDENT_PRN'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Student (PRN)
          </button>
          <button
            type="button"
            onClick={() => setLoginType('SIGNUP')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
              loginType === 'SIGNUP'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up
          </button>
        </div>

        {/* Render Form */}
        {loginType === 'STANDARD' && (
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 font-semibold"
            >
              Sign In to System
            </Button>
          </form>
        )}

        {loginType === 'STUDENT_PRN' && (
          <form onSubmit={handlePrnVerification} className="space-y-4">
            <Input
              label="PRN Number"
              type="text"
              placeholder="e.g. 72012345 or 72145892K"
              value={prn}
              onChange={(e) => setPrn(e.target.value)}
              leftIcon={<GraduationCap className="w-4 h-4 text-indigo-400" />}
            />

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enter your official student PRN number. Your profile details will be verified and loaded automatically.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 font-semibold"
            >
              Verify & Enter Student Portal
            </Button>
          </form>
        )}

        {loginType === 'SIGNUP' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Select Role</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="STUDENT">Student (ROLE_STUDENT)</option>
                <option value="SECURITY_GUARD">Guard (ROLE_GUARD)</option>
                <option value="STAFF">Staff (ROLE_STAFF)</option>
                <option value="VISITOR">Visitor (ROLE_VISITOR)</option>
              </select>
            </div>

            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Siddharth Roy"
              value={regFullName}
              onChange={(e) => setRegFullName(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Username / PRN"
              type="text"
              placeholder="Choose a username or PRN"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              leftIcon={<Shield className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="student@pict.edu"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label="Mobile Phone"
              type="text"
              placeholder="9876543210"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a strong password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 font-semibold"
            >
              Create Account & Sign In
            </Button>
          </form>
        )}

        {/* Credentials Info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Default Admin Credentials</p>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2 text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
            <span>admin</span>
            <span className="text-slate-600">•</span>
            <span>ChangeMe@123</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
