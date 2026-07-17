import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';

import { LandingPage } from '../pages/Landing/LandingPage';
import { LoginPage } from '../pages/Login/LoginPage';
import { RegisterPage } from '../pages/Register/RegisterPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { UploadPage } from '../pages/Projects/UploadPage';
import { DeploymentProgressPage } from '../pages/Deployment/DeploymentProgressPage';
import { DoctorPage } from '../pages/Doctor/DoctorPage';
import { LogsPage } from '../pages/Logs/LogsPage';
import { MonitoringPage } from '../pages/Monitoring/MonitoringPage';
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';

export const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Pages (No layout) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<RegisterPage />} />

        {/* Authenticated Workspace Pages (With DashboardLayout) */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/upload"
          element={
            <DashboardLayout>
              <UploadPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/deployment"
          element={
            <DashboardLayout>
              <DeploymentProgressPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/doctor"
          element={
            <DashboardLayout>
              <DoctorPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/logs"
          element={
            <DashboardLayout>
              <LogsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/monitoring"
          element={
            <DashboardLayout>
              <MonitoringPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/analytics"
          element={
            <DashboardLayout>
              <AnalyticsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
};
