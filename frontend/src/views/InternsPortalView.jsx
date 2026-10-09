import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import RestrictedAccessView from '../components/RestrictedAccessView';
import StorageDiskGauge from '../components/StorageDiskGauge';
import FileUploadModal from '../components/FileUploadModal';
import { 
  getInterns, 
  createIntern, 
  updateIntern, 
  deleteIntern, 
  issueInternCertificate,
  getInternDocuments,
  createInternDocument,
  deleteInternDocument,
  getInternDocumentDownloadUrl,
  getInternDocumentViewUrl,
  getDepartments,
  createDepartment
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
  AlertCircle,
  ExternalLink,
  HardDrive
} from 'lucide-react';

export default function InternsPortalView({
  defaultTab = 'directory',
  autoOpenOnboard = false,
  autoOpenAddDept = false,
  autoOpenDocUpload = false
} = {}) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState(defaultTab); // 'directory' | 'documents' | 'onboarding'
  
  useEffect(() => {
    if (defaultTab) {
      setActiveSubTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    if (autoOpenOnboard) setShowOnboardModal(true);
  }, [autoOpenOnboard]);

  useEffect(() => {
    if (autoOpenAddDept) setShowAddDeptModal(true);
  }, [autoOpenAddDept]);

  useEffect(() => {
    if (autoOpenDocUpload) setShowDocUploadModal(true);
  }, [autoOpenDocUpload]);
  
  // Data States
  const [internsList, setInternsList] = useState([]);
  const [documentsList, setDocumentsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [docCategoryFilter, setDocCategoryFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Modals & Selections
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

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

  // New Document Upload State
  const [newDoc, setNewDoc] = useState({
    title: '',
    category: 'Project Deliverable',
    intern_name: '',
    intern_id: ''
  });

  // Fetch all live data from backend
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [internsRes, docsRes, deptsRes] = await Promise.all([
        getInterns(),
        getInternDocuments(),
        getDepartments()
      ]);

      if (internsRes && internsRes.data) {
        setInternsList(internsRes.data);
      }
      if (docsRes && docsRes.data) {
        setDocumentsList(docsRes.data);
      }
      if (deptsRes && deptsRes.data) {
        setDepartmentsList(deptsRes.data);
        if (deptsRes.data.length > 0 && !newIntern.department) {
          setNewIntern(prev => ({ ...prev, department: deptsRes.data[0] }));
        }
      }
    } catch (err) {
      console.error('Error fetching IMS data:', err);
      setErrorMsg('Failed to load live intern data from server. Please check backend connection.');
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

  // RESTRICT ACCESS CHECK FOR GUESTS / UNAUTHORIZED USERS
  const isSuperAdmin = user?.role === 'Super Admin' || user?.permissions?.super_admin === true;
  const isAuthorized = user.isAuthenticated && (
    isSuperAdmin ||
    user.role === 'Intern' ||
    user.permissions?.ims_access === true ||
    user.permissions?.intern_onboarding === true
  );

  if (!isAuthorized) {
    return (
      <RestrictedAccessView 
        moduleName="Intern Management System (IMS) Desk"
        permissionKey="ims_access"
        description="Access to the Intern Management System (IMS) Desk, Student Onboarding Directory, and Document Clearance Archives is restricted based on user role and permissions set by Super Admin."
        requiredRole="IMS Admin"
      />
    );
  }

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
    return matchesSearch && matchesDept;
  });

  const filteredDocuments = documentsList.filter(doc => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (doc.title || '').toLowerCase().includes(term) || 
                          (doc.intern_name || '').toLowerCase().includes(term) ||
                          (doc.uploaded_by || '').toLowerCase().includes(term);
    const matchesCat = docCategoryFilter === 'ALL' || doc.category === docCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Determine pagination bounds based on active sub-tab
  const getActiveListLength = () => {
    if (activeSubTab === 'directory') return filteredInterns.length;
    if (activeSubTab === 'documents') return filteredDocuments.length;
    if (activeSubTab === 'onboarding') return filteredInterns.length;
    return 0;
  };

  const totalItems = getActiveListLength();
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Paginated Slices
  const paginatedInterns = filteredInterns.slice(indexOfFirstItem, indexOfLastItem);
  const paginatedDocuments = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem);

  // Role permissions
  const canOnboard = user.isAuthenticated && (
    isSuperAdmin || 
    user.permissions?.intern_onboarding === true
  );

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!newIntern.name || !newIntern.university) {
      alert('Please fill all required student profile fields.');
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
        alert(`Success: Student "${newIntern.name}" onboarded!\n\nPortal Login Credentials Created:\nUsername: ${generatedUsername}\nPassword: ${finalPassword}\n\nThe student can log in using these credentials.`);
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

  const handleIssueCertificate = async (internId, internName) => {
    if (!window.confirm(`Confirm issuing official Internship Completion Certificate for "${internName}"?`)) return;

    try {
      const res = await issueInternCertificate(internId);
      if (res && res.success) {
        alert(`Completion Certificate successfully issued for ${internName}!`);
        loadData();
      }
    } catch (err) {
      alert('Failed to issue certificate: ' + (err.response?.data?.error || err.message));
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

  const handleDocUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newDoc.title) return;

    try {
      const payload = {
        title: newDoc.title.trim(),
        category: newDoc.category,
        intern_name: newDoc.intern_name.trim() || 'General Project Archive',
        uploaded_by: user.name || user.fullName || 'IMS Officer',
        file_path: `uploads/deliverables/${Date.now()}_${newDoc.title.replace(/\s+/g, '_')}`
      };

      const res = await createInternDocument(payload);
      if (res && res.success) {
        alert(`Document "${newDoc.title}" archived successfully in IMS Vault!`);
        setShowDocUploadModal(false);
        setNewDoc({ title: '', category: 'Project Deliverable', intern_name: '', intern_id: '' });
        loadData();
      }
    } catch (err) {
      alert('Failed to upload document: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteDoc = async (docId, docTitle) => {
    if (!window.confirm(`Delete archived document "${docTitle}"?`)) return;
    try {
      await deleteInternDocument(docId);
      loadData();
    } catch (err) {
      alert('Failed to delete document: ' + (err.response?.data?.error || err.message));
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

  const handleTabChange = (tab) => {
    setActiveSubTab(tab);
    setCurrentPage(1);
  };

  // If the logged-in user is an Intern, show their personalized Scholar Dashboard
  const isInternRole = user.role === 'Intern';
  const myInternProfile = isInternRole 
    ? internsList.find(i => (i.email && i.email.toLowerCase() === user.email?.toLowerCase()) || (i.user_login && i.user_login.toLowerCase() === user.username?.toLowerCase()) || (i.name && i.name.toLowerCase() === user.name?.toLowerCase())) || internsList[0]
    : null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-l-4 border-l-indigo-600 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300 uppercase tracking-wider">
                Intern Management System (IMS)
              </span>
              <span className="text-xs text-slate-500 font-semibold">Official Governance & Research Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Student Scholar Directory, Credentials & Document Clearance Desk
            </h1>
            <p className="text-xs text-slate-600 max-w-4xl font-medium leading-relaxed">
              Official workspace for <strong>IMS Admin & Office Admin</strong> to onboard student interns, generate secure portal login credentials, allocate research supervisors, and archive project deliverables.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Refresh IMS Records"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {canOnboard ? (
              <button
                onClick={() => {
                  generateRandomPassword();
                  setShowOnboardModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="h-4 w-4 text-indigo-200" />
                <span>Onboard Student & Create Login</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs">
                <Lock className="h-4 w-4 text-slate-500" />
                <span>Onboarding: IMS / Office Admin</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Role Guidelines */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
            <UserCheck className="h-4 w-4 text-indigo-600 shrink-0" />
            <div>
              <span className="font-extrabold text-indigo-950 block text-[11px]">IMS Admin Onboarding</span>
              <span className="text-[10px] text-slate-600 font-medium">Issue Student ID, Passwords & Supervisors</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-sky-50/70 p-2.5 rounded-xl border border-sky-100">
            <FolderOpen className="h-4 w-4 text-sky-600 shrink-0" />
            <div>
              <span className="font-extrabold text-sky-950 block text-[11px]">Document Clearance Vault</span>
              <span className="text-[10px] text-slate-600 font-medium">Project Deliverables, Datasets & Reports</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
            <Award className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-950 block text-[11px]">Completion Certificates</span>
              <span className="text-[10px] text-slate-600 font-medium">Clearances & Official Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* SPECIAL INTERN SCHOLAR PROFILE DASHBOARD (VISIBLE TO INTERN ROLE) */}
      {isInternRole && myInternProfile && (
        <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-700/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-extrabold text-amber-300 text-lg">
                {myInternProfile.name.charAt(0)}
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-indigo-200 uppercase tracking-widest block">
                  Logged In as Research Scholar
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  Welcome, {myInternProfile.name}
                </h2>
                <p className="text-xs text-indigo-200">
                  {myInternProfile.intern_code} • {myInternProfile.university}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {myInternProfile.certificate_issued ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 font-extrabold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Certificate Issued ({myInternProfile.certificate_date || 'Cleared'})
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-200 font-extrabold text-xs flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-400" /> Internship Active & In Progress
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-indigo-200 font-bold block text-[10px] uppercase">Assigned Department</span>
              <span className="font-extrabold text-white text-sm">{myInternProfile.department}</span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-indigo-200 font-bold block text-[10px] uppercase">Assigned Supervisor / Scientist</span>
              <span className="font-extrabold text-white text-sm">{myInternProfile.mentor}</span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-indigo-200 font-bold block text-[10px] uppercase">Biometric Attendance Log</span>
              <span className="font-extrabold text-emerald-300 text-sm">{myInternProfile.attendance_rate || 100}% Logged</span>
            </div>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1 text-xs">
            <span className="text-indigo-200 font-bold block text-[10px] uppercase">Assigned Research Scope & Project Title</span>
            <p className="text-white font-medium">{myInternProfile.project_title || 'Assigned research project under supervisor guidance.'}</p>
          </div>
        </div>
      )}

      {/* KPI Metrics Overview Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 font-bold block">Enrolled Interns</span>
            <span className="text-xl font-extrabold text-slate-900">{internsList.length} Students</span>
          </div>
          <Users className="h-8 w-8 text-indigo-600 opacity-80" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 font-bold block">Academic Departments</span>
            <span className="text-xl font-extrabold text-sky-600">{departmentsList.length} Active</span>
          </div>
          <Building2 className="h-8 w-8 text-sky-600 opacity-80" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 font-bold block">IMS Vault Deliverables</span>
            <span className="text-xl font-extrabold text-indigo-600">{documentsList.length} Documents</span>
          </div>
          <BookOpen className="h-8 w-8 text-indigo-600 opacity-80" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 font-bold block">Completion Certificates</span>
            <span className="text-xl font-extrabold text-emerald-600">
              {internsList.filter(i => i.certificate_issued).length} Issued
            </span>
          </div>
          <Award className="h-8 w-8 text-emerald-600 opacity-80" />
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('directory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Student Intern Directory</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeSubTab === 'directory' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {filteredInterns.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('documents')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'documents'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>IMS Document & Deliverable Vault</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeSubTab === 'documents' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {filteredDocuments.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('onboarding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'onboarding'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Clearance & Certificate Desk</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeSubTab === 'onboarding' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {internsList.filter(i => !i.certificate_issued).length} Pending
          </span>
        </button>
      </div>

      {/* Filter & Toolbar Area */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'documents'
                ? "Search IMS document title, student name..."
                : "Search student name, roll ID, university, supervisor..."
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          <Filter className="h-4 w-4 text-slate-500" />
          
          {activeSubTab === 'directory' && (
            <>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Departments ({departmentsList.length})</option>
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {canOnboard && (
                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
                  title="Create New Department"
                >
                  <Plus className="h-4 w-4 inline mr-1" />
                  <span>Dept</span>
                </button>
              )}
            </>
          )}

          {activeSubTab === 'documents' && (
            <>
              <select
                value={docCategoryFilter}
                onChange={(e) => {
                  setDocCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="ALL">All Document Types</option>
                <option value="Project Deliverable">Project Deliverables</option>
                <option value="Technical Documentation">Technical Specs</option>
                <option value="Research Data">Research Datasets</option>
                <option value="Completion Certificate">Certificates</option>
              </select>

              <button
                onClick={() => setShowDocUploadModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition-colors cursor-pointer shrink-0"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Upload Document</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: STUDENT INTERN DIRECTORY TABLE */}
      {activeSubTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-4">Student ID & Full Name</th>
                  <th className="py-3 px-4">University & Degree</th>
                  <th className="py-3 px-4">Department & Supervisor</th>
                  <th className="py-3 px-4">Research Project Scope</th>
                  <th className="py-3 px-4 text-center">Portal Login ID</th>
                  <th className="py-3 px-4 text-center">Certificate Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {paginatedInterns.length > 0 ? (
                  paginatedInterns.map((intern) => (
                    <tr key={intern.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-xs">
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
                        <p className="text-[11px] text-slate-700 font-medium line-clamp-2">{intern.project_title || 'Assigned Scope'}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-[11px]">
                          @{intern.user_login || intern.intern_code.toLowerCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {intern.certificate_issued ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Issued
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" /> Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedIntern(intern)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Profile
                          </button>

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
                      {isLoading ? 'Loading intern records from database...' : 'No student intern records found matching criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: IMS DOCUMENT DESK TABLE & STORAGE VAULT */}
      {activeSubTab === 'documents' && (
        <div className="space-y-4">
          {/* Live High-Capacity /data Storage Gauge */}
          <StorageDiskGauge />

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-extrabold uppercase text-[10px]">
                    <th className="py-3 px-4">Deliverable Title & File</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Associated Student Intern</th>
                    <th className="py-3 px-4">File Size & Storage</th>
                    <th className="py-3 px-4">Archived By & Date</th>
                    <th className="py-3 px-4 text-right">Vault Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {paginatedDocuments.length > 0 ? (
                    paginatedDocuments.map((doc) => {
                      const isRealStorage = doc.file_path && !doc.file_path.includes('sample_');
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="max-w-xs sm:max-w-md">
                                <span className="font-extrabold text-slate-900 text-sm block truncate">{doc.title}</span>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                                  <span className="text-sky-700 font-bold">DOC-#{doc.id}</span>
                                  {doc.file_name && doc.file_name !== doc.title && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[150px]">{doc.file_name}</span>
                                    </>
                                  )}
                                  {doc.download_count > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-700 font-bold">{doc.download_count} dl</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-800 border border-sky-200 inline-block">
                              {doc.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{doc.intern_name || 'General Archive'}</span>
                            <span className="text-[10px] text-slate-500">Research Scholar</span>
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            {doc.file_size ? (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200 text-[11px]">
                                {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Direct Vault</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-slate-800 font-bold block">{doc.uploaded_by || 'IMS Officer'}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {doc.created_at ? doc.created_at.split('T')[0].split(' ')[0] : '2026-05-01'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Direct Download File */}
                              <a 
                                href={getInternDocumentDownloadUrl(doc.id)}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                title="Download from storage volume"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download</span>
                              </a>

                              {/* Browser Inline View */}
                              <button
                                onClick={() => window.open(getInternDocumentViewUrl(doc.id), '_blank')}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                title="Preview document in browser"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>View</span>
                              </button>

                              {canOnboard && (
                                <button
                                  onClick={() => handleDeleteDoc(doc.id, doc.title)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                                  title="Delete & Purge from Disk"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 font-medium">
                        {isLoading ? 'Loading documents from storage vault...' : 'No archived documents match your query.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CLEARANCE & COMPLETION CERTIFICATE MATRIX */}
      {activeSubTab === 'onboarding' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                Student Clearance & Official Completion Certificate Desk
              </h3>
              <p className="text-xs text-slate-600 font-medium">Verify research milestones, supervisor clearances, and issue official completion certificates</p>
            </div>
          </div>

          {/* Certificate Issuance Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Official Student Certificate Clearances</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {paginatedInterns.map(intern => (
                <div key={intern.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">{intern.name}</span>
                    <span className="text-xs text-slate-600 font-medium">{intern.intern_code} • {intern.university}</span>
                    <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">{intern.department}</span>
                  </div>

                  {intern.certificate_issued ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Issued
                    </span>
                  ) : (
                    canOnboard && (
                      <button
                        onClick={() => handleIssueCertificate(intern.id, intern.name)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs transition-colors cursor-pointer"
                      >
                        Issue Certificate
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
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
            <span className="text-slate-400 text-[11px]">Rows per page:</span>
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

      {/* Intern Details Modal */}
      {selectedIntern && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs">
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
                    {selectedIntern.certificate_issued ? 'Issued & Verified' : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setSelectedIntern(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
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
          <div className="bg-white max-w-xl w-full p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs max-h-[90vh] overflow-y-auto">
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
                <h3 className="text-base font-extrabold text-slate-900">Student Onboarding & Credential Generation</h3>
                <p className="text-xs text-slate-500 font-semibold">Authorized for IMS Admin & Office Admin</p>
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
                    <span>Student Portal Login Credentials (Created by IMS Admin)</span>
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
                  id="sendEmailCheck"
                  checked={newIntern.send_email}
                  onChange={(e) => setNewIntern({...newIntern, send_email: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="sendEmailCheck" className="text-slate-700 font-bold cursor-pointer">
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

      {/* Real Multipart File Upload Modal for High-Capacity /data Storage */}
      <FileUploadModal
        isOpen={showDocUploadModal}
        onClose={() => setShowDocUploadModal(false)}
        onSuccess={() => {
          loadData();
        }}
        internsList={internsList}
        user={user}
      />

      {/* Add New Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xl relative text-xs">
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
