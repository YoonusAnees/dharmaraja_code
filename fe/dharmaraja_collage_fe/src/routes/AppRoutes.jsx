import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import ProtectedRoute from "../components/layout/ProtectedRoute";
import AdminLayout from "../components/layout/AdminLayout";
import MemberLayout from "../components/layout/MemberLayout";

import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageBadges from "../pages/admin/ManageBadges";
import ManageCampaigns from "../pages/admin/ManageCampaigns";
import ManageEvents from "../pages/admin/ManageEvents";
import ManageReports from "../pages/admin/ManageReports";
import Notifications from "../pages/admin/Notifications";

import MemberDashboard from "../pages/member/MemberDashboard";
import Campaigns from "../pages/member/Campaigns";
import Badges from "../pages/member/Badges";
import Events from "../pages/member/Events";
import Reports from "../pages/member/Reports";
import MemberNotifications from "../pages/member/MemberNotifications";
import Directory from "../pages/member/Directory";
import Profile from "../pages/member/Profile";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="badges" element={<ManageBadges />} />
        <Route path="campaigns" element={<ManageCampaigns />} />
        <Route path="events" element={<ManageEvents />} />
        <Route path="reports" element={<ManageReports />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route
        path="/member"
        element={
          <ProtectedRoute role="member">
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MemberDashboard />} />
        <Route path="directory" element={<Directory />} />
        <Route path="profile" element={<Profile />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="badges" element={<Badges />} />
        <Route path="events" element={<Events />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<MemberNotifications />} />
      </Route>
    </Routes>
  );
}