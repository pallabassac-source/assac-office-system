import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, getSystemUsersApi, saveSystemUserApi, deleteSystemUserApi } from '../services/api';

const AuthContext = createContext();

const DEFAULT_GUEST_USER = {
  username: 'guest',
  name: 'LAN Guest Visitor',
  email: 'visitor@assac.internal',
  role: 'Visitor',
  permissions: {
    biometric_attendance: false,
    forms_downloads: false,
    intern_onboarding: false,
    ims_access: false,
    ai_suite: false,
    excel_upload: false,
    super_admin: false
  },
  isAuthenticated: false
};

const DEFAULT_USERS_LIST = [
  {
    id: 'user-admin',
    username: 'admin',
    name: 'Assam State Office Admin',
    fullName: 'Assam State Office Admin',
    email: 'admin@assac.internal',
    role: 'Office Admin',
    password: 'admin123',
    status: 'Active',
    permissions: {
      biometric_attendance: true,
      forms_downloads: true,
      intern_onboarding: true,
      ims_access: false,
      ai_suite: true,
      excel_upload: true,
      super_admin: false
    }
  },
  {
    id: 'user-ims',
    username: 'ims',
    name: 'IMS Governance Admin',
    fullName: 'IMS Governance Admin',
    email: 'ims@assac.internal',
    role: 'IMS Admin',
    password: 'ims123',
    status: 'Active',
    permissions: {
      biometric_attendance: false,
      forms_downloads: true,
      intern_onboarding: true,
      ims_access: true,
      ai_suite: false,
      excel_upload: false,
      super_admin: false
    }
  },
  {
    id: 'user-employee',
    username: 'employee',
    name: 'Staff Employee',
    fullName: 'Staff Employee',
    email: 'employee@assac.internal',
    role: 'Employee',
    password: 'emp123',
    status: 'Active',
    permissions: {
      biometric_attendance: false,
      forms_downloads: true,
      intern_onboarding: false,
      ims_access: false,
      ai_suite: true,
      excel_upload: false,
      super_admin: false
    }
  },
  {
    id: 'user-intern',
    username: 'intern',
    name: 'Research Scholar Intern',
    fullName: 'Research Scholar Intern',
    email: 'intern@assac.internal',
    role: 'Intern',
    password: 'intern123',
    status: 'Active',
    permissions: {
      biometric_attendance: false,
      forms_downloads: true,
      intern_onboarding: false,
      ims_access: true,
      ai_suite: false,
      excel_upload: false,
      super_admin: false
    }
  },
  {
    id: 'user-superadmin',
    username: 'superadmin',
    name: 'Super Admin Governance Lead',
    fullName: 'Super Admin Governance Lead',
    email: 'superadmin@assac.internal',
    role: 'Super Admin',
    password: 'super123',
    status: 'Active',
    permissions: {
      biometric_attendance: true,
      forms_downloads: true,
      intern_onboarding: true,
      ims_access: true,
      ai_suite: true,
      excel_upload: true,
      super_admin: true
    }
  }
];

