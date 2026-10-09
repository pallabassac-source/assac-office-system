const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Check if PostgreSQL configuration is active via env variables
const usePostgres = !!(process.env.DATABASE_URL || process.env.PGHOST || process.env.POSTGRES_HOST);

let db = {};

if (usePostgres) {
  const { Pool } = require('pg');
  console.log('[Database] Initializing PostgreSQL Connection Pool...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'assac_attendance'}`,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
  });

  db = {
    exec: async (sql) => {
      const client = await pool.connect();
      try {
        await client.query(sql);
      } finally {
        client.release();
      }
    },
    prepare: (sql) => {
      let paramCount = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++paramCount}`);

      return {
        get: async (...args) => {
          const params = Array.isArray(args[0]) ? args[0] : args;
          const res = await pool.query(pgSql, params);
          return res.rows[0];
        },
        all: async (...args) => {
          const params = Array.isArray(args[0]) ? args[0] : args;
          const res = await pool.query(pgSql, params);
          return res.rows || [];
        },
        run: async (...args) => {
          const params = Array.isArray(args[0]) ? args[0] : args;
          const res = await pool.query(pgSql, params);
          return { changes: res.rowCount, lastID: res.rows[0] ? res.rows[0].id : null };
        }
      };
    },
    transaction: (fn) => {
      return async (...args) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await fn(client, ...args);
          await client.query('COMMIT');
          return result;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      };
    }
  };
} else {
  console.log('[Database] Initializing SQLite local database file...');
  const dbDir = process.env.DB_DIR || path.join(__dirname, '../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'attendance.db');
  const seedDbPath = path.join(__dirname, '../seeds/initial_attendance.db');
  if (!fs.existsSync(dbPath) && fs.existsSync(seedDbPath)) {
    console.log(`[Database] First-time initialization: seeding database from ${seedDbPath}...`);
    try {
      fs.copyFileSync(seedDbPath, dbPath);
    } catch (copyErr) {
      console.warn('[Database] Could not copy initial seed DB:', copyErr.message);
    }
  }

  const rawDb = new sqlite3.Database(dbPath);
  rawDb.serialize(() => {
    rawDb.run('PRAGMA busy_timeout = 5000;');
    rawDb.run('PRAGMA synchronous = NORMAL;');
    rawDb.run('PRAGMA journal_mode = WAL;', (err) => {
      if (err) {
        console.warn('[Database] WAL mode unavailable, defaulting to standard DELETE journal:', err.message);
        rawDb.run('PRAGMA journal_mode = DELETE;');
      }
    });
  });

  db = {
    exec: (sql) => {
      return new Promise((resolve, reject) => {
        rawDb.exec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
    prepare: (sql) => {
      return {
        get: (...args) => {
          const params = Array.isArray(args[0]) ? args[0] : args;
          return new Promise((resolve, reject) => {
            rawDb.get(sql, params, (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });
        },
        all: (...args) => {
          const params = Array.isArray(args[0]) ? args[0] : args;
          return new Promise((resolve, reject) => {
            rawDb.all(sql, params, (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            });
          });
        },
        run: (...args) => {
          const params = Array.isArray(args[0]) ? args[0] : args;
          return new Promise((resolve, reject) => {
            rawDb.run(sql, params, function(err) {
              if (err) reject(err);
              else resolve({ changes: this ? this.changes : 0, lastID: this ? this.lastID : null });
            });
          });
        }
      };
    },
    transaction: (fn) => {
      return async (...args) => {
        await db.exec('BEGIN TRANSACTION');
        try {
          const result = await fn(...args);
          await db.exec('COMMIT');
          return result;
        } catch (err) {
          await db.exec('ROLLBACK');
          throw err;
        }
      };
    }
  };
}

async function safeAddColumn(table, columnDef) {
  try {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
  } catch (err) {
    // Column already exists, safe to ignore
  }
}

async function initDb() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY ${usePostgres ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      name TEXT UNIQUE NOT NULL,
      permissions TEXT
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY ${usePostgres ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      name TEXT UNIQUE NOT NULL,
      code TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY ${usePostgres ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      designation TEXT,
      role_name TEXT NOT NULL DEFAULT 'Admin',
      role_id INTEGER DEFAULT 2,
      module_permissions TEXT,
      status TEXT DEFAULT 'Active',
      intern_id INTEGER,
      employee_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY ${usePostgres ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      emp_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      department TEXT,
      designation TEXT,
      branch TEXT,
      status TEXT DEFAULT 'Active',
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance_monthly (
      id INTEGER PRIMARY KEY ${usePostgres ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      employee_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      report_period TEXT,
      present_days INTEGER DEFAULT 0,
      holiday_days INTEGER DEFAULT 0,
      weekly_off_days INTEGER DEFAULT 0,
      absent_days INTEGER DEFAULT 0,
      leave_days INTEGER DEFAULT 0,
      paid_days INTEGER DEFAULT 0,
      late_hours TEXT DEFAULT '00:00',
      total_work_hours TEXT DEFAULT '00:00',
      overtime_hours TEXT DEFAULT '00:00',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, month, year)
    );

    CREATE TABLE IF NOT EXISTS attendance_daily (
      id INTEGER PRIMARY KEY ${usePostgres ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      day_num INTEGER NOT NULL,
      status TEXT NOT NULL,
      arrival_time TEXT,
      departure_time TEXT,
      work_hours TEXT,
      overtime_hours TEXT,
      shift TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS interns (
      id INTEGER PRIMARY KEY ${usePostgres ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      intern_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      university TEXT NOT NULL,
      degree TEXT NOT NULL,
      department TEXT NOT NULL,
      mentor TEXT NOT NULL,
      project_title TEXT,
      joining_date TEXT,
      duration_months INTEGER DEFAULT 6,
      completion_date TEXT,
      status TEXT DEFAULT 'Active',
      certificate_issued INTEGER DEFAULT 0,
      certificate_date TEXT,
      attendance_rate REAL DEFAULT 100.0,
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY ${usePostgres ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      file_path TEXT,
      uploaded_by TEXT NOT NULL,
      intern_id INTEGER,
      intern_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY ${usePostgres ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forms (
      id INTEGER PRIMARY KEY ${usePostgres ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      form_code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      format TEXT DEFAULT 'PDF',
      file_path TEXT,
      file_name TEXT,
      file_size INTEGER DEFAULT 0,
      mime_type TEXT,
      stored_filename TEXT,
      is_popular INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0,
      pdf_url TEXT,
      uploaded_by TEXT,
      updated_date TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe schema migrations for existing DB
  await safeAddColumn('interns', 'project_title TEXT');
  await safeAddColumn('interns', 'joining_date TEXT');
  await safeAddColumn('interns', 'duration_months INTEGER DEFAULT 6');
  await safeAddColumn('interns', 'completion_date TEXT');
  await safeAddColumn('interns', 'certificate_date TEXT');
  await safeAddColumn('interns', 'attendance_rate REAL DEFAULT 100.0');
  await safeAddColumn('interns', 'user_id INTEGER');

  await safeAddColumn('employees', 'email TEXT');
  await safeAddColumn('employees', 'phone TEXT');
  await safeAddColumn('employees', 'status TEXT DEFAULT \'Active\'');
  await safeAddColumn('employees', 'user_id INTEGER');

  await safeAddColumn('users', 'full_name TEXT');
  await safeAddColumn('users', 'designation TEXT');
  await safeAddColumn('users', 'role_name TEXT DEFAULT \'Admin\'');
  await safeAddColumn('users', 'module_permissions TEXT');
  await safeAddColumn('users', 'status TEXT DEFAULT \'Active\'');
  await safeAddColumn('users', 'intern_id INTEGER');
  await safeAddColumn('users', 'employee_id INTEGER');

  await safeAddColumn('documents', 'intern_name TEXT');
  await safeAddColumn('documents', 'file_name TEXT');
  await safeAddColumn('documents', 'file_size INTEGER DEFAULT 0');
  await safeAddColumn('documents', 'mime_type TEXT');
  await safeAddColumn('documents', 'stored_filename TEXT');
  await safeAddColumn('documents', 'description TEXT');
  await safeAddColumn('documents', 'download_count INTEGER DEFAULT 0');
  await safeAddColumn('documents', 'employee_id INTEGER');
  await safeAddColumn('documents', 'employee_name TEXT');

  await safeAddColumn('forms', 'form_code TEXT');
  await safeAddColumn('forms', 'title TEXT');
  await safeAddColumn('forms', 'category TEXT');
  await safeAddColumn('forms', 'description TEXT');
  await safeAddColumn('forms', 'format TEXT DEFAULT \'PDF\'');
  await safeAddColumn('forms', 'file_path TEXT');
  await safeAddColumn('forms', 'file_name TEXT');
  await safeAddColumn('forms', 'file_size INTEGER DEFAULT 0');
  await safeAddColumn('forms', 'mime_type TEXT');
  await safeAddColumn('forms', 'stored_filename TEXT');
  await safeAddColumn('forms', 'is_popular INTEGER DEFAULT 0');
  await safeAddColumn('forms', 'download_count INTEGER DEFAULT 0');
  await safeAddColumn('forms', 'pdf_url TEXT');
  await safeAddColumn('forms', 'uploaded_by TEXT');
  await safeAddColumn('forms', 'updated_date TEXT');

  // Seed default official departments if empty
  const deptCountRes = await db.prepare('SELECT COUNT(*) as count FROM departments').get();
  if (!deptCountRes || Number(deptCountRes.count) === 0) {
    const insertDept = db.prepare('INSERT INTO departments (name, code) VALUES (?, ?)');
    const defaultDepts = [
      ['GIS & Remote Sensing', 'GIS-RS'],
      ['Software & Systems Engineering', 'SWE'],
      ['Environmental Analytics & Climate', 'ENV'],
      ['AI & Geospatial Intelligence', 'AI-GEO'],
      ['Space Applications & Cartography', 'SAC'],
      ['Administration & HR Operations', 'ADM']
    ];
    for (const [name, code] of defaultDepts) {
      await insertDept.run(name, code);
    }
  }

  // Seed default system users if empty
  const userRes = await db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!userRes || Number(userRes.count) === 0) {
    const defaultPermissions = JSON.stringify({
      biometric_attendance: true,
      forms_downloads: true,
      intern_onboarding: true,
      ims_access: true,
      excel_upload: true,
      super_admin: true
    });

    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, designation, role_name, role_id, module_permissions, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await insertUser.run('superadmin', 'superadmin@assac.internal', 'super123', 'Super Admin Operator', 'System Governance Lead', 'Super Admin', 1, defaultPermissions, 'Active');
    await insertUser.run('admin', 'admin@assac.internal', 'admin123', 'Assam State Office Admin', 'HR Administrator', 'Office Admin', 2, defaultPermissions, 'Active');
    await insertUser.run('ims', 'ims@assac.internal', 'ims123', 'IMS Governance Officer', 'Document & Student Officer', 'IMS Admin', 3, JSON.stringify({ intern_onboarding: true, ims_access: true, forms_downloads: true }), 'Active');
    await insertUser.run('employee', 'employee@assac.internal', 'emp123', 'Staff Employee', 'Research Assistant', 'Employee', 4, JSON.stringify({ forms_downloads: true }), 'Active');
    await insertUser.run('intern', 'intern@assac.internal', 'intern123', 'Ananya Sharma', 'Research Scholar Intern', 'Intern', 5, JSON.stringify({ ims_access: true, forms_downloads: true }), 'Active');
  }

  // Seed initial sample interns if empty (Official details only, no stipends)
  const internCount = await db.prepare('SELECT COUNT(*) as count FROM interns').get();
  if (!internCount || Number(internCount.count) === 0) {
    const insertIntern = db.prepare(`
      INSERT INTO interns (
        intern_code, name, email, university, degree, department, mentor,
        project_title, joining_date, duration_months, status, certificate_issued, attendance_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialInterns = [
      ['INT-2026-001', 'Ananya Sharma', 'ananya.s@assac.internal', 'IIT Guwahati', 'M.Tech Remote Sensing & GIS', 'GIS & Remote Sensing', 'Dr. P. K. Baruah (Scientist-SF)', 'Automated Wetland Inundation Analysis using Sentinel-1 SAR', '2026-01-15', 6, 'Active', 1, 98.4],
      ['INT-2026-002', 'Rahul Gogoi', 'rahul.g@assac.internal', 'Assam Engineering College', 'B.Tech Computer Science', 'Software & Systems Engineering', 'Er. R. Kalita (Senior Systems Specialist)', 'Full Stack Attendance Intelligence Portal & React Frontend', '2026-02-01', 6, 'Active', 0, 96.0],
      ['INT-2026-003', 'Priyanka Das', 'priyanka.d@assac.internal', 'Gauhati University', 'M.Sc Environmental Science', 'Environmental Analytics & Climate', 'Dr. S. Saikia (Senior Scientist)', 'Brahmaputra Basin Deforestation Mapping via LandSat-9', '2026-01-10', 6, 'Active', 1, 94.5],
      ['INT-2026-004', 'Bikash Saikia', 'bikash.s@assac.internal', 'NIT Silchar', 'M.Tech Artificial Intelligence', 'AI & Geospatial Intelligence', 'Er. M. Hazarika (Data Lead)', 'Computer Vision Crop Yield Prediction from Drone Imagery', '2026-03-01', 6, 'Active', 0, 100.0],
      ['INT-2026-005', 'Dimple Bezbaruah', 'dimple.b@assac.internal', 'Dibrugarh University', 'M.Sc Geoinformatics', 'GIS & Remote Sensing', 'Dr. P. K. Baruah (Scientist-SF)', 'Land Surface Temperature Estimation over Urban Heat Islands', '2026-02-15', 6, 'Active', 0, 92.0],
      ['INT-2026-006', 'Jitendra Nath', 'jitendra.n@assac.internal', 'Jorhat Engineering College', 'B.Tech Information Technology', 'Software & Systems Engineering', 'Er. R. Kalita (Senior Systems Specialist)', 'Microservices API Gateway & Database Synchronization Engine', '2026-03-10', 6, 'Active', 1, 97.2],
      ['INT-2026-007', 'Subhra Chakrabarty', 'subhra.c@assac.internal', 'Tezpur University', 'M.Sc Physics & Atmospheric Science', 'Environmental Analytics & Climate', 'Dr. S. Saikia (Senior Scientist)', 'Monsoon Aerosol Optical Depth Seasonal Analysis', '2026-01-20', 6, 'Active', 0, 99.1],
      ['INT-2026-008', 'Himangshu Borah', 'himangshu.b@assac.internal', 'Assam University Silchar', 'M.Tech Computer Vision', 'AI & Geospatial Intelligence', 'Er. M. Hazarika (Data Lead)', 'Satellite Image Segmentation for River Morphological Tracking', '2026-04-01', 6, 'Active', 0, 95.8]
    ];

    for (const item of initialInterns) {
      await insertIntern.run(...item);
    }
  }

  // Seed sample documents if empty
  const docCount = await db.prepare('SELECT COUNT(*) as count FROM documents').get();
  if (!docCount || Number(docCount.count) === 0) {
    const insertDoc = db.prepare(`
      INSERT INTO documents (title, category, file_path, uploaded_by, intern_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    const initialDocs = [
      ['Sentinel-1 SAR Wetland Project Final Report.pdf', 'Project Deliverable', 'uploads/sample_report1.pdf', 'IMS Officer', 'Ananya Sharma'],
      ['React Frontend Architecture & Code Spec.pdf', 'Technical Documentation', 'uploads/sample_spec.pdf', 'IMS Officer', 'Rahul Gogoi'],
      ['Brahmaputra Basin Deforestation Dataset.xlsx', 'Research Data', 'uploads/sample_data.xlsx', 'IMS Officer', 'Priyanka Das'],
      ['Internship Completion Certificate - Ananya Sharma.pdf', 'Completion Certificate', 'uploads/cert_ananya.pdf', 'Administrative Officer', 'Ananya Sharma'],
      ['Drone Crop Yield Prediction Model Artifacts.zip', 'Project Deliverable', 'uploads/crop_model.zip', 'IMS Officer', 'Bikash Saikia'],
      ['Completion Certificate - Priyanka Das.pdf', 'Completion Certificate', 'uploads/cert_priyanka.pdf', 'Administrative Officer', 'Priyanka Das']
    ];

    for (const doc of initialDocs) {
      await insertDoc.run(...doc);
    }
  }

  // Seed default official forms if empty
  const formsCount = await db.prepare('SELECT COUNT(*) as count FROM forms').get();
  if (!formsCount || Number(formsCount.count) === 0) {
    const insertForm = db.prepare(`
      INSERT INTO forms (
        form_code, title, category, format, file_size, updated_date, description, is_popular, pdf_url, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialForms = [
      ['ASSAC-HR-F-01', 'Standard Leave Application Form (CL / EL / ML)', 'Attendance & Leave', 'PDF', 148480, '15 Jan 2026', 'Official application format for applying Casual Leave (CL), Earned Leave (EL), and Medical Leave (ML). Requires HOD signature.', 1, null, 'Office Admin'],
      ['ASSAC-HR-F-02', 'Biometric Missed Punch & Regularization Form', 'Attendance & Leave', 'PDF', 112640, '01 Feb 2026', 'Form for regularizing missed biometric clock-in or clock-out times due to official duty, machine error, or field work.', 1, null, 'Office Admin'],
      ['ASSAC-HR-F-03', 'Station Leave Clearance Certificate', 'Attendance & Leave', 'PDF', 128000, '10 Jan 2026', 'Prior permission format required before leaving district headquarters during weekends, holidays, or official leave.', 0, null, 'Office Admin'],
      ['ASSAC-HR-F-04', 'Field Duty & Outstation Tour Order Approval', 'Attendance & Leave', 'DOCX', 87040, '20 Feb 2026', 'Requisition format for official outstation field surveys, satellite ground truth validation, and departmental tours.', 0, null, 'Office Admin'],
      ['ASSAC-GAD-2026', 'Official Govt of Assam Holiday Roster 2026 (GAD Notification)', 'Attendance & Leave', 'PDF', 353280, '01 Jan 2026', 'Official Notification (e-file No. 221561/440) detailing Gazetted, Half Holiday, Restricted, and Special Casual Leave schedule.', 1, '/api/holidays/pdf', 'Office Admin'],
      ['ASSAC-FIN-V-01', 'Travelling Allowance (TA/DA) Claim Voucher Format', 'Finance & Claims', 'XLSX', 225280, '05 Mar 2026', 'Itemized Excel spreadsheet format for claiming daily allowance, hotel stay, railway/flight tickets, and tour expenses.', 1, null, 'Office Admin'],
      ['ASSAC-FIN-V-02', 'Local Conveyance Reimbursement Claim Slip', 'Finance & Claims', 'PDF', 97280, '12 Feb 2026', 'Voucher for claiming official local taxi, auto-rickshaw, or mileage expenses within city limits.', 0, null, 'Office Admin'],
      ['ASSAC-FIN-V-03', 'Medical Expense Reimbursement Application', 'Finance & Claims', 'PDF', 184320, '18 Jan 2026', 'Official form for submitting medical treatment bills, hospital summary, and pharmacy receipts for reimbursement.', 0, null, 'Office Admin'],
      ['ASSAC-STR-R-01', 'Office Stationery & IT Store Requisition Slip', 'Stores & Requisitions', 'PDF', 117760, '14 Feb 2026', 'Indent format for requesting office stationery, printer cartridges, desk accessories, and computer consumables.', 1, null, 'Office Admin'],
      ['ASSAC-STR-R-02', 'Temporary Equipment Loan & Issue Slip (GPS / Laptops)', 'Stores & Requisitions', 'PDF', 133120, '28 Jan 2026', 'Issue voucher for borrowing lab instruments, survey GPS units, drone kits, or laptops for field projects.', 0, null, 'Office Admin'],
      ['ASSAC-SEC-G-01', 'Visitor Gate Pass & Security Clearance Format', 'Stores & Requisitions', 'PDF', 92160, '02 Mar 2026', 'Pre-authorization pass format for official visitors, research scholars, and contractors entering office premises.', 0, null, 'Office Admin'],
      ['ASSAC-INT-F-01', 'Intern Onboarding & Verification Checklist Format', 'Academic & Interns', 'PDF', 163840, '10 Feb 2026', 'Mandatory onboarding format for research interns, university students, and project fellows joining ASSAC.', 1, null, 'Office Admin'],
      ['ASSAC-INT-F-02', 'Intern Internship Final Project Cover Page Format', 'Academic & Interns', 'DOCX', 76800, '01 Mar 2026', 'Standard institutional title page format for bound internship project reports and thesis submissions.', 0, null, 'Office Admin'],
      ['ASSAC-INT-F-03', 'No-Dues Clearance Form for Certificate Issuance', 'Academic & Interns', 'PDF', 107520, '22 Feb 2026', 'Clearance certificate required from Library, IT, and Mentor before issuing internship completion certificate.', 1, null, 'Office Admin']
    ];

    for (const f of initialForms) {
      await insertForm.run(...f);
    }
  }
}

initDb().catch(err => console.error('DB Init Error:', err));

module.exports = db;
