import React from 'react';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';
import InternsPortalView from './InternsPortalView';

export default function ImsAdminDashboardView() {
  const { user } = useAuth();

  // RBAC Gating
  const isAuthorized = user.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.role === 'IMS Admin' ||
    user.role === 'IMS Officer' ||
    user.role === 'Office Admin' ||
    user.role === 'Admin' ||
    user.permissions?.ims_access === true ||
    user.permissions?.intern_onboarding === true
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Intern Management System (IMS) Admin Desk"
        permissionKey="ims_access"
        description="Access to the IMS Governance Workspace, Student Onboarding Desk, Credential Generation, and Deliverable Clearance Vault is restricted to IMS Admin & Officers."
        requiredRole="IMS Admin"
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <InternsPortalView />
    </div>
  );
}