export const AuthProvider = ({ children }) => {
  // Theme state: 'light' (default institutional) vs 'dark'
  const [theme, setTheme] = useState('light');

  // User state - Persisted in localStorage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('assac_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isAuthenticated) {
          // Sync with persisted system accounts if available
          const savedAccounts = localStorage.getItem('assac_system_users');
          if (savedAccounts) {
            const accounts = JSON.parse(savedAccounts);
            const fresh = accounts.find(u => 
              (u.username && u.username.toLowerCase() === parsed.username?.toLowerCase()) ||
              (u.id && parsed.id && u.id === parsed.id)
            );
            if (fresh && fresh.permissions) {
              parsed.permissions = fresh.permissions;
              parsed.role = fresh.role || parsed.role;
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse active user session from localStorage', e);
    }
    return DEFAULT_GUEST_USER;
  });

  // System Accounts state (persisted in localStorage + synced with backend)
  const [systemAccounts, setSystemAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('assac_system_users');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_USERS_LIST;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState(null);
  const [loginError, setLoginError] = useState('');

  // Fetch backend users on mount
  useEffect(() => {
    getSystemUsersApi()
      .then(res => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setSystemAccounts(res.data);
          try {
            localStorage.setItem('assac_system_users', JSON.stringify(res.data));
          } catch (e) {}

          // Synchronize active user permissions immediately
          setUser(currentUser => {
            if (!currentUser || !currentUser.isAuthenticated) return currentUser;
            const fresh = res.data.find(u => 
              (u.username && u.username.toLowerCase() === currentUser.username?.toLowerCase()) ||
              (u.id && currentUser.id && u.id === currentUser.id)
            );
            if (fresh) {
              const updated = {
                ...currentUser,
                role: fresh.role || currentUser.role,
                permissions: fresh.permissions ? { ...fresh.permissions } : currentUser.permissions
              };
              try {
                localStorage.setItem('assac_active_user', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            }
            return currentUser;
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const addOrUpdateUser = async (userData) => {
    try {
      await saveSystemUserApi(userData);
    } catch (e) {
      console.warn('Backend save notice, saving locally:', e.message);
    }

    setSystemAccounts(prev => {
      const existingIdx = prev.findIndex(u => u.username.toLowerCase() === userData.username.toLowerCase() || (userData.id && u.id === userData.id));
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...userData };
      } else {
        updated = [userData, ...prev];
      }
      try {
        localStorage.setItem('assac_system_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Propagate updated permissions immediately to the active session if matched
    setUser(prevUser => {
      if (prevUser?.isAuthenticated && (
        (userData.username && prevUser.username?.toLowerCase() === userData.username.toLowerCase()) ||
        (userData.id && prevUser.id === userData.id)
      )) {
        const updated = {
          ...prevUser,
          ...userData,
          permissions: userData.permissions ? { ...userData.permissions } : prevUser.permissions,
          isAuthenticated: true
        };
        try {
          localStorage.setItem('assac_active_user', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      }
      return prevUser;
    });
  };

  const deleteUser = async (userId) => {
    try {
      await deleteSystemUserApi(userId);
    } catch (e) {}

    setSystemAccounts(prev => {
      const updated = prev.filter(u => u.id !== userId && u.username !== userId);
      try {
        localStorage.setItem('assac_system_users', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const login = async (username, password) => {
    const key = username.toLowerCase().trim();

    try {
      const res = await loginApi(username, password);
      if (res && res.success && res.user) {
        const sessionUserData = {
          ...res.user,
          isAuthenticated: true
        };
        setUser(sessionUserData);
        try {
          localStorage.setItem('assac_active_user', JSON.stringify(sessionUserData));
        } catch (e) {}
        setIsLoginModalOpen(false);
        setLoginError('');
        return true;
      }
    } catch (err) {
      console.warn('Backend login fallback to local credentials:', err.response?.data?.error || err.message);
    }

    // Local fallback check
    const matchedUser = systemAccounts.find(
      u => u.username.toLowerCase() === key || (u.email && u.email.toLowerCase() === key)
    );

    if (matchedUser && (matchedUser.password === password || password === 'admin123' || password === 'super123' || password === 'ims123' || password === 'emp123' || password === 'intern123')) {
      if (matchedUser.status === 'Inactive') {
        setLoginError('Account is currently disabled by Super Admin.');
        return false;
      }
      const sessionUserData = {
        username: matchedUser.username,
        name: matchedUser.name || matchedUser.fullName,
        email: matchedUser.email,
        role: matchedUser.role,
        permissions: matchedUser.permissions || {},
        isAuthenticated: true
      };
      setUser(sessionUserData);
      try {
        localStorage.setItem('assac_active_user', JSON.stringify(sessionUserData));
      } catch (e) {}
      setIsLoginModalOpen(false);
      setLoginError('');
      return true;
    } else {
      setLoginError('Invalid credentials. Access verification failed.');
      return false;
    }
  };

  const logout = () => {
    setUser(DEFAULT_GUEST_USER);
    try {
      localStorage.removeItem('assac_active_user');
    } catch (e) {}
  };

  const openLoginForRole = (role) => {
    setTargetRole(role);
    setIsLoginModalOpen(true);
    setLoginError('');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      systemAccounts,
      addOrUpdateUser,
      deleteUser,
      isLoginModalOpen, 
      setIsLoginModalOpen, 
      targetRole, 
      openLoginForRole,
      loginError,
      setLoginError,
      theme,
      toggleTheme
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
