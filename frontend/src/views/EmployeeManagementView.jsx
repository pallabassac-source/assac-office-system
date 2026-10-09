import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getEmployeesList, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  manageEmployeeCredentials, 
  getDepartments, 
  createDepartment 
} from '../services/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  KeyRound, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X, 
  Building2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Briefcase
} from 'lucide-react';

export default function EmployeeManagementView() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  // Form states
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

  const [credsForm, setCredsForm] = useState({
    username: '',
    password: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    branch: 'Guwahati HQ'
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [empRes, deptsRes] = await Promise.all([
        getEmployeesList(),
        getDepartments()
      ]);

      if (empRes && empRes.data) {
        setEmployees(empRes.data);
      }
      if (deptsRes && deptsRes.data) {
        setDepartments(deptsRes.data);
        if (deptsRes.data.length > 0 && !newEmp.department) {
          setNewEmp(prev => ({ ...prev, department: deptsRes.data[0] }));
        }
      }
    } catch (err) {
      console.error('Error fetching employee list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let pass = 'Assac@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewEmp(prev => ({ ...prev, password: pass }));
    setCredsForm(prev => ({ ...prev, password: pass }));
  };

  const filteredEmployees = employees.filter(emp => {
    const term = search.toLowerCase();
    const matchesSearch = (emp.name || '').toLowerCase().includes(term) ||
                          (emp.emp_code || '').toLowerCase().includes(term) ||
                          (emp.designation || '').toLowerCase().includes(term) ||
                          (emp.department || '').toLowerCase().includes(term) ||
                          (emp.email || '').toLowerCase().includes(term);
    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);

  const canManage = user.role === 'Super Admin' || 
                    user.role === 'Office Admin' || 
                    user.role === 'Admin' || 
                    user.permissions?.super_admin;

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
        alert(`Success: Employee "${res.data.name}" created!\n\nPortal Login Credentials:\nUsername: ${uname}\nPassword: ${pass}\n\nThe staff member can sign in using these credentials.`);
        setShowCreateModal(false);
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
        loadData();
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
      const res = await manageEmployeeCredentials(showCredsModal.id, {
        username: credsForm.username.trim() || showCredsModal.emp_code.toLowerCase(),
        password: credsForm.password.trim()
      });

      if (res && res.success) {
        alert(`Credentials updated for ${showCredsModal.name}!\n\nUsername: ${credsForm.username || showCredsModal.emp_code.toLowerCase()}\nPassword: ${credsForm.password}`);
        setShowCredsModal(null);
        loadData();
      }
    } catch (err) {
      alert('Failed to update credentials: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateEmployee(showEditModal.id, editForm);
      if (res && res.success) {
        alert(`Profile updated for ${editForm.name}!`);
        setShowEditModal(null);
        loadData();
      }
    } catch (err) {
      alert('Failed to update employee: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (empId, empName) => {
    if (!window.confirm(`Are you sure you want to remove employee "${empName}" from the official registry?`)) return;
    try {
      const res = await deleteEmployee(empId);
      if (res && res.success) {
        alert(`Employee "${empName}" deleted successfully.`);
        loadData();
      }
    } catch (err) {
      alert('Failed to delete employee: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateNewDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      const res = await createDepartment(newDeptName.trim(), newDeptCode.trim() || null);
      if (res && res.success) {
        alert(`Department "${res.data.name}" added successfully!`);
        setDepartments(prev => [...prev, res.data.name]);
        setNewEmp(prev => ({ ...prev, department: res.data.name }));
        setShowAddDeptModal(false);
        setNewDeptName('');
        setNewDeptCode('');
      }
    } catch (err) {
      alert('Failed to create department: ' + (err.response?.data?.error || err.message));
    }
  };

  const totalEmployees = employees.length;
  const withAccounts = employees.filter(e => e.has_login || e.username).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-500 font-bold block">Total Staff Members</span>
            <span className="text-2xl font-black text-slate-900">{totalEmployees} Employees</span>
            <span className="text-[10px] text-slate-400 font-medium">ASSAC Workforce Directory</span>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-500 font-bold block">Active Portal Accounts</span>
            <span className="text-2xl font-black text-emerald-600">{withAccounts} Active Logins</span>
            <span className="text-[10px] text-slate-400 font-medium">Equipped with Credentials</span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <KeyRound className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-500 font-bold block">Operating Departments</span>
            <span className="text-2xl font-black text-sky-600">{departments.length} Divisions</span>
            <span className="text-[10px] text-slate-400 font-medium">Across Centre Headquarters</span>
          </div>
          <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-sky-600">
            <Building2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee code, name, designation, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          <Filter className="h-4 w-4 text-slate-500" />
          
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {canManage && (
            <>
              <button
                onClick={() => setShowAddDeptModal(true)}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer shadow-2xs"
                title="Add Department"
              >
                <Plus className="h-4 w-4 inline mr-1" />
                <span>Dept</span>
              </button>

              <button
                onClick={() => {
                  generateRandomPassword();
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="h-4 w-4 text-indigo-200" />
                <span>Add Employee & Create Login</span>
              </button>
            </>
          )}

          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Refresh Staff List"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-extrabold uppercase text-[10px] font-mono sticky top-0">
                <th className="py-3.5 px-4">Emp Code & Full Name</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4 text-center">Portal Login ID</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                      <span>Loading staff directory...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-xs shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm block">{emp.name}</span>
                          <span className="text-[11px] text-indigo-600 font-mono font-bold">{emp.emp_code}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">{emp.designation || 'Staff'}</td>
                    
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 border border-slate-200 text-slate-700">
                        {emp.department || 'General'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="space-y-0.5 font-mono text-[11px]">
                        <span className="block text-slate-800">{emp.email || 'No email registered'}</span>
                        {emp.phone && <span className="text-[10px] text-slate-400 block">{emp.phone}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      {emp.username || emp.has_login ? (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 text-[11px]">
                          @{emp.username || emp.emp_code.toLowerCase()}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No login created</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canManage && (
                          <>
                            <button
                              onClick={() => {
                                setCredsForm({
                                  username: emp.username || emp.emp_code.toLowerCase(),
                                  password: ''
                                });
                                generateRandomPassword();
                                setShowCredsModal(emp);
                              }}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                              title="Manage / Reset Login Credentials"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setEditForm({
                                  name: emp.name,
                                  email: emp.email || '',
                                  phone: emp.phone || '',
                                  department: emp.department || departments[0] || '',
                                  designation: emp.designation || '',
                                  branch: emp.branch || 'Guwahati HQ'
                                });
                                setShowEditModal(emp);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                              title="Edit Employee Profile"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleDelete(emp.id, emp.name)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                              title="Delete Employee"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    No matching employee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controller */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{totalItems > 0 ? indexOfFirstItem + 1 : 0}</strong> to <strong className="text-slate-900">{Math.min(indexOfLastItem, totalItems)}</strong> of <strong className="text-slate-900">{totalItems}</strong> staff members
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-400 text-[11px]">Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`h-7 w-7 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                currentPage === page
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Onboard Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs max-h-[90vh] overflow-y-auto animate-fadeIn">
            <button 
              onClick={() => setShowCreateModal(false)}
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
                <p className="text-xs text-slate-500 font-semibold">Office Admin Staff Registry</p>
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
                  id="empSendEmailCheckDesk"
                  checked={newEmp.send_email}
                  onChange={(e) => setNewEmp({...newEmp, send_email: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="empSendEmailCheckDesk" className="text-slate-700 font-bold cursor-pointer">
                  Send welcome email with credentials to employee via SMTP (when configured)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
          <div className="bg-white max-w-sm w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs animate-fadeIn">
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
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
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

      {/* Edit Employee Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs animate-fadeIn">
            <button 
              onClick={() => setShowEditModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-200 pb-3">
              <Edit3 className="h-5 w-5 text-indigo-600" />
              <span>Edit Profile: {showEditModal.name} ({showEditModal.emp_code})</span>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Department</label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
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
                    value={editForm.designation}
                    onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <span>Add New Department</span>
            </div>

            <form onSubmit={handleCreateNewDepartment} className="space-y-3">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Geospatial Artificial Intelligence"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Department Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. GEO-AI"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-xs cursor-pointer"
                >
                  Add Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
