import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ServerTimeProvider, useServerTime } from './context/ServerTimeContext';
import InternalNetworkBar from './components/InternalNetworkBar';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import SuperAdminSecureGate from './components/SuperAdminSecureGate';
import InternalHubView from './views/InternalHubView';
import OfficeAdminDashboardView from './views/OfficeAdminDashboardView';
import ImsAdminDashboardView from './views/ImsAdminDashboardView';
import EmployeePortalView from './views/EmployeePortalView';
import InternPortalView from './views/InternPortalView';
import FormsDownloadsView from './views/FormsDownloadsView';
import SuperAdminView from './views/SuperAdminView';
import AiSuiteView from './views/AiSuiteView';
import FileTransferView from './views/FileTransferView';

function RootRedirect() {
  const { user } = useAuth();

  if (!user || !user.isAuthenticated) {
    return <Navigate to="/hub" replace />;
  }

  if (user.role === 'Super Admin') {
    return <Navigate to="/superadmin" replace />;
  }
  if (user.role === 'Office Admin' || user.role === 'Admin') {
    return <Navigate to="/office-admin" replace />;
  }
  if (user.role === 'IMS Admin' || user.role === 'IMS Officer') {
    return <Navigate to="/ims-admin" replace />;
  }
  if (user.role === 'Employee') {
    return <Navigate to="/employee-portal" replace />;
  }
  if (user.role === 'Intern') {
    return <Navigate to="/intern-portal" replace />;
  }

  return <Navigate to="/hub" replace />;
}

function SuperAdminRoute({ refreshKey }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user && user.isAuthenticated && user.role === 'Super Admin') {
    return <SuperAdminView key={`superadmin-${refreshKey}`} />;
  }

  return <SuperAdminSecureGate onBackToHub={() => navigate('/hub')} />;
}

function AppContent() {
  const { serverDate, isSynced } = useServerTime();
  const [userSelectedPeriod, setUserSelectedPeriod] = useState(false);

  // Initialize with current system month/year immediately
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(() => now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => now.getFullYear());
  const [refreshKey, setRefreshKey] = useState(0);

  // Automatically sync with server's month and year once server time responds,
  // unless user has actively selected a different period from the dropdown.
  useEffect(() => {
    if (isSynced && !userSelectedPeriod && serverDate) {
      setSelectedMonth(serverDate.getMonth() + 1);
      setSelectedYear(serverDate.getFullYear());
    }
  }, [isSynced, serverDate, userSelectedPeriod]);

  const handleMonthChange = (val) => {
    setUserSelectedPeriod(true);
    setSelectedMonth(typeof val === 'function' ? val : Number(val));
  };

  const handleYearChange = (val) => {
    setUserSelectedPeriod(true);
    setSelectedYear(typeof val === 'function' ? val : Number(val));
  };

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans transition-colors duration-200">
      {/* Top Internal Network Access Bar */}
      <InternalNetworkBar />

      {/* Password Authentication Modal */}
      <LoginModal />

      {/* Main Intranet Header & Portal Switcher */}
      <Navbar 
        onRefresh={handleRefresh}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        setSelectedMonth={handleMonthChange}
        setSelectedYear={handleYearChange}
      />

      {/* Main Portal Workspace Routing */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <Routes>
          {/* Default Root Path -> Dynamic Redirect based on role */}
          <Route path="/" element={<RootRedirect />} />

          {/* 1. General Intranet Hub */}
          <Route path="/hub" element={<InternalHubView />} />

          {/* 2. Office Admin Dedicated Workspace (HR & Biometric Attendance) */}
          <Route 
            path="/office-admin" 
            element={
              <OfficeAdminDashboardView
                key={`office-admin-${refreshKey}`}
                month={selectedMonth}
                year={selectedYear}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                setSelectedMonth={handleMonthChange}
                setSelectedYear={handleYearChange}
                onRefresh={handleRefresh}
              />
            } 
          />

          {/* 3. IMS Admin Dedicated Workspace (Intern Scholars & Deliverables Vault) */}
          <Route 
            path="/ims-admin" 
            element={<ImsAdminDashboardView key={`ims-admin-${refreshKey}`} />} 
          />

          {/* 4. Employee Dedicated Self-Service Workspace */}
          <Route 
            path="/employee-portal" 
            element={
              <EmployeePortalView
                key={`employee-${refreshKey}`}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            } 
          />

          {/* 5. Intern Scholar Dedicated Workspace */}
          <Route 
            path="/intern-portal" 
            element={<InternPortalView key={`intern-${refreshKey}`} />} 
          />

          {/* 6. Employee Forms & Downloads Desk */}
          <Route 
            path="/forms" 
            element={<FormsDownloadsView key={`forms-${refreshKey}`} />} 
          />

          {/* 7. Internal Employee AI Productivity Suite */}
          <Route 
            path="/ai" 
            element={<AiSuiteView key={`ai-${refreshKey}`} />} 
          />

          {/* 8. Super Admin Governance & Access Control Panel */}
          <Route 
            path="/superadmin" 
            element={<SuperAdminRoute refreshKey={refreshKey} />} 
          />

          {/* 9. High-Speed LAN File Transfer Desk (3-Digit Key & 24h Buffer) */}
          <Route 
            path="/transfer" 
            element={<FileTransferView key={`transfer-${refreshKey}`} />} 
          />
          <Route 
            path="/file-transfer" 
            element={<FileTransferView key={`file-transfer-${refreshKey}`} />} 
          />

          {/* Fallback unknown paths */}
          <Route path="*" element={<Navigate to="/hub" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ServerTimeProvider>
        <AppContent />
      </ServerTimeProvider>
    </AuthProvider>
  );
}
