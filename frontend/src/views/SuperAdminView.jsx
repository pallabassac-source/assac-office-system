import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';
import { 
  ShieldCheck, 
  UserPlus, 
  Users, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  GraduationCap, 
  BookOpen, 
  UploadCloud, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';

const MOCK_SYSTEM_USERS = [
  {
    id: 1,
    username: 'superadmin',
    fullName: 'Super Admin Operator',
    email: 'superadmin@assac.internal',
    designation: 'System Governance Lead',
    role: 'Super Admin',
    status: 'Active',
    createdAt: '2026-01-01',
    permissions: {
      biometric_attendance: true,
      forms_downloads: true,
      intern_onboarding: true,
      ims_access: true,
      excel_upload: true,
      super_admin: true
    }
  },
  {
    id: 2,
    username: 'admin',
    fullName: 'Assam State Admin',
    email: 'admin@assac.internal',
    designation: 'HR & Operations Lead',
    role: 'Admin',
    status: 'Active',
    createdAt: '2026-01-05',
    permissions: {
      biometric_attendance: true,
      forms_downloads: true,
      intern_onboarding: true,
      ims_access: false,
      excel_upload: true,
      super_admin: false
    }
  },
  {
    id: 3,
    username: 'ims',
    fullName: 'IMS Governance Officer',
    email: 'ims@assac.internal',
    designation: 'IMS Officer & Document Archival Lead',
    role: 'IMS Officer',
    status: 'Active',
    createdAt: '2026-01-10',
    permissions: {
      biometric_attendance: false,
      forms_downloads: true,
      intern_onboarding: true,
      ims_access: true, // Responsible for intern documents & research archives after onboarding
      excel_upload: false,
      super_admin: false
    }
  },
  {
    id: 4,
    username: 'ao_officer',
    fullName: 'B. K. Deka',
    email: 'ao@assac.internal',
    designation: 'Administrative Officer',
    role: 'Administrative Officer',
    status: 'Active',
    createdAt: '2026-01-12',
    permissions: {
      biometric_attendance: false,
      forms_downloads: true,
      intern_onboarding: true,
      ims_access: false,
      excel_upload: false,
      super_admin: false
    }
  }
];

const ROLE_DEFAULT_PERMISSIONS = {
  'Super Admin': {
    biometric_attendance: true,
    excel_upload: true,
    employee_management: true,
    ims_access: true,
    intern_onboarding: true,
    forms_downloads: true,
    ai_suite: true,
    file_transfer: true,
    employee_portal: true,
    intern_portal: true,
    super_admin: true
  },
  'Admin': {
    biometric_attendance: true,
    excel_upload: true,
    employee_management: true,
    forms_downloads: true,
    intern_onboarding: true,
    ai_suite: true,
    file_transfer: true,
    employee_portal: true,
    ims_access: false,
    intern_portal: false,
    super_admin: false
  },
  'Office Admin': {
    biometric_attendance: true,
    excel_upload: true,
    employee_management: true,
    forms_downloads: true,
    intern_onboarding: true,
    ai_suite: true,
    file_transfer: true,
    employee_portal: true,
    ims_access: false,
    intern_portal: false,
    super_admin: false
  },
  'IMS Admin': {
    ims_access: true,
    intern_onboarding: true,
    forms_downloads: true,
    ai_suite: true,
    file_transfer: true,
    intern_portal: true,
    employee_portal: false,
    biometric_attendance: false,
    excel_upload: false,
    employee_management: false,
    super_admin: false
  },
  'IMS Officer': {
    ims_access: true,
    intern_onboarding: true,
    forms_downloads: true,
    ai_suite: true,
    file_transfer: true,
    intern_portal: true,
    employee_portal: false,
    biometric_attendance: false,
    excel_upload: false,
    employee_management: false,
    super_admin: false
  },
  'Administrative Officer': {
    intern_onboarding: true,
    employee_management: true,
    forms_downloads: true,
    ai_suite: true,
    file_transfer: true,
    employee_portal: true,
    biometric_attendance: false,
    excel_upload: false,
    ims_access: false,
    intern_portal: false,
    super_admin: false
  },
  'Employee': {
    employee_portal: true,
    forms_downloads: true,
    ai_suite: true,
    file_transfer: true,
    biometric_attendance: false,
    excel_upload: false,
    employee_management: false,
    intern_onboarding: false,
    ims_access: false,
    intern_portal: false,
    super_admin: false
  },
  'Intern': {
    intern_portal: true,
    ims_access: true,
    forms_downloads: true,
    ai_suite: true,
    file_transfer: true,
    biometric_attendance: false,
    excel_upload: false,
    employee_management: false,
    employee_portal: false,
    intern_onboarding: false,
    super_admin: false
  }
};

const SYSTEM_MODULES = [
  {
    key: 'biometric_attendance',
    name: 'Biometric Attendance System',
    route: '/office-admin',
    desc: 'Punch records, biometric attendance register, overview, overtime trends & export center',
    badge: 'Attendance'
  },
  {
    key: 'excel_upload',
    name: 'Biometric Excel Ingestion Hub',
    route: '/office-admin?tab=upload',
    desc: 'Upload and parse monthly biometric machine Excel spreadsheets into database',
    badge: 'Upload'
  },
  {
    key: 'employee_management',
    name: 'Staff Employee Directory & HR',
    route: '/office-admin?tab=employees',
    desc: 'Staff directory, designations, departments, status and credential links',
    badge: 'Staff'
  },
  {
    key: 'ims_access',
    name: 'IMS Governance & Deliverables Vault',
    route: '/ims-admin',
    desc: 'IMS scholar management, 10 GB deliverables repository, storage monitor & clearances',
    badge: 'IMS'
  },
  {
    key: 'intern_onboarding',
    name: 'Intern Onboarding & E-Certificates',
    route: '/ims-admin?tab=onboard',
    desc: 'Scholar onboarding desk, academic departments directory, and certificate generation',
    badge: 'Scholars'
  },
  {
    key: 'forms_downloads',
    name: 'Forms & Formats Download Desk',
    route: '/forms',
    desc: 'Official office application formats, leave slips, TA/DA vouchers & requisition forms',
    badge: 'Forms'
  },
  {
    key: 'ai_suite',
    name: 'AI Productivity Utility Desk',
    route: '/ai',
    desc: 'Enterprise Neural Assistant, instant image generation, presentation deck writer',
    badge: 'AI Suite'
  },
  {
    key: 'file_transfer',
    name: 'LAN File Transfer Desk',
    route: '/transfer',
    desc: 'High-speed LAN file sharing with 3-digit key and 24-hour buffer storage',
    badge: 'File Transfer'
  },
  {
    key: 'employee_portal',
    name: 'Employee Self-Service Desk',
    route: '/employee-portal',
    desc: 'Personal employee attendance ledger, duty roster, leave slip requests & records',
    badge: 'My Workspace'
  },
  {
    key: 'intern_portal',
    name: 'Intern Scholar Workspace',
    route: '/intern-portal',
    desc: 'Student scholar deliverable submissions, project progress & completion certificates',
    badge: 'Scholar Desk'
  },
  {
    key: 'super_admin',
    name: 'Super Admin Enterprise Governance',
    route: '/superadmin',
    desc: 'Master user provisioning, role assignments, security audit logs & privilege management',
    badge: 'Super Admin'
  }
];

export default function SuperAdminView() {
  const { user, systemAccounts, addOrUpdateUser, deleteUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPassModalUser, setResetPassModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // RBAC Gating
  const isAuthorized = user.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.permissions?.super_admin
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Super Admin Enterprise Governance Gate"
        description="Access to System User Creation, Role Assignment, Master Credential Resets, and Global Privilege Management is strictly restricted to designated Super Admin Governance Officers."
        requiredRole="Super Admin"
      />
    );
  }

  // Form State for creating/editing user
  const [formState, setFormState] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    designation: '',
    role: 'Admin',
    permissions: {
      biometric_attendance: true,
      excel_upload: true,
      employee_management: true,
      ims_access: false,
      intern_onboarding: true,
      forms_downloads: true,
      ai_suite: true,
      file_transfer: true,
      employee_portal: true,
      intern_portal: false,
      super_admin: false
    }
  });

  const togglePermission = (permKey) => {
    setFormState(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey]
      }
    }));
  };

  const handleRoleChange = (newRole) => {
    const defaults = ROLE_DEFAULT_PERMISSIONS[newRole] || ROLE_DEFAULT_PERMISSIONS['Admin'] || {};
    setFormState(prev => ({
      ...prev,
      role: newRole,
      permissions: {
        ...prev.permissions,
        ...defaults
      }
    }));
  };

  const applyRoleDefaults = () => {
    const defaults = ROLE_DEFAULT_PERMISSIONS[formState.role] || ROLE_DEFAULT_PERMISSIONS['Admin'] || {};
    setFormState(prev => ({
      ...prev,
      permissions: {
        ...defaults
      }
    }));
  };

  const selectAllPermissions = () => {
    const all = {};
    SYSTEM_MODULES.forEach(m => { all[m.key] = true; });
    setFormState(prev => ({ ...prev, permissions: all }));
  };

  const clearAllPermissions = () => {
    const none = {};
    SYSTEM_MODULES.forEach(m => { none[m.key] = false; });
    setFormState(prev => ({ ...prev, permissions: none }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      id: editingUser ? editingUser.id : undefined,
      username: formState.username.trim(),
      name: formState.fullName.trim(),
      fullName: formState.fullName.trim(),
      email: formState.email.trim(),
      designation: formState.designation || 'Staff Officer',
      role: formState.role,
      status: editingUser ? (editingUser.status || 'Active') : 'Active',
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString().split('T')[0],
      permissions: { ...formState.permissions }
    };

    // Only set password if Super Admin entered one; preserve existing password on edit
    if (formState.password && formState.password.trim()) {
      newUser.password = formState.password.trim();
    } else if (!editingUser) {
      newUser.password = 'admin123';
    }

    addOrUpdateUser(newUser);
    setShowCreateModal(false);
    setEditingUser(null);
    setFormState({
      fullName: '',
      username: '',
      email: '',
      password: '',
      designation: '',
      role: 'Admin',
      permissions: {
        biometric_attendance: true,
        excel_upload: true,
        employee_management: true,
        ims_access: false,
        intern_onboarding: true,
        forms_downloads: true,
        ai_suite: true,
        file_transfer: true,
        employee_portal: true,
        intern_portal: false,
        super_admin: false
      }
    });
  };

  const openEditModal = (targetUser) => {
    const userRole = targetUser.role || 'Admin';
    const defaults = ROLE_DEFAULT_PERMISSIONS[userRole] || ROLE_DEFAULT_PERMISSIONS['Admin'];
    setEditingUser(targetUser);
    setFormState({
      fullName: targetUser.fullName || targetUser.name || '',
      username: targetUser.username || '',
      email: targetUser.email || '',
      password: '', // Blank so existing password is preserved
      designation: targetUser.designation || 'Staff Officer',
      role: userRole,
      permissions: {
        biometric_attendance: targetUser.permissions?.biometric_attendance !== undefined ? !!targetUser.permissions.biometric_attendance : !!defaults.biometric_attendance,
        excel_upload: targetUser.permissions?.excel_upload !== undefined ? !!targetUser.permissions.excel_upload : !!defaults.excel_upload,
        employee_management: targetUser.permissions?.employee_management !== undefined ? !!targetUser.permissions.employee_management : !!defaults.employee_management,
        ims_access: targetUser.permissions?.ims_access !== undefined ? !!targetUser.permissions.ims_access : !!defaults.ims_access,
        intern_onboarding: targetUser.permissions?.intern_onboarding !== undefined ? !!targetUser.permissions.intern_onboarding : !!defaults.intern_onboarding,
        forms_downloads: targetUser.permissions?.forms_downloads !== undefined ? !!targetUser.permissions.forms_downloads : !!defaults.forms_downloads,
        ai_suite: targetUser.permissions?.ai_suite !== undefined ? !!targetUser.permissions.ai_suite : !!defaults.ai_suite,
        file_transfer: targetUser.permissions?.file_transfer !== undefined ? !!targetUser.permissions.file_transfer : !!defaults.file_transfer,
        employee_portal: targetUser.permissions?.employee_portal !== undefined ? !!targetUser.permissions.employee_portal : !!defaults.employee_portal,
        intern_portal: targetUser.permissions?.intern_portal !== undefined ? !!targetUser.permissions.intern_portal : !!defaults.intern_portal,
        super_admin: targetUser.permissions?.super_admin !== undefined ? !!targetUser.permissions.super_admin : !!defaults.super_admin
      }
    });
    setShowCreateModal(true);
  };

  const toggleUserStatus = (targetUser) => {
    const updated = {
      ...targetUser,
      status: targetUser.status === 'Active' ? 'Inactive' : 'Active'
    };
    addOrUpdateUser(updated);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    await addOrUpdateUser({
      ...resetPassModalUser,
      password: newPassword.trim()
    });
    alert(`Password for user "${resetPassModalUser.username}" successfully reset to "${newPassword.trim()}"!`);
    setResetPassModalUser(null);
    setNewPassword('');
  };

  const filteredUsers = (systemAccounts || []).filter(u => 
    (u.fullName || u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner - Lite Theme */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-2 shadow-sm border-l-4 border-l-amber-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                Restricted Governance Desk
              </span>
              <span className="text-xs text-slate-500 font-medium">RBAC User Privilege Control</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Super Admin User Access & Permissions Panel
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl font-medium">
              Create operator accounts, set access credentials, and assign module-level permissions. 
              Users will only be able to access modules granted by Super Admin here; unassigned modules will display the restricted access view.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingUser(null);
              setFormState({
                fullName: '',
                username: '',
                email: '',
                password: '',
                designation: '',
                role: 'Admin',
                permissions: {
                  biometric_attendance: true,
                  forms_downloads: true,
                  intern_onboarding: false,
                  ims_access: false,
                  ai_suite: true,
                  excel_upload: false,
                  super_admin: false
                }
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <UserPlus className="h-4 w-4 text-amber-300" />
            <span>Create New User Account</span>
          </button>
        </div>
      </div>

      {/* User Search & Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 font-bold block">Total System Accounts</span>
            <span className="text-xl font-extrabold text-slate-900">{systemAccounts.length} Users</span>
          </div>
          <Users className="h-8 w-8 text-indigo-600 opacity-80" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 font-bold block">Biometric Attendance Operators</span>
            <span className="text-xl font-extrabold text-indigo-600">
              {systemAccounts.filter(u => u.permissions?.biometric_attendance).length} Staff
            </span>
          </div>
          <Clock className="h-8 w-8 text-indigo-600 opacity-80" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 font-bold block">Excel Ingestion Hub Authorized</span>
            <span className="text-xl font-extrabold text-indigo-800">
              {systemAccounts.filter(u => u.permissions?.excel_upload).length} Staff
            </span>
          </div>
          <UploadCloud className="h-8 w-8 text-indigo-600 opacity-80" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 font-bold block">IMS & Scholar Officers</span>
            <span className="text-xl font-extrabold text-sky-600">
              {systemAccounts.filter(u => u.permissions?.ims_access || u.permissions?.intern_onboarding).length} Officers
            </span>
          </div>
          <GraduationCap className="h-8 w-8 text-sky-600 opacity-80" />
        </div>
      </div>

      {/* Users Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search operator name, username, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-bold hidden sm:inline">Showing {filteredUsers.length} accounts</span>
      </div>

      {/* Users Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-extrabold uppercase text-[10px]">
                <th className="py-3 px-4">Operator Name & Username</th>
                <th className="py-3 px-4">Role & Designation</th>
                <th className="py-3 px-4">Assigned Module Permissions</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Super Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id || u.username} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-xs">
                        {(u.fullName || u.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">{u.fullName || u.name}</span>
                        <span className="text-[11px] text-indigo-600 font-mono font-bold">@{u.username}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-slate-100 border border-slate-200 inline-block mb-1">
                      {u.role}
                    </span>
                    <span className="text-[11px] text-slate-500 block font-medium">{u.designation || 'State Staff Officer'}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      {u.permissions?.biometric_attendance && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-extrabold" title="/office-admin">
                          Biometric Attendance
                        </span>
                      )}
                      {u.permissions?.excel_upload && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold" title="/office-admin?tab=upload">
                          Excel Ingestion
                        </span>
                      )}
                      {u.permissions?.employee_management && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-extrabold" title="/office-admin?tab=employees">
                          Staff HR
                        </span>
                      )}
                      {u.permissions?.ims_access && (
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-extrabold" title="/ims-admin">
                          IMS Access
                        </span>
                      )}
                      {u.permissions?.intern_onboarding && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold" title="/ims-admin?tab=onboard">
                          Intern Onboarding
                        </span>
                      )}
                      {u.permissions?.forms_downloads && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold" title="/forms">
                          Forms Desk
                        </span>
                      )}
                      {u.permissions?.ai_suite && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold" title="/ai">
                          AI Utility Suite
                        </span>
                      )}
                      {u.permissions?.file_transfer && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold" title="/transfer">
                          File Transfer
                        </span>
                      )}
                      {u.permissions?.employee_portal && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold" title="/employee-portal">
                          Staff Workspace
                        </span>
                      )}
                      {u.permissions?.intern_portal && (
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold" title="/intern-portal">
                          Scholar Workspace
                        </span>
                      )}
                      {u.permissions?.super_admin && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-extrabold" title="/superadmin">
                          Super Admin
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => toggleUserStatus(u)}
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-colors ${
                        u.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {u.status || 'Active'}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                        title="Modify entire user account & module permissions"
                      >
                        <Edit3 className="h-3 w-3 text-indigo-600" />
                        <span>Edit User</span>
                      </button>
                      <button
                        onClick={() => setResetPassModalUser(u)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                        title="Reset account password"
                      >
                        Pass
                      </button>
                      {u.role !== 'Super Admin' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete user account @${u.username}?`)) {
                              deleteUser(u.id || u.username);
                            }
                          }}
                          className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                          title="Delete user account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 border border-slate-200 space-y-4 shadow-2xl relative text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingUser ? `Edit Account & Permissions: @${editingUser.username}` : 'Create New System Operator Account'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Modify profile details, credentials, and module access</p>
                </div>
              </div>
              {editingUser && editingUser.role !== 'Super Admin' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete user account @${editingUser.username}?`)) {
                      deleteUser(editingUser.id || editingUser.username);
                      setShowCreateModal(false);
                      setEditingUser(null);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 font-bold hover:bg-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Account</span>
                </button>
              )}
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Er. Munmi Hazarika"
                    value={formState.fullName}
                    onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. munmi_h"
                    value={formState.username}
                    onChange={(e) => setFormState({ ...formState, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. user@assac.internal"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Research Officer"
                    value={formState.designation}
                    onChange={(e) => setFormState({ ...formState, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Access Password</label>
                  <input
                    type="password"
                    placeholder={editingUser ? "Leave blank to keep existing password" : "Enter secure password"}
                    value={formState.password}
                    onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Official Role</label>
                  <select
                    value={formState.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="Admin">Admin (HR & Operations Workspace)</option>
                    <option value="Office Admin">Office Admin (Onboarding & Biometrics)</option>
                    <option value="IMS Admin">IMS Admin (Scholar Governance & Vault)</option>
                    <option value="IMS Officer">IMS Officer (Document Archival & Clearances)</option>
                    <option value="Administrative Officer">Administrative Officer (Certificates & Stipends)</option>
                    <option value="Employee">Employee (Staff Self-Service Workspace)</option>
                    <option value="Intern">Intern (Research Scholar Workspace)</option>
                    <option value="Super Admin">Super Admin Enterprise Governance</option>
                  </select>
                </div>
              </div>

              {/* Module Access Checkboxes */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="font-extrabold text-slate-800 block text-xs">
                      Assign Granular Module Access Permissions:
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Control which operational workspaces and routes this operator can enter
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                    <button
                      type="button"
                      onClick={applyRoleDefaults}
                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 cursor-pointer shadow-2xs"
                      title="Reset toggles to standard defaults for this role"
                    >
                      Role Defaults
                    </button>
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-bold text-indigo-700 cursor-pointer shadow-2xs"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold text-slate-600 cursor-pointer shadow-2xs"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Module 1: Biometric Attendance */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-indigo-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.biometric_attendance}
                      onChange={() => togglePermission('biometric_attendance')}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-extrabold text-slate-800 block">Biometric Attendance Register</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /office-admin (Ledger, Trends, Exports)</span>
                    </div>
                  </label>

                  {/* Module 2: Excel Ingestion Hub */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-indigo-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.excel_upload}
                      onChange={() => togglePermission('excel_upload')}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-extrabold text-indigo-900 block">Biometric Excel Ingestion Hub</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /office-admin?tab=upload</span>
                    </div>
                  </label>

                  {/* Module 3: Employee Management */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-indigo-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.employee_management}
                      onChange={() => togglePermission('employee_management')}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-extrabold text-blue-900 block">Staff Employee Directory & HR</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /office-admin?tab=employees</span>
                    </div>
                  </label>

                  {/* Module 4: IMS Access */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-sky-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.ims_access}
                      onChange={() => togglePermission('ims_access')}
                      className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-extrabold text-sky-800 block">IMS Access & Deliverables Vault</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /ims-admin (Vault, Storage, Clearance)</span>
                    </div>
                  </label>

                  {/* Module 5: Intern Onboarding */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-emerald-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.intern_onboarding}
                      onChange={() => togglePermission('intern_onboarding')}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-extrabold text-emerald-800 block">Intern Onboarding & Certificates</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /ims-admin?tab=onboard</span>
                    </div>
                  </label>

                  {/* Module 6: Forms Downloads */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-slate-400 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.forms_downloads}
                      onChange={() => togglePermission('forms_downloads')}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-extrabold text-slate-800 block">Forms & Formats Download Desk</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /forms (Official formats & slips)</span>
                    </div>
                  </label>

                  {/* Module 7: AI Productivity Suite */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-amber-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.ai_suite}
                      onChange={() => togglePermission('ai_suite')}
                      className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-extrabold text-amber-800 block">AI Productivity Utility Desk</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /ai (Neural Assistant & Slides)</span>
                    </div>
                  </label>

                  {/* Module 8: LAN File Transfer */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-indigo-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.file_transfer}
                      onChange={() => togglePermission('file_transfer')}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-extrabold text-indigo-800 block">LAN Fast File Transfer Desk</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /transfer (3-digit key & 24h buffer)</span>
                    </div>
                  </label>

                  {/* Module 9: Employee Portal */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-emerald-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.employee_portal}
                      onChange={() => togglePermission('employee_portal')}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-extrabold text-emerald-800 block">Staff Employee Portal</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /employee-portal (Self-service punch logs)</span>
                    </div>
                  </label>

                  {/* Module 10: Intern Portal */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-teal-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.intern_portal}
                      onChange={() => togglePermission('intern_portal')}
                      className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="font-extrabold text-teal-800 block">Intern Scholar Workspace</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /intern-portal (Deliverables & e-Certs)</span>
                    </div>
                  </label>

                  {/* Module 11: Super Admin Governance */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-rose-300 cursor-pointer transition-colors sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={!!formState.permissions.super_admin}
                      onChange={() => togglePermission('super_admin')}
                      className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-extrabold text-rose-800 block">Super Admin Governance & Audit Gate</span>
                      <span className="text-[10px] text-slate-500 font-mono">Route: /superadmin (System user RBAC, master resets & audit logs)</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Save Updated Profile' : 'Save & Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
              <KeyRound className="h-5 w-5 text-indigo-600" />
              <span>Reset Password for @{resetPassModalUser.username}</span>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassModalUser(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-xs cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
