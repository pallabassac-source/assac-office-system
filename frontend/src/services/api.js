import axios from 'axios';

// Unified API base URL: defaults to relative '/api' proxied through Nginx / Vite dev server
// or custom VITE_API_URL environment variable if explicitly configured
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==========================================
const getCurrentMonth = () => new Date().getMonth() + 1;
const getCurrentYear = () => new Date().getFullYear();

// ==========================================
// 1. DASHBOARD & ATTENDANCE
// ==========================================
export const getDashboardStats = async (month = getCurrentMonth(), year = getCurrentYear(), department = null) => {
  const params = { month, year };
  if (department && department !== 'ALL') params.department = department;
  const res = await api.get('/dashboard/stats', { params });
  return res.data;
};

export const getAttendanceRecords = async (params = {}) => {
  const res = await api.get('/attendance/records', { params });
  return res.data;
};

export const getEmployeeDetail = async (id, month = getCurrentMonth(), year = getCurrentYear()) => {
  const res = await api.get(`/employees/${id}`, { params: { month, year } });
  return res.data;
};

export const getDepartments = async () => {
  const res = await api.get('/departments');
  return res.data;
};

export const createDepartment = async (name, code = null) => {
  const res = await api.post('/departments', { name, code });
  return res.data;
};

export const getAnalytics = async (month = getCurrentMonth(), year = getCurrentYear()) => {
  const res = await api.get('/analytics', { params: { month, year } });
  return res.data;
};

export const getServerTime = async () => {
  const res = await api.get('/time');
  return res.data;
};

export const setServerTime = async (date) => {
  const res = await api.post('/time', { date });
  return res.data;
};

export const resetServerTime = async () => {
  const res = await api.post('/time', { reset: true });
  return res.data;
};

export const uploadExcelFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/attendance/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const ingestParsedData = async (parsedData) => {
  const res = await api.post('/attendance/ingest', { parsedData });
  return res.data;
};

export const deleteAttendanceData = async (params = {}) => {
  const res = await api.delete('/attendance/clear', { params });
  return res.data;
};

export const getAvailablePeriods = async () => {
  const res = await api.get('/attendance/periods');
  return res.data;
};

export const getExportExcelUrl = (month = getCurrentMonth(), year = getCurrentYear(), department = null) => {
  let url = `${API_BASE_URL}/export/excel?month=${month}&year=${year}`;
  if (department && department !== 'ALL') url += `&department=${encodeURIComponent(department)}`;
  return url;
};

export const getExportPDFUrl = (month = getCurrentMonth(), year = getCurrentYear(), department = null, options = {}) => {
  let url = `${API_BASE_URL}/export/pdf?month=${month}&year=${year}`;
  if (department && department !== 'ALL') url += `&department=${encodeURIComponent(department)}`;
  if (options.includeStats === false) url += `&includeStats=false`;
  if (options.includeWorkHours === false) url += `&includeWorkHours=false`;
  if (options.includeOvertime === false) url += `&includeOvertime=false`;
  if (options.includeLateHours === false) url += `&includeLateHours=false`;
  return url;
};

export const getAuditLogs = async () => {
  const res = await api.get('/audit-logs');
  return res.data;
};

// ==========================================
// 2. INTERNS & IMS DOCUMENT DESK
// ==========================================
export const getInterns = async (params = {}) => {
  const res = await api.get('/interns', { params });
  return res.data;
};

export const getInternDetail = async (id) => {
  const res = await api.get(`/interns/${id}`);
  return res.data;
};

export const createIntern = async (internData, credentials = {}) => {
  const res = await api.post('/interns', { internData, credentials });
  return res.data;
};

export const updateIntern = async (id, updateData) => {
  const res = await api.put(`/interns/${id}`, updateData);
  return res.data;
};

export const issueInternCertificate = async (id, certificateDate = null) => {
  const res = await api.post(`/interns/${id}/certificate`, { certificateDate });
  return res.data;
};

export const getInternCertificatePdfUrl = (id) => {
  return `${API_BASE_URL}/interns/${id}/certificate/pdf`;
};

export const resendInternCertificateEmail = async (id, email = null) => {
  const res = await api.post(`/interns/${id}/certificate/email`, { email });
  return res.data;
};

export const deleteIntern = async (id) => {
  const res = await api.delete(`/interns/${id}`);
  return res.data;
};


export const getInternDocuments = async (params = {}) => {
  const res = await api.get('/interns/documents', { params });
  return res.data;
};

export const createInternDocument = async (docData, onUploadProgress = null) => {
  if (docData instanceof FormData) {
    const res = await api.post('/interns/documents', docData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percent, progressEvent.loaded, progressEvent.total);
        }
      }
    });
    return res.data;
  }
  const res = await api.post('/interns/documents', docData);
  return res.data;
};

export const getInternDocumentDownloadUrl = (id) => {
  return `${API_BASE_URL}/interns/documents/${id}/download`;
};

export const getInternDocumentViewUrl = (id) => {
  return `${API_BASE_URL}/interns/documents/${id}/view`;
};

