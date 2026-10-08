import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';
import { Login } from '../pages/Login';
import { LandingPage } from '../pages/LandingPage';
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
import { FacultyDirectory } from '../pages/FacultyDirectory';
import type { UserRole } from '../types';

// Protected Route Component with strict role checks
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
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/faculties" element={<FacultyDirectory />} />

      {/* General Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Role Protected Routes */}
      <Route element={<ProtectedLayout allowedRoles={['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD', 'GUARD', 'STAFF']} />}>
        <Route path="/visitors" element={<Visitors />} />
      </Route>

      <Route element={<ProtectedLayout allowedRoles={['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD', 'GUARD']} />}>
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/guards" element={<Guards />} />
        <Route path="/shifts" element={<Shifts />} />
        <Route path="/gates" element={<Gates />} />
      </Route>

      <Route element={<ProtectedLayout allowedRoles={['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD', 'GUARD', 'HOSTEL_WARDEN', 'STUDENT']} />}>
        <Route path="/student-passes" element={<StudentPasses />} />
        <Route path="/hostel-outpasses" element={<HostelOutpasses />} />
      </Route>

      <Route element={<ProtectedLayout allowedRoles={['ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD', 'GUARD', 'STAFF', 'HOSTEL_WARDEN']} />}>
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
        <Route path="/users" element={<Users />} />
      </Route>

      {/* Default Catch All */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
