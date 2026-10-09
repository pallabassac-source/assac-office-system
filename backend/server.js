const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const apiRoutes = require('./routes/api');
const excelParser = require('./services/excel_parser');
const attendanceRepository = require('./repositories/attendance_repository');
const timeService = require('./services/time_service');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Bind to all LAN network interfaces

// Enable CORS for all origins & JSON parsing
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploads
const uploadsDir = process.env.UPLOADS_DIR || path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve frontend static build files if available
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`[Static Server] Serving production frontend build from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
}

// Mount API Router
app.use('/api', apiRoutes);

// Health & Time Sync Check
app.get(['/health', '/api/health'], (req, res) => {
  const timePayload = timeService.getTimePayload();
  res.json({ 
    status: 'OK', 
    message: 'Enterprise Attendance Backend Operational', 
    timestamp_12h: timePayload.timestamp_12h,
    timestamp_iso: timePayload.timestamp_iso 
  });
});

app.get(['/time', '/api/time'], (req, res) => {
  res.json(timeService.getTimePayload());
});

app.post(['/time', '/api/time'], (req, res) => {
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

// Fallback non-API requests to frontend/dist/index.html (compatible with Express 4 & 5)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API route not found' });
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Backend Server Running. Frontend dist not built.');
  }
});

// Auto-seed initial file if DB is empty
async function autoSeedDefaultFile() {
  try {
    const stats = await attendanceRepository.getDashboardStats(5, 2026);
    if (!stats || !stats.total_employees || stats.total_employees === 0) {
      const candidatePaths = [
        path.join(__dirname, 'seeds/MnPerformance May, 2026as.xls'),
        path.join(__dirname, '../MnPerformance May, 2026as.xls')
      ];
      const defaultFilePath = candidatePaths.find(p => fs.existsSync(p));
      if (defaultFilePath) {
        console.log(`[Auto-Seed] Ingesting default workspace file: ${defaultFilePath}`);
        const parsed = await excelParser.parseExcelAttendance(defaultFilePath);
        await attendanceRepository.ingestParsedData(parsed, 1);
        console.log(`[Auto-Seed] Successfully ingested ${parsed.total_employees} employees into SQLite!`);
      }
    }
  } catch (err) {
    console.error('[Auto-Seed] Warning:', err.message);
  }
}

app.listen(PORT, HOST, async () => {
  console.log(`=================================================`);
  console.log(`🚀 ASSAC Intranet Backend Server listening on 0.0.0.0:${PORT}`);
  console.log(`📡 Accessible over LAN at http://192.168.10.117:${PORT}`);
  console.log(`=================================================`);
  
  await autoSeedDefaultFile();
});