export const deleteInternDocument = async (id) => {
  const res = await api.delete(`/interns/documents/${id}`);
  return res.data;
};

export const getStorageStatus = async () => {
  const res = await api.get('/system/storage');
  return res.data;
};

export const uploadNetworkFile = async (formData, onUploadProgress = null) => {
  const res = await api.post('/storage/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percent, progressEvent.loaded, progressEvent.total);
      }
    }
  });
  return res.data;
};

// ==========================================
// 3. EMPLOYEES & CREDENTIALS MANAGEMENT
// ==========================================
export const getEmployeesList = async (params = {}) => {
  const res = await api.get('/employees', { params });
  return res.data;
};

export const createEmployee = async (employeeData, credentials = {}) => {
  const res = await api.post('/employees', { employeeData, credentials });
  return res.data;
};

export const updateEmployee = async (id, updateData) => {
  const res = await api.put(`/employees/${id}`, updateData);
  return res.data;
};

export const manageEmployeeCredentials = async (id, credentials) => {
  const res = await api.post(`/employees/${id}/credentials`, credentials);
  return res.data;
};

export const deleteEmployee = async (id) => {
  const res = await api.delete(`/employees/${id}`);
  return res.data;
};

// ==========================================
// 4. AUTHENTICATION & SUPER ADMIN USERS
// ==========================================
export const loginApi = async (username, password) => {
  const res = await api.post('/auth/login', { username, password });
  return res.data;
};

export const getSystemUsersApi = async () => {
  const res = await api.get('/auth/system-users');
  return res.data;
};

export const saveSystemUserApi = async (userData) => {
  const res = await api.post('/auth/system-users', userData);
  return res.data;
};

export const deleteSystemUserApi = async (id) => {
  const res = await api.delete(`/auth/system-users/${id}`);
  return res.data;
};

export const getEmailStatusApi = async () => {
  const res = await api.get('/email/status');
  return res.data;
};

// ==========================================
// 5. ASSAC ENTERPRISE NEURAL AI (OPEN WEBUI)
// ==========================================
export const getAiModels = async () => {
  const res = await api.get('/ai/models');
  return res.data;
};

export const getAiStatus = async () => {
  const res = await api.get('/ai/status');
  return res.data;
};

export const sendAiChat = async ({ messages, model, systemPrompt, temperature, maxTokens }) => {
  const res = await api.post('/ai/chat', { messages, model, systemPrompt, temperature, maxTokens });
  return res.data;
};

export const generateAiImage = async ({ prompt, model, style }) => {
  const res = await api.post('/ai/image', { prompt, model, style });
  return res.data;
};

export const generateAiPresentation = async ({ topic, slideCount }) => {
  const res = await api.post('/ai/presentation', { topic, slideCount });
  return res.data;
};

// ==========================================
// 6. OFFICIAL FORMS & FORMATS MANAGEMENT
// ==========================================
export const getFormsList = async (params = {}) => {
  const res = await api.get('/forms', { params });
  return res.data;
};

export const getFormById = async (id) => {
  const res = await api.get(`/forms/${id}`);
  return res.data;
};

export const createFormApi = async (formData, onUploadProgress = null) => {
  if (formData instanceof FormData) {
    const res = await api.post('/forms', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percent, progressEvent.loaded, progressEvent.total);
        }
      }
    });
    return res.data;
  }
  const res = await api.post('/forms', formData);
  return res.data;
};

export const updateFormApi = async (id, formData, onUploadProgress = null) => {
  if (formData instanceof FormData) {
    const res = await api.put(`/forms/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percent, progressEvent.loaded, progressEvent.total);
        }
      }
    });
    return res.data;
  }
  const res = await api.put(`/forms/${id}`, formData);
  return res.data;
};

export const deleteFormApi = async (id) => {
  const res = await api.delete(`/forms/${id}`);
  return res.data;
};

export const getFormDownloadUrl = (id) => {
  return `${API_BASE_URL}/forms/${id}/download`;
};

export const getFormViewUrl = (id) => {
  return `${API_BASE_URL}/forms/${id}/view`;
};

// ==========================================
// 8. HIGH-SPEED FILE TRANSFER (3-DIGIT KEY & 24H BUFFER RETENTION)
// ==========================================
export const uploadTransferFile = async (formData, onUploadProgress = null) => {
  const res = await api.post('/transfers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percent, progressEvent.loaded, progressEvent.total);
      }
    }
  });
  return res.data;
};

export const getTransferInfo = async (key) => {
  const res = await api.get(`/transfers/${encodeURIComponent(key)}`);
  return res.data;
};

export const getTransferDownloadUrl = (key) => {
  return `${API_BASE_URL}/transfers/${encodeURIComponent(key)}/download`;
};

export const getActiveTransfers = async () => {
  const res = await api.get('/transfers/active');
  return res.data;
};

export const deleteTransferApi = async (key) => {
  const res = await api.delete(`/transfers/${encodeURIComponent(key)}`);
  return res.data;
};

export const triggerTransferCleanup = async () => {
  const res = await api.post('/transfers/cleanup');
  return res.data;
};

export default api;

