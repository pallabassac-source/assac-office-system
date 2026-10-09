const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const attendanceController = require('../controllers/attendance_controller');
const internController = require('../controllers/intern_controller');
const employeeController = require('../controllers/employee_controller');
const departmentController = require('../controllers/department_controller');
const authController = require('../controllers/auth_controller');
const timeService = require('../services/time_service');

// Configure multer file upload
const uploadsDir = process.env.UPLOADS_DIR || path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(xls|xlsx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xls, .xlsx) files are allowed!'), false);
    }
  }
});

// ==========================================
// 1. AUTHENTICATION & SYSTEM USERS (SUPER ADMIN)
// ==========================================
router.post('/auth/login', authController.login);
router.get('/auth/system-users', authController.getSystemUsers);
router.post('/auth/system-users', authController.saveSystemUser);
router.delete('/auth/system-users/:id', authController.deleteSystemUser);
router.get('/email/status', authController.getEmailServiceStatus);

// ==========================================
// 2. INTERNS & IMS DOCUMENT DESK ROUTES
// ==========================================
router.get('/interns', internController.getInterns);
router.post('/interns', internController.createIntern);
router.get('/interns/documents', internController.getDocuments);
router.post('/interns/documents', internController.createDocument);
router.delete('/interns/documents/:id', internController.deleteDocument);
router.get('/interns/:id', internController.getInternDetail);
router.put('/interns/:id', internController.updateIntern);
router.post('/interns/:id/certificate', internController.issueCertificate);
router.get('/interns/:id/certificate/pdf', internController.downloadCertificate);
router.post('/interns/:id/certificate/email', internController.emailCertificate);
router.delete('/interns/:id', internController.deleteIntern);

// ==========================================
// 3. EMPLOYEE & CREDENTIALS MANAGEMENT (OFFICE ADMIN)
// ==========================================
router.get('/employees', employeeController.getEmployees);
router.post('/employees', employeeController.createEmployee);
router.get('/employees/:id', employeeController.getEmployeeDetail);
router.put('/employees/:id', employeeController.updateEmployee);
router.post('/employees/:id/credentials', employeeController.manageCredentials);
router.delete('/employees/:id', employeeController.deleteEmployee);

// ==========================================
// 4. DYNAMIC DEPARTMENTS MANAGEMENT
// ==========================================
router.get('/departments', departmentController.getDepartments);
router.post('/departments', departmentController.createDepartment);
router.delete('/departments/:name', departmentController.deleteDepartment);

// ==========================================
// 5. ATTENDANCE & EXCEL INGESTION ROUTES
// ==========================================
router.post('/attendance/upload', upload.single('file'), attendanceController.uploadExcel);
router.post('/attendance/ingest', attendanceController.ingestData);
router.get('/attendance/periods', attendanceController.getAvailablePeriods);
router.delete('/attendance/clear', attendanceController.clearData);
router.get('/dashboard/stats', attendanceController.getDashboardStats);
router.get('/attendance/records', attendanceController.getRecords);
router.get('/analytics', attendanceController.getAnalytics);

// ==========================================
// 6. EXPORT ROUTES
// ==========================================
router.get('/export/excel', attendanceController.exportExcel);
router.get('/export/pdf', attendanceController.exportPDF);

// ==========================================
// 7. SYSTEM AUDIT LOGS
// ==========================================
router.get('/audit-logs', attendanceController.getAuditLogs);

// ==========================================
// 8. TIME SYNC & HEALTH CHECK
// ==========================================
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Enterprise Attendance & Operations Backend Operational',
    timestamp_12h: new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    timestamp_iso: new Date().toISOString()
  });
});

router.get('/time', (req, res) => {
  res.json(timeService.getTimePayload());
});

