const db = require('../db/database');
const timeService = require('./time_service');

class AnalyticsService {
  /**
   * Get Department-wise Attendance & Overtime Breakdown
   */
  async getDepartmentAnalytics(month = null, year = null) {
    const serverNow = timeService.getServerDate();
    month = month || (serverNow.getMonth() + 1);
    year = year || serverNow.getFullYear();
    const sql = `
      SELECT 
        COALESCE(e.department, 'Unassigned') as department,
        COUNT(e.id) as emp_count,
        SUM(am.present_days) as total_present,
        SUM(am.absent_days) as total_absent,
        SUM(am.leave_days) as total_leave,
        SUM(am.weekly_off_days) as total_wo,
        SUM(am.holiday_days) as total_hl,
        am.total_work_hours,
        am.overtime_hours,
        am.late_hours
      FROM employees e
      JOIN attendance_monthly am ON e.id = am.employee_id
      WHERE am.month = ? AND am.year = ?
      GROUP BY e.department
    `;

    const rows = await db.prepare(sql).all(month, year);

    const parseMinutes = (timeStr) => {
      if (!timeStr || timeStr === '00:00' || timeStr === '0') return 0;
      const parts = String(timeStr).split(':');
      if (parts.length === 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }
      return 0;
    };

    const formatMins = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    // Aggregate time columns per dept
    const deptMap = {};
    rows.forEach(r => {
      const dept = r.department;
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          emp_count: 0,
          total_present: 0,
          total_absent: 0,
          total_leave: 0,
          total_wo: 0,
          total_hl: 0,
          work_mins: 0,
          ot_mins: 0,
          late_mins: 0
        };
      }

      deptMap[dept].emp_count += r.emp_count;
      deptMap[dept].total_present += r.total_present || 0;
      deptMap[dept].total_absent += r.total_absent || 0;
      deptMap[dept].total_leave += r.total_leave || 0;
      deptMap[dept].total_wo += r.total_wo || 0;
      deptMap[dept].total_hl += r.total_hl || 0;

      deptMap[dept].work_mins += parseMinutes(r.total_work_hours);
      deptMap[dept].ot_mins += parseMinutes(r.overtime_hours);
      deptMap[dept].late_mins += parseMinutes(r.late_hours);
    });

    return Object.values(deptMap).map(d => ({
      ...d,
      work_hours: formatMins(d.work_mins),
      overtime_hours: formatMins(d.ot_mins),
      late_hours: formatMins(d.late_mins),
      attendance_percentage: d.emp_count && (d.total_present + d.total_absent) > 0
        ? ((d.total_present / (d.total_present + d.total_absent)) * 100).toFixed(1)
        : '0.0'
    }));
  }

  /**
   * Get Daily Attendance Trend across the entire month (1..31)
   */
  async getDailyAttendanceTrend(month = null, year = null) {
    const serverNow = timeService.getServerDate();
    month = month || (serverNow.getMonth() + 1);
    year = year || serverNow.getFullYear();
    const monthStr = String(month).padStart(2, '0');
    const datePrefix = `${year}-${monthStr}-%`;

    const sql = `
      SELECT 
        day_num,
        status,
        COUNT(*) as count
      FROM attendance_daily
      WHERE date LIKE ?
      GROUP BY day_num, status
      ORDER BY day_num ASC
    `;

    const rows = await db.prepare(sql).all(datePrefix);

    const trendMap = {};
    for (let day = 1; day <= 31; day++) {
      trendMap[day] = { day: `Day ${day}`, day_num: day, P: 0, A: 0, WO: 0, HL: 0, Leave: 0 };
    }

    rows.forEach(r => {
      if (trendMap[r.day_num]) {
        const st = r.status.trim();
        if (st === 'P') trendMap[r.day_num].P += r.count;
        else if (st === 'A') trendMap[r.day_num].A += r.count;
        else if (st === 'WO') trendMap[r.day_num].WO += r.count;
        else if (st === 'HL') trendMap[r.day_num].HL += r.count;
        else trendMap[r.day_num].Leave += r.count;
      }
    });

    return Object.values(trendMap);
  }

  /**
   * Top Overtime Earners Leaderboard
   */
  async getOvertimeLeaderboard(month = null, year = null, limit = 10) {
    const serverNow = timeService.getServerDate();
    month = month || (serverNow.getMonth() + 1);
    year = year || serverNow.getFullYear();
    const sql = `
      SELECT 
        e.emp_code,
        e.name,
        e.department,
        e.designation,
        am.overtime_hours,
        am.total_work_hours
      FROM attendance_monthly am
      JOIN employees e ON am.employee_id = e.id
      WHERE am.month = ? AND am.year = ? AND am.overtime_hours != '00:00' AND am.overtime_hours != '0'
    `;

    const rows = await db.prepare(sql).all(month, year);

    const parseMins = (t) => {
      if (!t) return 0;
      const parts = String(t).split(':');
      return parts.length === 2 ? parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) : 0;
    };

    return rows
      .map(r => ({ ...r, ot_mins: parseMins(r.overtime_hours) }))
      .sort((a, b) => b.ot_mins - a.ot_mins)
      .slice(0, limit);
  }

  /**
   * Late Arrival Analytics
   */
  async getLateArrivalAnalytics(month = null, year = null, limit = 10) {
    const serverNow = timeService.getServerDate();
    month = month || (serverNow.getMonth() + 1);
    year = year || serverNow.getFullYear();
    const sql = `
      SELECT 
        e.emp_code,
        e.name,
        e.department,
        e.designation,
        am.late_hours,
        am.present_days
      FROM attendance_monthly am
      JOIN employees e ON am.employee_id = e.id
      WHERE am.month = ? AND am.year = ? AND am.late_hours != '00:00' AND am.late_hours != '0'
    `;

    const rows = await db.prepare(sql).all(month, year);

    const parseMins = (t) => {
      if (!t) return 0;
      const parts = String(t).split(':');
      return parts.length === 2 ? parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) : 0;
    };

    return rows
      .map(r => ({ ...r, late_mins: parseMins(r.late_hours) }))
      .sort((a, b) => b.late_mins - a.late_mins)
      .slice(0, limit);
  }
}

module.exports = new AnalyticsService();
