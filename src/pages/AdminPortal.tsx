import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminPortalLayout from '@/components/admin/AdminPortalLayout';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import SubmissionManagement from '@/pages/admin/SubmissionManagement';
import ForecastPage from '@/pages/admin/ForecastPage';
import HotspotAnalysis from '@/pages/admin/HotspotAnalysis';
import WeatherAnalysis from '@/pages/admin/WeatherAnalysis';
import ModelPerformance from '@/pages/admin/ModelPerformance';
import DataExplorer from '@/pages/admin/DataExplorer';
import AuditLog from '@/pages/admin/AuditLog';
import { isAuthenticated } from '@/lib/auth';

const ProtectedAdmin: React.FC = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminPortalLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="submissions" element={<SubmissionManagement />} />
        <Route path="forecast" element={<ForecastPage />} />
        <Route path="hotspots" element={<HotspotAnalysis />} />
        <Route path="weather" element={<WeatherAnalysis />} />
        <Route path="models" element={<ModelPerformance />} />
        <Route path="explorer" element={<DataExplorer />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminPortalLayout>
  );
};

const AdminPortal: React.FC = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="*" element={<ProtectedAdmin />} />
    </Routes>
  );
};

export default AdminPortal;
