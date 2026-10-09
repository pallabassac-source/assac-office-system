const path = require('path');
const fs = require('fs');
const excelParser = require('../services/excel_parser');
const attendanceRepository = require('../repositories/attendance_repository');
const analyticsService = require('../services/analytics_service');
const exportService = require('../services/export_service');
const timeService = require('../services/time_service');

class AttendanceController {
  /**
   * Upload and Parse Excel File
   * POST /api/attendance/upload
   */
  async uploadExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No Excel file uploaded' });
      }

      const filePath = req.file.path;
      const originalFilename = req.file.originalname || '';
      const parsedData = await excelParser.parseExcelAttendance(filePath, originalFilename);

      // Clean up temp file
      try { fs.unlinkSync(filePath); } catch (e) {}

      res.json({
        success: true,
        message: 'File parsed successfully',
        data: parsedData
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Ingest Parsed Payload to Database
   * POST /api/attendance/ingest
   */
  async ingestData(req, res) {
    try {
      const { parsedData } = req.body;
      if (!parsedData || !parsedData.meta || !parsedData.employees) {
        return res.status(400).json({ success: false, error: 'Invalid payload structure' });
      }

      const result = await attendanceRepository.ingestParsedData(parsedData, req.user ? req.user.id : 1);

      res.json({
        success: true,
        message: `Successfully ingested ${result.insertedEmployees} employees and ${result.insertedDailyRecords} daily attendance logs.`,
        result
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Dashboard High-Level Metrics
   * GET /api/dashboard/stats
   */
  async getDashboardStats(req, res) {
    try {
      const serverNow = timeService.getServerDate();
      const month = parseInt(req.query.month) || (serverNow.getMonth() + 1);
      const year = parseInt(req.query.year) || serverNow.getFullYear();
      const department = req.query.department || null;

      const stats = await attendanceRepository.getDashboardStats(month, year, department);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Filterable Employee Attendance Records
   * GET /api/attendance/records
   */
  async getRecords(req, res) {
    try {
      const serverNow = timeService.getServerDate();
      const month = parseInt(req.query.month) || (serverNow.getMonth() + 1);
      const year = parseInt(req.query.year) || serverNow.getFullYear();
      const department = req.query.department || null;
      const search = req.query.search || null;
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      const records = await attendanceRepository.getRecords({ month, year, department, search, limit, offset });
      res.json({ success: true, data: records, count: records.length });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Individual Employee Detailed View
   * GET /api/employees/:id
   */
  async getEmployeeDetail(req, res) {
    try {
      const serverNow = timeService.getServerDate();
      const empId = parseInt(req.params.id);
      const month = parseInt(req.query.month) || (serverNow.getMonth() + 1);
      const year = parseInt(req.query.year) || serverNow.getFullYear();

      const detail = await attendanceRepository.getEmployeeDetail(empId, month, year);
      if (!detail) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      res.json({ success: true, data: detail });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Department & Analytics Data
   * GET /api/analytics
   */
  async getAnalytics(req, res) {
    try {
      const serverNow = timeService.getServerDate();
      const month = parseInt(req.query.month) || (serverNow.getMonth() + 1);
      const year = parseInt(req.query.year) || serverNow.getFullYear();

      const deptAnalytics = await analyticsService.getDepartmentAnalytics(month, year);
      const dailyTrend = await analyticsService.getDailyAttendanceTrend(month, year);
      const overtimeLeaderboard = await analyticsService.getOvertimeLeaderboard(month, year);
      const lateArrivals = await analyticsService.getLateArrivalAnalytics(month, year);

      res.json({
        success: true,
        data: {
          department_analytics: deptAnalytics,
          daily_trend: dailyTrend,
          overtime_leaderboard: overtimeLeaderboard,
          late_arrivals: lateArrivals
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Department List for Dropdowns
   * GET /api/departments
   */
  async getDepartments(req, res) {
    try {
      const departments = await attendanceRepository.getDepartmentList();
      res.json({ success: true, data: departments });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Export Monthly Excel Workbook
   * GET /api/export/excel
   */
  async exportExcel(req, res) {
    try {
      const serverNow = timeService.getServerDate();
      const month = parseInt(req.query.month) || (serverNow.getMonth() + 1);
      const year = parseInt(req.query.year) || serverNow.getFullYear();
      const department = req.query.department || null;

      const buffer = await exportService.generateMonthlyExcel(month, year, department);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Attendance_Report_${month}_${year}.xlsx`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Export Monthly PDF Report with Custom Options
   * GET /api/export/pdf
   */
  async exportPDF(req, res) {
    try {
      const serverNow = timeService.getServerDate();
      const month = parseInt(req.query.month) || (serverNow.getMonth() + 1);
      const year = parseInt(req.query.year) || serverNow.getFullYear();
      const department = req.query.department || null;

      const options = {
        includeStats: req.query.includeStats !== 'false',
        includeWorkHours: req.query.includeWorkHours !== 'false',
        includeOvertime: req.query.includeOvertime !== 'false',
        includeLateHours: req.query.includeLateHours !== 'false'
      };

      const buffer = await exportService.generateMonthlyPDF(month, year, department, options);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=Attendance_Report_${month}_${year}.pdf`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Clear / Delete Attendance Data (Month/Year, Single Employee, or Purge All)
   * DELETE /api/attendance/clear
   */
  async clearData(req, res) {
    try {
      const month = req.query.month ? parseInt(req.query.month) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      const employeeId = req.query.employee_id ? parseInt(req.query.employee_id) : null;
      const clearAll = req.query.clear_all === 'true';

      const result = await attendanceRepository.deleteAttendanceData({
        month,
        year,
        employeeId,
        clearAll,
        userId: req.user ? req.user.id : 1
      });

      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Audit Logs
   * GET /api/audit-logs
   */
  async getAuditLogs(req, res) {
    try {
      const logs = await attendanceRepository.getAuditLogs();
      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Available Uploaded Periods / Months
   * GET /api/attendance/periods
   */
  async getAvailablePeriods(req, res) {
    try {
      const periods = await attendanceRepository.getAvailablePeriods();
      res.json({ success: true, data: periods });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AttendanceController();
