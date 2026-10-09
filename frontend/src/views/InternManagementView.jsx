import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getInterns, 
  createIntern, 
  updateIntern, 
  deleteIntern, 
  issueInternCertificate,
  getDepartments,
  createDepartment,
  getInternCertificatePdfUrl,
  resendInternCertificateEmail
} from '../services/api';
import { 
  GraduationCap, 
  Users, 
  Search, 
  Filter, 
  Award, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Briefcase, 
  UserCheck, 
  Download,
  BookOpen,
  X,
  Plus,
  UploadCloud,
  FileCheck,
  Building,
  UserPlus,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Mail,
  Building2,
  FolderOpen,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Trash2,
  RefreshCw,
  Send,
  Printer
} from 'lucide-react';
import CertificatePreviewModal from '../components/CertificatePreviewModal';
import RestrictedAccessView from '../components/RestrictedAccessView';

export default function InternManagementView({ defaultTab = 'directory' }) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState(defaultTab); // 'directory' | 'certificates'
  
  // Data States
  const [internsList, setInternsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Modals & Selections
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [previewCertIntern, setPreviewCertIntern] = useState(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  // Issuing state
  const [isIssuingId, setIsIssuingId] = useState(null);
  const [isEmailingId, setIsEmailingId] = useState(null);

  // New Intern Form State
  const [newIntern, setNewIntern] = useState({
    name: '',
    university: '',
    degree: '',
    department: '',
    mentor: '',
    project_title: '',
    joining_date: new Date().toISOString().split('T')[0],
    duration_months: 6,
    email: '',
    username: '',
    password: '',
    send_email: true
  });

  const [showPassword, setShowPassword] = useState(false);

  // Fetch all live data from backend
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [internsRes, deptsRes] = await Promise.all([
        getInterns(),
        getDepartments()
      ]);

      if (internsRes && internsRes.data) {
        setInternsList(internsRes.data);
      }
      if (deptsRes && deptsRes.data) {
        setDepartmentsList(deptsRes.data);
        if (deptsRes.data.length > 0 && !newIntern.department) {
          setNewIntern(prev => ({ ...prev, department: deptsRes.data[0] }));
        }
      }
    } catch (err) {
      console.error('Error fetching Intern data:', err);
      setErrorMsg('Failed to load live intern data from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to generate a random secure password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let pass = 'Assac@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewIntern(prev => ({ ...prev, password: pass }));
  };

  // Filtered Lists
  const filteredInterns = internsList.filter(intern => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (intern.name || '').toLowerCase().includes(term) || 
                          (intern.university || '').toLowerCase().includes(term) ||
                          (intern.intern_code || '').toLowerCase().includes(term) ||
                          (intern.project_title || '').toLowerCase().includes(term) ||
                          (intern.email || '').toLowerCase().includes(term) ||
                          (intern.mentor || '').toLowerCase().includes(term);
    const matchesDept = departmentFilter === 'ALL' || intern.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ISSUED' && intern.certificate_issued) || 
      (statusFilter === 'ACTIVE' && !intern.certificate_issued);

    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalItems = filteredInterns.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedInterns = filteredInterns.slice(indexOfFirstItem, indexOfLastItem);

  // Strict RBAC Permissions check
  const isSuperAdmin = user?.role === 'Super Admin' || user?.permissions?.super_admin === true;
  const isAuthorized = user?.isAuthenticated && (
    isSuperAdmin ||
    user?.permissions?.intern_onboarding === true ||
    user?.permissions?.ims_access === true
  );

  const canOnboard = user?.isAuthenticated && (
    isSuperAdmin || 
    user?.permissions?.intern_onboarding === true
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Academic & Intern Affairs Management"
        permissionKey="intern_onboarding"
        description="Access to research intern registrations, supervisors, academic records, and completion certificate issuance has been restricted by Super Admin."
        requiredRole="Office Admin"
      />
    );
  }

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!newIntern.name || !newIntern.university) {
      alert('Please fill student name and university.');
      return;
    }

    try {
      const generatedUsername = newIntern.username.trim() || newIntern.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const finalPassword = newIntern.password.trim() || 'intern123';
      const finalEmail = newIntern.email.trim() || `${generatedUsername}@assac.internal`;

      const internPayload = {
        name: newIntern.name.trim(),
        university: newIntern.university.trim(),
        degree: newIntern.degree.trim() || 'Degree Candidate',
        department: newIntern.department || (departmentsList[0] || 'GIS & Remote Sensing'),
        mentor: newIntern.mentor.trim() || 'Assigned Scientist',
        project_title: newIntern.project_title.trim() || 'Research Project Scope',
        joining_date: newIntern.joining_date,
        duration_months: Number(newIntern.duration_months) || 6,
        email: finalEmail,
        send_email: newIntern.send_email
      };

      const credsPayload = {
        username: generatedUsername,
        password: finalPassword
      };

      const res = await createIntern(internPayload, credsPayload);
      if (res && res.success) {
        alert(`Success: Student "${newIntern.name}" onboarded!\n\nPortal Login Credentials Created:\nUsername: ${generatedUsername}\nPassword: ${finalPassword}\n\nLogin credentials have been registered in the system.`);
        setShowOnboardModal(false);
        setNewIntern({
          name: '',
          university: '',
          degree: '',
          department: departmentsList[0] || '',
          mentor: '',
          project_title: '',
          joining_date: new Date().toISOString().split('T')[0],
          duration_months: 6,
          email: '',
          username: '',
          password: '',
          send_email: true
        });
        loadData();
      }
    } catch (err) {
      console.error('Error onboarding intern:', err);
      alert('Failed to onboard intern: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleIssueCertificate = async (intern) => {
    if (!window.confirm(`Issue official Internship Completion E-Certificate for "${intern.name}"?\n\nThis will generate the official PDF softcopy and dispatch it to ${intern.email || 'the student'}.`)) return;

    setIsIssuingId(intern.id);
    try {
      const res = await issueInternCertificate(intern.id);
      if (res && res.success) {
        alert(`Official E-Certificate successfully issued for ${intern.name}!\n\nA softcopy PDF has been generated and dispatched to ${intern.email || 'the student email'}.`);
        loadData();
      }
    } catch (err) {
      alert('Failed to issue certificate: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsIssuingId(null);
    }
  };

  const handleEmailCertificate = async (intern) => {
    setIsEmailingId(intern.id);
    try {
      const res = await resendInternCertificateEmail(intern.id, intern.email);
      if (res && res.success) {
        alert(`E-Certificate softcopy PDF dispatched to ${intern.email || 'student email'}!`);
      }
    } catch (err) {
      alert('Failed to dispatch certificate email: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsEmailingId(null);
    }
  };

  const handleDeleteIntern = async (internId, internName) => {
    if (!window.confirm(`Are you sure you want to delete intern "${internName}" and their portal login account?`)) return;

    try {
      const res = await deleteIntern(internId);
      if (res && res.success) {
        alert(`Intern "${internName}" removed successfully.`);
        loadData();
      }
    } catch (err) {
      alert('Failed to delete intern: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateNewDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      const res = await createDepartment(newDeptName.trim(), newDeptCode.trim() || null);
      if (res && res.success) {
        alert(`Department "${res.data.name}" added successfully!`);
        setDepartmentsList(prev => [...prev, res.data.name]);
        setNewIntern(prev => ({ ...prev, department: res.data.name }));
        setShowAddDeptModal(false);
        setNewDeptName('');
        setNewDeptCode('');
      }
    } catch (err) {
      alert('Failed to create department: ' + (err.response?.data?.error || err.message));
    }
  };

  // KPI calculations
  const totalEnrolled = internsList.length;
  const issuedCertCount = internsList.filter(i => i.certificate_issued).length;
  const activeCount = internsList.filter(i => !i.certificate_issued).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Top Banner & KPI Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-500 font-bold block">Total Enrolled Scholars</span>
            <span className="text-2xl font-black text-slate-900">{totalEnrolled} Students</span>
            <span className="text-[10px] text-slate-400 font-medium">Registered in ASSAC Registry</span>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-500 font-bold block">Active Research Interns</span>
            <span className="text-2xl font-black text-amber-600">{activeCount} In Progress</span>
            <span className="text-[10px] text-slate-400 font-medium">Under Scientific Supervision</span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-500 font-bold block">E-Certificates Issued</span>
            <span className="text-2xl font-black text-emerald-600">{issuedCertCount} Delivered</span>
            <span className="text-[10px] text-slate-400 font-medium">Softcopy Emailed via SMTP</span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <Award className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector & Action Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Sub-tabs buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => {
              setActiveSubTab('directory');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Student Intern Directory</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeSubTab === 'directory' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {internsList.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('certificates');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'certificates'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>E-Certificate Issuance & Softcopy Delivery Desk</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeSubTab === 'certificates' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {issuedCertCount} Issued
            </span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap w-full md:w-auto justify-end">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Refresh intern data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {canOnboard && (
            <button
              onClick={() => {
                generateRandomPassword();
                setShowOnboardModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="h-4 w-4 text-indigo-200" />
              <span>Onboard New Student & Create Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, roll ID, university, supervisor, topic..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          <Filter className="h-4 w-4 text-slate-500" />
          
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Departments ({departmentsList.length})</option>
            {departmentsList.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active & In Progress</option>
            <option value="ISSUED">E-Certificate Issued</option>
          </select>

          {canOnboard && (
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer shadow-2xs"
              title="Add Department"
            >
              <Plus className="h-4 w-4 inline mr-1" />
              <span>Dept</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: STUDENT INTERN DIRECTORY TABLE */}
      {activeSubTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-extrabold uppercase text-[10px] font-mono sticky top-0">
                  <th className="py-3.5 px-4">Student ID & Name</th>
                  <th className="py-3.5 px-4">University & Specialization</th>
                  <th className="py-3.5 px-4">Department & Supervisor</th>
                  <th className="py-3.5 px-4">Research Scope</th>
                  <th className="py-3.5 px-4 text-center">Portal Login</th>
                  <th className="py-3.5 px-4 text-center">Certificate Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                        <span>Loading student intern records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedInterns.length > 0 ? (
                  paginatedInterns.map((intern) => (
                    <tr key={intern.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-xs shrink-0">
                            {intern.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">{intern.name}</span>
                            <span className="text-[11px] text-indigo-600 font-mono font-bold">{intern.intern_code} • {intern.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block text-xs">{intern.university}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{intern.degree}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 border border-slate-200 text-slate-700 inline-block mb-0.5">
                          {intern.department}
                        </span>
                        <span className="text-[11px] text-slate-600 block font-medium">{intern.mentor}</span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[11px] text-slate-700 font-medium line-clamp-2">{intern.project_title || 'Assigned Research Scope'}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-[11px]">
                          @{intern.user_login || intern.intern_code.toLowerCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {intern.certificate_issued ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Issued
                            </span>
                            <span className="text-[9px] text-slate-400 block font-mono">Softcopy Sent</span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" /> Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Profile Button */}
                          <button
                            onClick={() => setSelectedIntern(intern)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                            title="View Student Profile"
                          >
                            Profile
                          </button>

                          {/* Certificate Actions */}
                          {intern.certificate_issued ? (
                            <>
                              <button
                                onClick={() => setPreviewCertIntern(intern)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                title="Preview Official E-Certificate"
                              >
                                <Award className="h-3 w-3 text-indigo-600" />
                                <span>Preview</span>
                              </button>

                              <a
                                href={getInternCertificatePdfUrl(intern.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                                title="Download Softcopy PDF"
                              >
                                <Download className="h-3.5 w-3.5 text-emerald-600" />
                              </a>

                              <button
                                onClick={() => handleEmailCertificate(intern)}
                                disabled={isEmailingId === intern.id}
                                className="p-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors cursor-pointer"
                                title="Resend Softcopy via Email"
                              >
                                {isEmailingId === intern.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5 text-sky-600" />}
                              </button>
                            </>
                          ) : (
                            canOnboard && (
                              <button
                                onClick={() => handleIssueCertificate(intern)}
                                disabled={isIssuingId === intern.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                                title="Issue Official E-Certificate & Mail Softcopy"
                              >
                                {isIssuingId === intern.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Award className="h-3 w-3" />}
                                <span>Issue Cert</span>
                              </button>
                            )
                          )}

                          {/* Delete Intern Button */}
                          {canOnboard && (
                            <button
                              onClick={() => handleDeleteIntern(intern.id, intern.name)}
                              className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                              title="Delete Student Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                      No student intern records found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: E-CERTIFICATE ISSUANCE & CLEARANCE DESK */}
      {activeSubTab === 'certificates' && (
        <div className="space-y-6">
          
          {/* Clearance & Issuance Overview Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-200 font-extrabold text-[11px] uppercase font-mono">
                    Official Digital Certification Desk
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Student E-Certificate Clearances & Softcopy Dispatch Hub
                </h3>
                <p className="text-xs text-indigo-200 max-w-2xl font-medium">
                  Office Admin can verify research milestones, generate official high-resolution E-Certificates, automatically dispatch softcopies via email to students, and store permanent verification records.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-indigo-200 block font-bold">Certificates Issued</span>
                  <span className="text-2xl font-black text-amber-300">{issuedCertCount} / {totalEnrolled}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {paginatedInterns.map(intern => (
              <div key={intern.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4 hover:border-indigo-300 transition-colors">
                
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-sm">
                      {intern.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{intern.name}</h4>
                      <p className="text-xs text-indigo-600 font-mono font-bold">{intern.intern_code} • {intern.university}</p>
                    </div>
                  </div>

                  <div>
                    {intern.certificate_issued ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Issued & Mailed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-600" /> Pending Clearance
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-slate-700 text-[11px]">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Department</span>
                    <span className="font-extrabold text-slate-900">{intern.department}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Supervisor</span>
                    <span className="font-extrabold text-slate-900">{intern.mentor}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Student Email</span>
                    <span className="font-mono font-bold text-slate-900 truncate block">{intern.email}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Attendance Rate</span>
                    <span className="font-extrabold text-emerald-700">{intern.attendance_rate || 100}% Logged</span>
                  </div>
                </div>

                {/* Scope */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5">Research Topic Scope</span>
                  <p className="text-slate-800 font-medium italic">"{intern.project_title || 'Assigned research project'}"</p>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {intern.certificate_issued ? `Issue Date: ${intern.certificate_date || 'Cleared'}` : 'Status: Ready to issue'}
                  </span>

                  <div className="flex items-center gap-2">
                    {intern.certificate_issued ? (
                      <>
                        <button
                          onClick={() => setPreviewCertIntern(intern)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Award className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Preview</span>
                        </button>

                        <a
                          href={getInternCertificatePdfUrl(intern.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF Softcopy</span>
                        </a>

                        <button
                          onClick={() => handleEmailCertificate(intern)}
                          disabled={isEmailingId === intern.id}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                          title="Resend Softcopy via Mail"
                        >
                          {isEmailingId === intern.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5 text-slate-600" />}
                        </button>
                      </>
                    ) : (
                      canOnboard && (
                        <button
                          onClick={() => handleIssueCertificate(intern)}
                          disabled={isIssuingId === intern.id}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          {isIssuingId === intern.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
                          <span>Issue Official E-Certificate</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* STATEFUL PAGINATION CONTROLLER BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{totalItems > 0 ? indexOfFirstItem + 1 : 0}</strong> to <strong className="text-slate-900">{Math.min(indexOfLastItem, totalItems)}</strong> of <strong className="text-slate-900">{totalItems}</strong> entries
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

        {/* Page Nav Controls */}
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

      {/* Intern Details Profile Modal */}
      {selectedIntern && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs animate-fadeIn">
            <button 
              onClick={() => setSelectedIntern(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-base">
                {selectedIntern.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedIntern.name}</h3>
                <p className="text-xs text-indigo-600 font-mono font-bold">{selectedIntern.intern_code} • {selectedIntern.university}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Department</span>
                  <span className="font-extrabold text-slate-900">{selectedIntern.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Assigned Supervisor</span>
                  <span className="font-extrabold text-slate-900">{selectedIntern.mentor}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Official Email</span>
                  <span className="font-mono font-bold text-slate-900">{selectedIntern.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Joining Date</span>
                  <span className="font-bold text-slate-900">{selectedIntern.joining_date || 'N/A'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase mb-1">Research Project Scope</span>
                <p className="font-medium text-slate-800">{selectedIntern.project_title || 'To be assigned by supervisor.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px]">Portal Login User</span>
                  <span className="font-mono font-extrabold text-indigo-700 text-xs">@{selectedIntern.user_login || selectedIntern.intern_code.toLowerCase()}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px]">Certificate Status</span>
                  <span className="font-extrabold text-emerald-700 text-xs">
                    {selectedIntern.certificate_issued ? 'Issued & Softcopy Delivered' : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              {selectedIntern.certificate_issued && (
                <button
                  onClick={() => {
                    const intn = selectedIntern;
                    setSelectedIntern(null);
                    setPreviewCertIntern(intn);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="h-4 w-4 text-indigo-600" />
                  <span>Preview E-Certificate</span>
                </button>
              )}
              
              <button
                onClick={() => setSelectedIntern(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer ml-auto"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Student & Create Credentials Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs max-h-[90vh] overflow-y-auto animate-fadeIn">
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
                <h3 className="text-base font-extrabold text-slate-900">Student Intern Onboarding & Credential Generation</h3>
                <p className="text-xs text-slate-500 font-semibold">Authorized for Office Admin & IMS Governance</p>
              </div>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Sarma"
                    value={newIntern.name}
                    onChange={(e) => setNewIntern({...newIntern, name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Official Student Email</label>
                  <input
                    type="email"
                    placeholder="e.g. student@assac.internal"
                    value={newIntern.email}
                    onChange={(e) => setNewIntern({...newIntern, email: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">University / Institute *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IIT Guwahati / Gauhati University"
                    value={newIntern.university}
                    onChange={(e) => setNewIntern({...newIntern, university: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Degree / Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. M.Tech Remote Sensing / B.Tech CSE"
                    value={newIntern.degree}
                    onChange={(e) => setNewIntern({...newIntern, degree: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-800 font-extrabold">Assigned Department</label>
                    <button
                      type="button"
                      onClick={() => setShowAddDeptModal(true)}
                      className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      + Add New Dept
                    </button>
                  </div>
                  <select
                    value={newIntern.department}
                    onChange={(e) => setNewIntern({...newIntern, department: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Assigned Supervisor / Scientist</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. P. K. Baruah (Scientist-SF)"
                    value={newIntern.mentor}
                    onChange={(e) => setNewIntern({...newIntern, mentor: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Research Project Scope / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Automated Wetland Inundation Analysis using Sentinel-1 SAR"
                  value={newIntern.project_title}
                  onChange={(e) => setNewIntern({...newIntern, project_title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={newIntern.joining_date}
                    onChange={(e) => setNewIntern({...newIntern, joining_date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-extrabold mb-1">Duration (Months)</label>
                  <select
                    value={newIntern.duration_months}
                    onChange={(e) => setNewIntern({...newIntern, duration_months: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value={1}>1 Month (Short Term)</option>
                    <option value={2}>2 Months (Summer Internship)</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months (Major Project)</option>
                    <option value={12}>1 Year (Research Fellowship)</option>
                  </select>
                </div>
              </div>

              {/* Portal Login Credentials Generator Box */}
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-extrabold text-xs">
                    <KeyRound className="h-4 w-4 text-indigo-600" />
                    <span>Student Portal Login Credentials (Created by Office Admin)</span>
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
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">Portal Username / Student ID</label>
                    <input
                      type="text"
                      placeholder="Auto-generated or custom"
                      value={newIntern.username}
                      onChange={(e) => setNewIntern({...newIntern, username: e.target.value})}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-slate-900 font-mono text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">Initial Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newIntern.password}
                        onChange={(e) => setNewIntern({...newIntern, password: e.target.value})}
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
                  The student will be able to log in to the portal using this Student ID and Password.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id="sendEmailCheckOffice"
                  checked={newIntern.send_email}
                  onChange={(e) => setNewIntern({...newIntern, send_email: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="sendEmailCheckOffice" className="text-slate-700 font-bold cursor-pointer">
                  Send welcome email with access credentials to student via SMTP (when configured)
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
                  <span>Onboard & Create Account</span>
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
              <span>Add New Academic Department</span>
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

      {/* Certificate Preview Modal */}
      {previewCertIntern && (
        <CertificatePreviewModal
          intern={previewCertIntern}
          onClose={() => setPreviewCertIntern(null)}
          onEmailSent={() => loadData()}
        />
      )}

    </div>
  );
}
