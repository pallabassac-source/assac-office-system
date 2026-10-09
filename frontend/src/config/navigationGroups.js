import { 
  Clock, 
  UploadCloud, 
  BarChart3, 
  Download, 
  LayoutDashboard, 
  Users, 
  FileText, 
  GraduationCap, 
  Award, 
  ShieldAlert, 
  Building2, 
  HardDrive, 
  UserPlus, 
  FileCheck, 
  ShieldCheck, 
  BookOpen 
} from 'lucide-react';

/**
 * OFFICE ADMIN GROUPED NAVIGATION
 * Core biometric operations are grouped together (Attendance Ledger, Excel Ingestion, Analytics, Report Export Center)
 * alongside HR & Operations, Academic Affairs, and System Audit.
 */
export const OFFICE_ADMIN_NAV_GROUPS = [
  {
    id: 'biometrics',
    label: 'Biometric Attendance Operations',
    shortLabel: 'Biometrics Engine',
    badgeText: 'BIOMETRICS',
    badgeBg: 'bg-indigo-600',
    borderAccent: 'border-l-indigo-600',
    icon: Clock,
    description: 'Attendance punch ledger, monthly Excel ingestion, overtime analytics & report export center',
    tabs: [
      { 
        id: 'records', 
        label: 'Attendance Ledger', 
        shortLabel: 'Punch Ledger',
        desc: 'Detailed 31-day biometric punch logs, overtime & status records', 
        icon: Clock 
      },
      { 
        id: 'upload', 
        label: 'Excel Ingestion Hub', 
        shortLabel: 'Excel Ingestion',
        desc: 'Ingest monthly biometric Excel workbooks with automatic period extraction', 
        icon: UploadCloud 
      },
      { 
        id: 'analytics', 
        label: 'Analytics & Trends', 
        shortLabel: 'Analytics',
        desc: 'Overtime rankings, punctuality indices & department attendance rates', 
        icon: BarChart3 
      },
      { 
        id: 'exports', 
        label: 'Report Export Center', 
        shortLabel: 'Export Center',
        desc: 'Download official Excel registers & printable executive PDF summaries', 
        icon: Download 
      }
    ]
  },
  {
    id: 'workforce',
    label: 'Workforce & Office Administration',
    shortLabel: 'HR & Staff',
    badgeText: 'OPERATIONS',
    badgeBg: 'bg-emerald-600',
    borderAccent: 'border-l-emerald-600',
    icon: Building2,
    description: 'Workforce overview, staff directory, credentials provisioning & official forms desk',
    tabs: [
      { 
        id: 'dashboard', 
        label: 'Executive Overview', 
        shortLabel: 'Overview',
        desc: 'Real-time workforce metrics, punch distribution & summary cards', 
        icon: LayoutDashboard 
      },
      { 
        id: 'employees', 
        label: 'Staff Directory', 
        shortLabel: 'Staff Directory',
        desc: 'Staff directory, account provisioning, department assignment & password resets', 
        icon: Users 
      },
      { 
        id: 'forms', 
        label: 'Official Forms Desk', 
        shortLabel: 'Official Forms',
        desc: 'Create, upload, update, and manage official office formats & templates', 
        icon: FileText 
      }
    ]
  },
  {
    id: 'academic',
    label: 'Academic & Intern Affairs',
    shortLabel: 'Intern Program',
    badgeText: 'ACADEMIC',
    badgeBg: 'bg-sky-600',
    borderAccent: 'border-l-sky-600',
    icon: GraduationCap,
    description: 'Research intern scholar registrations, mentor allocations & completion e-certificates',
    tabs: [
      { 
        id: 'interns', 
        label: 'Intern Onboarding', 
        shortLabel: 'Onboard Intern',
        desc: 'Register research interns, supervisors, academic degree, scope & duration', 
        icon: GraduationCap 
      },
      { 
        id: 'certificates', 
        label: 'E-Certificates Desk', 
        shortLabel: 'E-Certificates',
        desc: 'Official completion certificates with automatic PDF generation & mail delivery', 
        icon: Award 
      }
    ]
  },
  {
    id: 'governance',
    label: 'System & Security',
    shortLabel: 'Security Trail',
    badgeText: 'SECURITY',
    badgeBg: 'bg-slate-700',
    borderAccent: 'border-l-slate-700',
    icon: ShieldAlert,
    description: 'Administrative modification traceability logs and security audit trail',
    tabs: [
      { 
        id: 'audit', 
        label: 'Security Audit Trail', 
        shortLabel: 'Audit Logs',
        desc: 'Traceability logs for HR modifications, credential updates & ingestion events', 
        icon: ShieldAlert 
      }
    ]
  }
];

/**
 * IMS ADMIN GROUPED NAVIGATION
 * Structured parallel UI/UX for the Intern Management System Administrator
 */