router.post('/time', (req, res) => {
  try {
    const { date, reset } = req.body;
    if (reset) {
      const now = timeService.resetServerTime();
      return res.json({ 
        success: true, 
        message: 'Server time reset to system clock', 
        now: now.toISOString(),
        payload: timeService.getTimePayload() 
      });
    }
    if (!date) {
      return res.status(400).json({ 
        success: false, 
        error: 'date string is required (e.g. "2026-10-09 11:30:00" or "2026-10-01")' 
      });
    }
    const updated = timeService.setServerTime(date);
    res.json({
      success: true,
      message: 'Server time set successfully',
      server_date: updated.toISOString(),
      payload: timeService.getTimePayload()
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// 9. OFFICIAL HOLIDAYS (Govt of Assam GAD Notified)
// ==========================================
router.get('/holidays', (req, res) => {
  const holidays = [
    // GAZETTED HOLIDAYS (35 Items)
    { id: 1, date: '2026-01-14', title: 'Magh Bihu & Tusu Puja', name: 'Magh Bihu & Tusu Puja', category: 'Gazetted', type: 'Gazetted', day: 'Wednesday', description: 'Assam harvest festival and Tusu Puja celebrations.' },
    { id: 2, date: '2026-01-15', title: 'Magh Bihu', name: 'Magh Bihu', category: 'Gazetted', type: 'Gazetted', day: 'Thursday', description: 'Traditional harvest festival celebrated across Assam.' },
    { id: 3, date: '2026-01-23', title: 'Netaji’s Birthday', name: "Netaji's Birthday", category: 'Gazetted', type: 'Gazetted', day: 'Friday', description: 'Birth anniversary of Netaji Subhas Chandra Bose.' },
    { id: 4, date: '2026-01-26', title: 'Republic Day', name: 'Republic Day', category: 'Gazetted', type: 'Gazetted', day: 'Monday', description: 'National holiday commemorating the adoption of the Constitution of India.' },
    { id: 5, date: '2026-01-27', title: 'Gwthar Bathou San', name: 'Gwthar Bathou San', category: 'Gazetted', type: 'Gazetted', day: 'Tuesday', description: 'Traditional Bathou religious and cultural observance.' },
    { id: 6, date: '2026-01-31', title: 'Me-Dam-Me-Phi', name: 'Me-Dam-Me-Phi', category: 'Gazetted', type: 'Gazetted', day: 'Saturday', description: 'Ahom ancestor worship festival observed in Assam.' },
    { id: 7, date: '2026-02-01', title: 'Bir Chilaray Divas', name: 'Bir Chilaray Divas', category: 'Gazetted', type: 'Gazetted', day: 'Sunday', description: 'Day commemorating the legendary Koch general Bir Chilaray.' },
    { id: 8, date: '2026-03-03', title: 'Dol Jatra', name: 'Dol Jatra', category: 'Gazetted', type: 'Gazetted', day: 'Tuesday', description: 'Festival of colours and traditional Dol Jatra celebrations.' },
    { id: 9, date: '2026-03-21', title: 'Id-Ul-Fitr', name: 'Id-Ul-Fitr', category: 'Gazetted', type: 'Gazetted', day: 'Saturday', description: 'Festival marking the conclusion of Ramadan.' },
    { id: 10, date: '2026-04-03', title: 'Good Friday', name: 'Good Friday', category: 'Gazetted', type: 'Gazetted', day: 'Friday', description: 'Christian observance commemorating the crucifixion of Jesus Christ.' },
    { id: 11, date: '2026-04-14', title: 'Bohag Bihu', name: 'Bohag Bihu', category: 'Gazetted', type: 'Gazetted', day: 'Tuesday', description: 'Assamese New Year and the beginning of Rongali Bihu celebrations.' },
    { id: 12, date: '2026-04-15', title: 'Bohag Bihu (Day 2)', name: 'Bohag Bihu (Day 2)', category: 'Gazetted', type: 'Gazetted', day: 'Wednesday', description: 'Second day of the Rongali Bihu celebrations.' },
    { id: 13, date: '2026-04-16', title: 'Bohag Bihu (Day 3)', name: 'Bohag Bihu (Day 3)', category: 'Gazetted', type: 'Gazetted', day: 'Thursday', description: 'Third day of the Rongali Bihu celebrations.' },
    { id: 14, date: '2026-04-18', title: 'Tithi of Damodar Deva', name: 'Tithi of Damodar Deva', category: 'Gazetted', type: 'Gazetted', day: 'Saturday', description: 'Commemoration of the Tithi of Vaishnavite saint Damodar Deva.' },
    { id: 15, date: '2026-04-21', title: 'Sati Sadhini Divas', name: 'Sati Sadhini Divas', category: 'Gazetted', type: 'Gazetted', day: 'Tuesday', description: 'Day commemorating Sati Sadhini and her historical legacy.' },
    { id: 16, date: '2026-05-01', title: 'May Day & Budha Purnima', name: 'May Day & Budha Purnima', category: 'Gazetted', type: 'Gazetted', day: 'Friday', description: 'International Workers’ Day and Buddha Purnima.' },
    { id: 17, date: '2026-05-27', title: 'Id-ul-Zuha', name: 'Id-ul-Zuha', category: 'Gazetted', type: 'Gazetted', day: 'Wednesday', description: 'Eid al-Adha, the Islamic festival of sacrifice.' },
    { id: 18, date: '2026-06-01', title: 'Janmotsav of Sri Sri Madhabdeva', name: 'Janmotsav of Sri Sri Madhabdeva', category: 'Gazetted', type: 'Gazetted', day: 'Monday', description: 'Birth anniversary celebration of Vaishnavite saint Sri Sri Madhabdeva.' },
    { id: 19, date: '2026-08-15', title: 'Independence Day', name: 'Independence Day', category: 'Gazetted', type: 'Gazetted', day: 'Saturday', description: 'National holiday commemorating India’s independence.' },
    { id: 20, date: '2026-09-01', title: 'Tirubhav Tithi of Sri Sri Madhabdeva', name: 'Tirubhav Tithi of Sri Sri Madhabdeva', category: 'Gazetted', type: 'Gazetted', day: 'Tuesday', description: 'Commemoration of the Tirubhav Tithi of Sri Sri Madhabdeva.' },
    { id: 21, date: '2026-09-04', title: 'Janmastomi', name: 'Janmastomi', category: 'Gazetted', type: 'Gazetted', day: 'Friday', description: 'Festival celebrating the birth of Lord Krishna.' },
    { id: 22, date: '2026-09-12', title: 'Tirubhav Tithi of Srimanta Sankardeva', name: 'Tirubhav Tithi of Srimanta Sankardeva', category: 'Gazetted', type: 'Gazetted', day: 'Saturday', description: 'Commemoration of the passing anniversary of Srimanta Sankardeva.' },
    { id: 23, date: '2026-09-21', title: 'Janmotsav of Srimanta Sankardeva', name: 'Janmotsav of Srimanta Sankardeva', category: 'Gazetted', type: 'Gazetted', day: 'Monday', description: 'Birth anniversary celebration of Srimanta Sankardeva.' },
    { id: 24, date: '2026-09-22', title: 'Karam Puja', name: 'Karam Puja', category: 'Gazetted', type: 'Gazetted', day: 'Tuesday', description: 'Traditional Karam Puja festival observed by communities across Assam.' },
    { id: 25, date: '2026-10-02', title: 'Birthday of Mahatma Gandhi', name: 'Birthday of Mahatma Gandhi', category: 'Gazetted', type: 'Gazetted', day: 'Friday', description: 'Birth anniversary of Mahatma Gandhi and national holiday.' },
    { id: 26, date: '2026-10-18', title: 'Kati Bihu & Durga Puja', name: 'Kati Bihu & Durga Puja', category: 'Gazetted', type: 'Gazetted', day: 'Sunday', description: 'Kati Bihu observance and Durga Puja festival.' },
    { id: 27, date: '2026-10-19', title: 'Durga Puja & Vijaya Dashomi', name: 'Durga Puja & Vijaya Dashomi', category: 'Gazetted', type: 'Gazetted', day: 'Monday', description: 'Durga Puja and Vijaya Dashomi celebrations.' },
    { id: 28, date: '2026-10-20', title: 'Durga Puja (Day 3)', name: 'Durga Puja (Day 3)', category: 'Gazetted', type: 'Gazetted', day: 'Tuesday', description: 'Durga Puja festival holiday.' },
    { id: 29, date: '2026-10-21', title: 'Durga Puja (Day 4)', name: 'Durga Puja (Day 4)', category: 'Gazetted', type: 'Gazetted', day: 'Wednesday', description: 'Durga Puja festival holiday.' },
    { id: 30, date: '2026-11-08', title: 'Kali Puja & Diwali', name: 'Kali Puja & Diwali', category: 'Gazetted', type: 'Gazetted', day: 'Sunday', description: 'Festival of lights and Kali Puja celebrations.' },
    { id: 31, date: '2026-11-11', title: 'Bhatri Dwitiya', name: 'Bhatri Dwitiya', category: 'Gazetted', type: 'Gazetted', day: 'Wednesday', description: 'Traditional festival celebrating the bond between brothers and sisters.' },
    { id: 32, date: '2026-11-15', title: 'Chhath Puja', name: 'Chhath Puja', category: 'Gazetted', type: 'Gazetted', day: 'Sunday', description: 'Traditional Hindu festival dedicated to the worship of the Sun.' },
    { id: 33, date: '2026-11-24', title: 'Guru Nanak’s Birthday & Lachit Divas', name: "Guru Nanak's Birthday & Lachit Divas", category: 'Gazetted', type: 'Gazetted', day: 'Tuesday', description: 'Birth anniversary of Guru Nanak and Lachit Divas.' },
    { id: 34, date: '2026-12-02', title: 'Asom Divas (Su-Ka-Pha Divas)', name: 'Asom Divas (Su-Ka-Pha Divas)', category: 'Gazetted', type: 'Gazetted', day: 'Wednesday', description: 'Commemorates Chaolung Sukaphaa, founder of the Ahom Kingdom.' },
    { id: 35, date: '2026-12-25', title: 'Christmas Day', name: 'Christmas Day', category: 'Gazetted', type: 'Gazetted', day: 'Friday', description: 'Christmas Day celebrations.' }
  ];

  const getWeekendOffSaturdays = (year = 2026) => {
    const list = [];
    let idCounter = 100;
    for (let m = 0; m < 12; m++) {
      let satCount = 0;
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, m, d);
        if (dateObj.getDay() === 6) {
          satCount++;
          if (satCount === 2 || satCount === 4) {
            const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const label = satCount === 2 ? '2nd Saturday (Weekend Off)' : '4th Saturday (Weekend Off)';
            list.push({
              id: idCounter++,
              date: dateStr,
              title: label,
              name: label,
              category: 'Weekend Off',
              type: 'Weekend Off',
              day: 'Saturday',
              description: `Official Govt of Assam ${satCount === 2 ? '2nd' : '4th'} Saturday weekend off holiday.`
            });
          }
        }
      }
    }
    return list;
  };

  const allHolidays = [...holidays, ...getWeekendOffSaturdays(2026)];

  res.json({
    success: true,
    count: allHolidays.length,
    holidays: allHolidays
  });
});

module.exports = router;
