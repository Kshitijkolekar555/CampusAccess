import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Visitors } from '../pages/Visitors';
import { Vehicles } from '../pages/Vehicles';
import { Vendors } from '../pages/Vendors';
import { StudentPasses } from '../pages/StudentPasses';
import { HostelOutpasses } from '../pages/HostelOutpasses';
import { Guards } from '../pages/Guards';
import { Shifts } from '../pages/Shifts';
import { Users } from '../pages/Users';
import { Gates } from '../pages/Gates';
import { Notifications } from '../pages/Notifications';
import { Profile } from '../pages/Profile';
import type { UserRole } from '../types';

// Protected Route Component
const ProtectedLayout: React.FC<{ allowedRoles?: UserRole[] }> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/visitors" element={<Visitors />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/student-passes" element={<StudentPasses />} />
        <Route path="/hostel-outpasses" element={<HostelOutpasses />} />
        <Route path="/guards" element={<Guards />} />
        <Route path="/shifts" element={<Shifts />} />
        <Route path="/users" element={<Users />} />
        <Route path="/gates" element={<Gates />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Default Catch All */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
