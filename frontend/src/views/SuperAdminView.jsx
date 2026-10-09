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
      forms_downloads: true,
      intern_onboarding: false,
      ims_access: false,
      ai_suite: true,
      excel_upload: false,
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

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      username: formState.username.trim(),
      name: formState.fullName.trim(),
      fullName: formState.fullName.trim(),
      email: formState.email.trim(),
      password: formState.password || (editingUser ? editingUser.password : 'admin123'),
      designation: formState.designation || 'Staff Officer',
      role: formState.role,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      permissions: { ...formState.permissions }
    };

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
        forms_downloads: true,
        intern_onboarding: false,
        ims_access: false,
        ai_suite: true,
        excel_upload: false,
        super_admin: false
      }
    });
  };

  const openEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setFormState({
      fullName: targetUser.fullName || targetUser.name || '',
      username: targetUser.username || '',
      email: targetUser.email || '',
      password: targetUser.password || '',
      designation: targetUser.designation || 'Staff Officer',
      role: targetUser.role || 'Admin',
      permissions: {
        biometric_attendance: !!targetUser.permissions?.biometric_attendance,
        forms_downloads: !!targetUser.permissions?.forms_downloads,
        intern_onboarding: !!targetUser.permissions?.intern_onboarding,
        ims_access: !!targetUser.permissions?.ims_access,
        ai_suite: !!targetUser.permissions?.ai_suite,
        excel_upload: !!targetUser.permissions?.excel_upload,
        super_admin: !!targetUser.permissions?.super_admin
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

  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    addOrUpdateUser({
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
            <span className="text-slate-500 font-bold block">IMS Officers</span>
            <span className="text-xl font-extrabold text-sky-600">
              {systemAccounts.filter(u => u.permissions?.ims_access).length} Accounts
            </span>
          </div>
          <BookOpen className="h-8 w-8 text-sky-600 opacity-80" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 font-bold block">Intern Onboarding Officers</span>
            <span className="text-xl font-extrabold text-emerald-600">
              {systemAccounts.filter(u => u.permissions?.intern_onboarding).length} Officers
            </span>
          </div>
          <GraduationCap className="h-8 w-8 text-emerald-600 opacity-80" />
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
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-extrabold">
                          Biometric Attendance
                        </span>
                      )}
                      {u.permissions?.ims_access && (
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-extrabold">
                          IMS Access
                        </span>
                      )}
                      {u.permissions?.intern_onboarding && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold">
                          Intern Onboarding
                        </span>
                      )}
                      {u.permissions?.forms_downloads && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                          Forms Desk
                        </span>
                      )}
                      {u.permissions?.ai_suite && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold">
                          AI Utility Suite
                        </span>
                      )}
                      {u.permissions?.super_admin && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-extrabold">
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
                    onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="Admin">Admin (HR & Operations)</option>
                    <option value="Office Admin">Office Admin (Onboarding & Operations)</option>
                    <option value="IMS Officer">IMS Officer (Document Archival & Clearances)</option>
                    <option value="Administrative Officer">Administrative Officer (Certificates & Stipends)</option>
                    <option value="Employee">Employee (General Staff)</option>
                    <option value="Super Admin">Super Admin Governance</option>
                  </select>
                </div>
              </div>

              {/* Module Access Checkboxes */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-800 block text-xs border-b border-slate-200 pb-1">
                  Assign Granular Module Access Permissions:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold">
                    <input
                      type="checkbox"
                      checked={formState.permissions.biometric_attendance}
                      onChange={() => togglePermission('biometric_attendance')}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Biometric Attendance System</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold">
                    <input
                      type="checkbox"
                      checked={formState.permissions.ims_access}
                      onChange={() => togglePermission('ims_access')}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-extrabold text-sky-700">IMS Access (Manage Documents & Clearances)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold">
                    <input
                      type="checkbox"
                      checked={formState.permissions.intern_onboarding}
                      onChange={() => togglePermission('intern_onboarding')}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Intern Onboarding & Clearance Desk</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold">
                    <input
                      type="checkbox"
                      checked={formState.permissions.forms_downloads}
                      onChange={() => togglePermission('forms_downloads')}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Forms & Formats Download Desk</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold">
                    <input
                      type="checkbox"
                      checked={formState.permissions.ai_suite}
                      onChange={() => togglePermission('ai_suite')}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-extrabold text-amber-800">AI Productivity Utility Desk</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold">
                    <input
                      type="checkbox"
                      checked={formState.permissions.super_admin}
                      onChange={() => togglePermission('super_admin')}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-extrabold text-rose-800">Super Admin Governance</span>
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
