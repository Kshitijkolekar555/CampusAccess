import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';
import { Login } from '../pages/Login';
import { LandingPage } from '../pages/LandingPage';
import { EnterSystem } from '../pages/EnterSystem';
import { StudentPortal } from '../pages/StudentPortal';
import { VisitorPortal } from '../pages/VisitorPortal';
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
import { TeacherDashboardView } from '../pages/TeacherDashboardView';
import type { UserRole } from '../types';

// Protected Route Component with strict role checks
const ProtectedLayout: React.FC<{ allowedRoles?: UserRole[] }> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Supported roles include Student, Guards, Faculty, Staff, Admin, and Hostel Warden
  const supportedRoles: UserRole[] = ['STUDENT', 'SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'STAFF', 'FACULTY', 'ADMIN', 'HOSTEL_WARDEN'];
  if (user && !supportedRoles.includes(user.role)) {
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
      {/* ── Public Routes ─────────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />

      {/* Enter System selection page */}
      <Route path="/enter" element={<EnterSystem />} />

      {/* Student portal (student login/register — STUDENT role only) */}
      <Route path="/student/login"    element={<StudentPortal />} />
      <Route path="/student/register" element={<StudentPortal />} />

      {/* Visitor self-registration portal */}
      <Route path="/visitor" element={<VisitorPortal />} />

      {/* Guard/legacy login route — used by guards and as fallback */}
      <Route path="/login" element={<Login />} />

      {/* ── General Protected Routes ──────────────────────────────────── */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile"   element={<Profile />} />
      </Route>

      {/* ── Guard-Only Routes ─────────────────────────────────────────── */}
      <Route element={<ProtectedLayout allowedRoles={['SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER']} />}>
        <Route path="/visitors" element={<Visitors />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vendors"  element={<Vendors />} />
        <Route path="/guards"   element={<Guards />} />
        <Route path="/gates"    element={<Gates />} />
      </Route>

      {/* ── Passes & Outpasses (Guard, Student, Warden, Admin) ────────── */}
      <Route element={<ProtectedLayout allowedRoles={['SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'STUDENT', 'HOSTEL_WARDEN', 'ADMIN']} />}>
        <Route path="/student-passes"   element={<StudentPasses />} />
        <Route path="/outpasses"        element={<HostelOutpasses />} />
        <Route path="/notifications"    element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* ── Teacher / Staff Routes ────────────────────────────────────── */}
      <Route element={<ProtectedLayout allowedRoles={['FACULTY', 'STAFF', 'ADMIN']} />}>
        <Route path="/teacher" element={<TeacherDashboardView />} />
      </Route>

      {/* ── Default Catch-All ─────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
