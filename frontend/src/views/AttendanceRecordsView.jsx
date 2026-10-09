import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileSpreadsheet, 
  FileText, 
  Trash2, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  CheckCircle2,
  Users,
  UserPlus,
  KeyRound,
  X,
  Mail,
  Phone,
  Building2,
  Building,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { 
  getAttendanceRecords, 
  getDepartments, 
  getExportExcelUrl, 
  getExportPDFUrl, 
  deleteAttendanceData,
  createEmployee,
  manageEmployeeCredentials,
  createDepartment
} from '../services/api';
import EmployeeDetailModal from '../components/EmployeeDetailModal';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';

export default function AttendanceRecordsView({ month, year }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEmpId, setSelectedEmpId] = useState(null);

  // Modals
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, targetId: null, targetName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(null); // stores employee object

  // Form State for Onboarding Employee
  const [newEmp, setNewEmp] = useState({
    emp_code: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    branch: 'Guwahati HQ',
    create_login: true,
    username: '',
    password: '',
    send_email: true
  });
  const [showPassword, setShowPassword] = useState(false);

  // Form State for Resetting Credentials
  const [credsForm, setCredsForm] = useState({
    username: '',
    password: ''
  });

  // RBAC Gating
  const isAuthorized = user.isAuthenticated && (
    user.role === 'Super Admin' ||
    user.role === 'Office Admin' ||
    user.role === 'Admin' ||
    user.permissions?.super_admin ||
    user.permissions?.biometric_attendance === true
  );

  const canManageEmployees = user.role === 'Super Admin' || 
                            user.role === 'Office Admin' || 
                            user.role === 'Admin' || 
                            user.permissions?.intern_onboarding;

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Biometric Attendance & HR Register Module"
        permissionKey="biometric_attendance"
        description="Access to the Biometric Attendance Ledger, Staff Punch Log Records, Monthly Attendance Reports, and Ingest Tools is restricted based on user level access permissions set by Super Admin."
        requiredRole="Office Admin"
      />
    );
  }

  const loadDepartments = () => {
    getDepartments().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setDepartments(res.data);
        if (res.data.length > 0 && !newEmp.department) {
          setNewEmp(prev => ({ ...prev, department: res.data[0] }));
        }
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    getAttendanceRecords({ month, year, department: selectedDept, search })
      .then(res => {
        if (res.success) setRecords(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRecords();
  }, [month, year, selectedDept, search]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let pass = 'Assac@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewEmp(prev => ({ ...prev, password: pass }));
    setCredsForm(prev => ({ ...prev, password: pass }));
  };

  const handleCreateEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!newEmp.name.trim()) {
      alert('Employee Name is required');
      return;
    }

    try {
      const code = newEmp.emp_code.trim() || `EMP-${Date.now().toString().slice(-4)}`;
      const uname = newEmp.username.trim() || code.toLowerCase();
      const pass = newEmp.password.trim() || 'emp123';

      const empPayload = {
        emp_code: code,
        name: newEmp.name.trim(),
        email: newEmp.email.trim() || `${uname}@assac.internal`,
        phone: newEmp.phone.trim() || null,
        department: newEmp.department || (departments[0] || 'Administration & HR Operations'),
        designation: newEmp.designation.trim() || 'Staff Officer',
        branch: newEmp.branch.trim() || 'Guwahati HQ',
        send_email: newEmp.send_email
      };

      const credsPayload = {
        create_login: newEmp.create_login,
        username: uname,
        password: pass
      };

      const res = await createEmployee(empPayload, credsPayload);
      if (res && res.success) {
        alert(`Success: Employee "${res.data.name}" created!\n\nPortal Login Credentials:\nUsername: ${uname}\nPassword: ${pass}\n\nThe employee can sign in using these credentials.`);
        setShowOnboardModal(false);
        setNewEmp({
          emp_code: '',
          name: '',
          email: '',
          phone: '',
          department: departments[0] || '',
          designation: '',
          branch: 'Guwahati HQ',
          create_login: true,
          username: '',
          password: '',
          send_email: true
        });
        fetchRecords();
      }
    } catch (err) {
      alert('Failed to create employee: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateCredsSubmit = async (e) => {
    e.preventDefault();
    if (!credsForm.password.trim()) {
      alert('Password cannot be empty');
      return;
    }

    try {
      const res = await manageEmployeeCredentials(showCredsModal.employee_id, {
        username: credsForm.username.trim() || showCredsModal.emp_code.toLowerCase(),
        password: credsForm.password.trim()
      });

      if (res && res.success) {
        alert(`Credentials updated for ${showCredsModal.name}!\n\nUsername: ${credsForm.username || showCredsModal.emp_code.toLowerCase()}\nPassword: ${credsForm.password}`);
        setShowCredsModal(null);
        fetchRecords();
      }
    } catch (err) {
      alert('Failed to update credentials: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.type === 'SINGLE') {
        await deleteAttendanceData({ employee_id: deleteModal.targetId });
      } else if (deleteModal.type === 'MONTH') {
        await deleteAttendanceData({ month, year });
      } else if (deleteModal.type === 'ALL') {
        await deleteAttendanceData({ clear_all: 'true' });
      }
      setDeleteModal({ open: false, type: null, targetId: null, targetName: '' });
      fetchRecords();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Header & Controls Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <span>Biometric Attendance Register & Staff Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monthly punch ledger for Period <span className="font-bold font-mono text-slate-700">{month}/{year}</span> • Total {records.length} Staff Listed
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Search code, name, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-300 pl-9 pr-3.5 py-1.5 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 w-full sm:w-56 font-medium shadow-2xs"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-300 text-xs shadow-2xs">
            <Filter className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Onboard Employee Action Button (Office Admin) */}
          {canManageEmployees && (
            <button
              onClick={() => {
                generateRandomPassword();
                setShowOnboardModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4 text-indigo-200" />
              <span>Create Employee & Login</span>
            </button>
          )}

          {/* Export Downloads */}
          <a
            href={getExportExcelUrl(month, year, selectedDept)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            title="Download Pastel Highlighted Excel Register"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel</span>
          </a>

          <a
            href={getExportPDFUrl(month, year, selectedDept)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            title="Download Executive PDF Summary"
          >
            <FileText className="h-4 w-4" />
            <span>PDF</span>
          </a>

          {/* Clear Data Button (Admin Only) */}
          {(user.role === 'Super Admin' || user.permissions?.super_admin) && (
            <button
              onClick={() => setDeleteModal({ open: true, type: 'MONTH', targetName: `Period ${month}/${year}` })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              title="Clear current month attendance data"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700 uppercase text-[11px] font-extrabold bg-slate-100/80 font-mono sticky top-0">
                <th className="px-4 py-3.5">Code</th>
                <th className="px-4 py-3.5">Employee Name</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Designation</th>
                <th className="px-3 py-3.5 text-center">Present</th>
                <th className="px-3 py-3.5 text-center">Absent</th>
                <th className="px-3 py-3.5 text-center">WO</th>
                <th className="px-3 py-3.5 text-center">Leave</th>
                <th className="px-3 py-3.5 text-center">Paid</th>
                <th className="px-4 py-3.5 text-center">Work Hours</th>
                <th className="px-4 py-3.5 text-center">Overtime</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-4 py-12 text-center text-slate-500 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                      <span>Loading attendance records...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-12 text-center text-slate-500 font-medium">
                    No matching attendance records found for this period.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr 
                    key={r.employee_id} 
                    onClick={() => setSelectedEmpId(r.employee_id)}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">{r.emp_code}</td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {r.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{r.department || 'General'}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{r.designation || 'Staff'}</td>
                    
                    {/* Status Badges */}
                    <td className="px-3 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold font-mono text-[11px]">
                        {r.present_days || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-extrabold font-mono text-[11px]">
                        {r.absent_days || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold font-mono text-[11px]">
                        {r.weekly_off_days || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold font-mono text-[11px]">
                        {r.leave_days || 0}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center font-extrabold text-slate-900 font-mono text-xs">
                      {r.paid_days || 0}
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-extrabold text-slate-800">{r.total_work_hours || '00:00'}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-extrabold text-amber-700">{r.overtime_hours || '00:00'}</td>
                    
                    <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => setSelectedEmpId(r.employee_id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                          title="View 31-Day Attendance Log"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {canManageEmployees && (
                          <button
                            onClick={() => {
                              setCredsForm({ username: r.emp_code.toLowerCase(), password: '' });
                              generateRandomPassword();
                              setShowCredsModal(r);
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                            title="Manage / Reset Employee Login Credentials"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {(user.role === 'Super Admin' || user.permissions?.super_admin) && (
                          <button
                            onClick={() => setDeleteModal({ open: true, type: 'SINGLE', targetId: r.employee_id, targetName: r.name })}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 text-slate-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                            title="Delete Employee Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Employee & Create Login Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowOnboardModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Create Employee Profile & Login Credentials</h3>
                <p className="text-xs text-slate-500 font-semibold">Office Admin Workforce Onboarding</p>
              </div>
            </div>

            <form onSubmit={handleCreateEmployeeSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Employee Code / ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 105 or EMP-105"
                    value={newEmp.emp_code}
                    onChange={(e) => setNewEmp({...newEmp, emp_code: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Pranab Sarma"
                    value={newEmp.name}
                    onChange={(e) => setNewEmp({...newEmp, name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({...newEmp, department: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Systems Specialist"
                    value={newEmp.designation}
                    onChange={(e) => setNewEmp({...newEmp, designation: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="e.g. p.sarma@assac.internal"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({...newEmp, email: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98640 12345"
                    value={newEmp.phone}
                    onChange={(e) => setNewEmp({...newEmp, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Login Credentials Generator Box */}
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-extrabold text-xs">
                    <KeyRound className="h-4 w-4 text-indigo-600" />
                    <span>Portal Login Credentials (Role: Employee)</span>
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-indigo-700 font-bold hover:underline cursor-pointer"
                  >
                    Regenerate Password
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">Username / Emp ID</label>
                    <input
                      type="text"
                      placeholder={newEmp.emp_code ? newEmp.emp_code.toLowerCase() : "e.g. emp105"}
                      value={newEmp.username}
                      onChange={(e) => setNewEmp({...newEmp, username: e.target.value})}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-slate-900 font-mono text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">Access Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newEmp.password}
                        onChange={(e) => setNewEmp({...newEmp, password: e.target.value})}
                        className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-slate-900 font-mono text-xs font-bold focus:outline-none pr-14"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  The employee will be able to log in to access forms, requests, and view punch logs.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="empSendEmailCheck"
                  checked={newEmp.send_email}
                  onChange={(e) => setNewEmp({...newEmp, send_email: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="empSendEmailCheck" className="text-slate-700 font-bold cursor-pointer">
                  Send welcome email with credentials to employee via SMTP (when configured)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Employee & Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage / Reset Credentials Modal */}
      {showCredsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
              <KeyRound className="h-5 w-5 text-indigo-600" />
              <span>Reset Credentials for {showCredsModal.name}</span>
            </div>

            <form onSubmit={handleUpdateCredsSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Username / ID</label>
                <input
                  type="text"
                  value={credsForm.username}
                  onChange={(e) => setCredsForm({...credsForm, username: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-800 font-extrabold">New Password</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter new password"
                  value={credsForm.password}
                  onChange={(e) => setCredsForm({...credsForm, password: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCredsModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-xs cursor-pointer"
                >
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Confirm Record Deletion</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to permanently delete attendance data for <strong className="text-slate-900 font-bold">{deleteModal.targetName}</strong>? 
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, type: null, targetId: null, targetName: '' })}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail 31-Day Modal */}
      {selectedEmpId && (
        <EmployeeDetailModal
          employeeId={selectedEmpId}
          month={month}
          year={year}
          onClose={() => setSelectedEmpId(null)}
        />
      )}

    </div>
  );
}
