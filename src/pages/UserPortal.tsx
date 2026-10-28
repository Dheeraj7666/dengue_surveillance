import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserPortalLayout from '@/components/user/UserPortalLayout';
import UserDashboard from '@/pages/user/UserDashboard';
import SubmissionForm from '@/pages/user/SubmissionForm';
import SubmissionHistory from '@/pages/user/SubmissionHistory';

const UserPortal: React.FC = () => {
  return (
    <UserPortalLayout>
      <Routes>
        <Route index element={<UserDashboard />} />
        <Route path="submit" element={<SubmissionForm />} />
        <Route path="history" element={<SubmissionHistory />} />
        <Route path="*" element={<Navigate to="/user" replace />} />
      </Routes>
    </UserPortalLayout>
  );
};

export default UserPortal;