export const IMS_ADMIN_NAV_GROUPS = [
  {
    id: 'scholars',
    label: 'Scholar Management & Registry',
    shortLabel: 'Scholar Registry',
    badgeText: 'SCHOLARS',
    badgeBg: 'bg-indigo-600',
    borderAccent: 'border-l-indigo-600',
    icon: GraduationCap,
    description: 'Research intern scholar directory, student registration desk & academic departments',
    tabs: [
      { 
        id: 'directory', 
        label: 'Scholar Directory', 
        shortLabel: 'Scholar Directory',
        desc: 'Active research scholars, universities, project titles & supervisor allocations', 
        icon: Users 
      },
      { 
        id: 'onboard', 
        label: 'Onboard Scholar Desk', 
        shortLabel: 'Onboard Scholar',
        desc: 'Register new academic interns with automated student credentials & email dispatch', 
        icon: UserPlus 
      },
      { 
        id: 'departments', 
        label: 'Academic Departments', 
        shortLabel: 'Departments',
        desc: 'Manage research divisions (GIS & Remote Sensing, AI-GEO, Environmental Analytics)', 
        icon: Building2 
      }
    ]
  },
  {
    id: 'vault',
    label: 'Deliverables & 10 GB Storage Vault',
    shortLabel: '10 GB Vault (/data)',
    badgeText: '10 GB STORAGE',
    badgeBg: 'bg-sky-600',
    borderAccent: 'border-l-sky-600',
    icon: HardDrive,
    description: 'IMS document archive, thesis deliverables, high-capacity 10 GB LAN transfers & disk health',
    tabs: [
      { 
        id: 'deliverables', 
        label: 'Project Deliverables Vault', 
        shortLabel: 'Deliverables Vault',
        desc: 'Research reports, datasets, code bundles & thesis archives (up to 10 GB)', 
        icon: BookOpen 
      },
      { 
        id: 'storage', 
        label: 'Storage Disk & LAN Hub', 
        shortLabel: 'Disk Status (/data)',
        desc: 'Live partition metrics on /data (1017 GB available) and high-speed LAN file transfers', 
        icon: HardDrive 
      }
    ]
  },
  {
    id: 'certifications',
    label: 'Certifications & Clearance',
    shortLabel: 'E-Certificates',
    badgeText: 'CERTIFICATION',
    badgeBg: 'bg-emerald-600',
    borderAccent: 'border-l-emerald-600',
    icon: Award,
    description: 'Official internship completion certificates, verification & student clearance',
    tabs: [
      { 
        id: 'certificates', 
        label: 'E-Certificate Issuance', 
        shortLabel: 'Issue Certificate',
        desc: 'Issue verifiable completion certificates with automatic PDF generation & email softcopy', 
        icon: Award 
      },
      { 
        id: 'clearance', 
        label: 'Student Clearance Desk', 
        shortLabel: 'Student Clearance',
        desc: 'No-dues clearance verification from mentors, IT, and administrative sections', 
        icon: FileCheck 
      }
    ]
  },
  {
    id: 'governance',
    label: 'Governance & Official Formats',
    shortLabel: 'Forms & Audit',
    badgeText: 'GOVERNANCE',
    badgeBg: 'bg-slate-700',
    borderAccent: 'border-l-slate-700',
    icon: ShieldCheck,
    description: 'Official academic forms, thesis guidelines & IMS administrative activity audit trail',
    tabs: [
      { 
        id: 'forms', 
        label: 'Academic Forms Desk', 
        shortLabel: 'Academic Forms',
        desc: 'Institutional formats, internship onboarding checklist & project report templates', 
        icon: FileText 
      },
      { 
        id: 'audit', 
        label: 'IMS Security Audit', 
        shortLabel: 'Audit Trail',
        desc: 'Audit logging for scholar onboarding, certificate dispatches & deliverable clearances', 
        icon: ShieldAlert 
      }
    ]
  }
];

/**
 * Find tab info and parent group for Office Admin
 */
export function getOfficeAdminTabInfo(tabId = 'dashboard') {
  for (const group of OFFICE_ADMIN_NAV_GROUPS) {
    const found = group.tabs.find(t => t.id === tabId);
    if (found) {
      return { tab: found, group };
    }
  }
  // Default to first tab of first group
  return { 
    tab: OFFICE_ADMIN_NAV_GROUPS[1].tabs[0], 
    group: OFFICE_ADMIN_NAV_GROUPS[1] 
  };
}

/**
 * Find tab info and parent group for IMS Admin
 */
export function getImsAdminTabInfo(tabId = 'directory') {
  for (const group of IMS_ADMIN_NAV_GROUPS) {
    const found = group.tabs.find(t => t.id === tabId);
    if (found) {
      return { tab: found, group };
    }
  }
  // Default to first tab of first group
  return { 
    tab: IMS_ADMIN_NAV_GROUPS[0].tabs[0], 
    group: IMS_ADMIN_NAV_GROUPS[0] 
  };
}
