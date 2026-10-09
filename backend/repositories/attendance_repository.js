const db = require('../db/database');
const timeService = require('../services/time_service');

class AttendanceRepository {
  /**
   * Save parsed attendance payload into database using single transaction
   */
  async ingestParsedData(parsedData, userId = 1) {
    const serverNow = timeService.getServerDate();
    const month = meta.month || (serverNow.getMonth() + 1);
    const year = meta.year || serverNow.getFullYear();
    const reportPeriod = meta.period_from && meta.period_to ? `${meta.period_from} to ${meta.period_to}` : `${month}/${year}`;

    const insertEmp = db.prepare(`
      INSERT INTO employees (emp_code, name, department, designation, branch)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(emp_code) DO UPDATE SET
        name = excluded.name,
        department = excluded.department,
        designation = excluded.designation,
        branch = excluded.branch
    `);

    const getEmpByCode = db.prepare('SELECT id FROM employees WHERE emp_code = ?');

    const insertMonthly = db.prepare(`
      INSERT INTO attendance_monthly (
        employee_id, month, year, report_period, present_days, holiday_days,
        weekly_off_days, absent_days, leave_days, paid_days, late_hours,
        total_work_hours, overtime_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(employee_id, month, year) DO UPDATE SET
        report_period = excluded.report_period,
        present_days = excluded.present_days,
        holiday_days = excluded.holiday_days,
        weekly_off_days = excluded.weekly_off_days,
        absent_days = excluded.absent_days,
        leave_days = excluded.leave_days,
        paid_days = excluded.paid_days,
        late_hours = excluded.late_hours,
        total_work_hours = excluded.total_work_hours,
        overtime_hours = excluded.overtime_hours
    `);

    const insertDaily = db.prepare(`
      INSERT INTO attendance_daily (
        employee_id, date, day_num, status, arrival_time, departure_time, work_hours, overtime_hours, shift
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(employee_id, date) DO UPDATE SET
        status = excluded.status,
        arrival_time = excluded.arrival_time,
        departure_time = excluded.departure_time,
        work_hours = excluded.work_hours,
        overtime_hours = excluded.overtime_hours,
        shift = excluded.shift
    `);

    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, ?, ?)
    `);

    let insertedEmps = 0;
    let insertedDaily = 0;

    await db.exec('BEGIN TRANSACTION');
    try {
      for (const emp of employees) {
        await insertEmp.run(emp.emp_code, emp.name, emp.department, emp.designation, emp.branch);
        const empRecord = await getEmpByCode.get(emp.emp_code);
        const empId = empRecord.id;
        insertedEmps++;

        const s = emp.summary;
        await insertMonthly.run(
          empId, month, year, reportPeriod,
          s.present, s.holiday, s.weekly_off, s.absent, s.leave, s.paid_days,
          s.late_hours, s.work_hours, s.overtime
        );

        if (emp.daily && Array.isArray(emp.daily)) {
          for (const d of emp.daily) {
            const dayStr = String(d.day_num).padStart(2, '0');
            const monthStr = String(month).padStart(2, '0');
            const dateStr = d.date || `${year}-${monthStr}-${dayStr}`;

            await insertDaily.run(
              empId, dateStr, d.day_num, d.status,
              d.arrival, d.departure, d.work_hrs, d.overtime, d.shift
            );
            insertedDaily++;
          }
        }
      }

      await insertAudit.run(userId, 'EXCEL_INGESTION', `Ingested ${insertedEmps} employees & ${insertedDaily} daily records for ${month}/${year}`);
      await db.exec('COMMIT');
      return { insertedEmployees: insertedEmps, insertedDailyRecords: insertedDaily };
    } catch (err) {
      await db.exec('ROLLBACK');
      throw err;
    }
  }

  async getDashboardStats(month = null, year = null, department = null) {
    const serverNow = timeService.getServerDate();
    month = month || (serverNow.getMonth() + 1);
    year = year || serverNow.getFullYear();
    let deptFilter = '';
    const params = [month, year];

    if (department && department !== 'ALL') {
      deptFilter = ' AND e.department = ? ';
      params.push(department);
    }

    const summarySql = `
      SELECT 
        COUNT(am.id) as total_employees,
        SUM(am.present_days) as total_present,
        SUM(am.absent_days) as total_absent,
        SUM(am.leave_days) as total_leave,
        SUM(am.holiday_days) as total_holidays,
        SUM(am.weekly_off_days) as total_weekly_off,
        SUM(am.paid_days) as total_paid_days
      FROM attendance_monthly am
      JOIN employees e ON am.employee_id = e.id
      WHERE am.month = ? AND am.year = ? ${deptFilter}
    `;

    const summary = (await db.prepare(summarySql).get(...params)) || {};

    const empDetailsSql = `
      SELECT 
        am.total_work_hours,
        am.overtime_hours,
        am.late_hours,
        am.absent_days,
        am.present_days,
        e.emp_code,
        e.name,
        e.department,
        e.designation
      FROM attendance_monthly am
      JOIN employees e ON am.employee_id = e.id
      WHERE am.month = ? AND am.year = ? ${deptFilter}
    `;

    const rows = await db.prepare(empDetailsSql).all(...params);

    const parseMinutes = (timeStr) => {
      if (!timeStr || timeStr === '00:00' || timeStr === '0') return 0;
      const parts = String(timeStr).split(':');
      if (parts.length === 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }
      return 0;
    };

    let totalWorkMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalLateMinutes = 0;

    let highestOvertime = { name: 'N/A', hours: '00:00', minutes: 0 };
    let highestWorkHours = { name: 'N/A', hours: '00:00', minutes: 0 };
    const perfectAttendanceList = [];

    rows.forEach(r => {
      const workMins = parseMinutes(r.total_work_hours);
      const otMins = parseMinutes(r.overtime_hours);
      const lateMins = parseMinutes(r.late_hours);

      totalWorkMinutes += workMins;
      totalOvertimeMinutes += otMins;
      totalLateMinutes += lateMins;

      if (otMins > highestOvertime.minutes) {
        highestOvertime = { name: r.name, code: r.emp_code, hours: r.overtime_hours, minutes: otMins };
      }
      if (workMins > highestWorkHours.minutes) {
        highestWorkHours = { name: r.name, code: r.emp_code, hours: r.total_work_hours, minutes: workMins };
      }

      if (r.absent_days === 0 && r.present_days > 0) {
        perfectAttendanceList.push({
          emp_code: r.emp_code,
          name: r.name,
          department: r.department,
          designation: r.designation,
          present_days: r.present_days,
          work_hours: r.total_work_hours
        });
      }
    });

    const formatMinsToHHMM = (totalMins) => {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const totalEmps = summary.total_employees || 0;
    const avgWorkMinutes = totalEmps ? Math.round(totalWorkMinutes / totalEmps) : 0;
    const avgOvertimeMinutes = totalEmps ? Math.round(totalOvertimeMinutes / totalEmps) : 0;

    return {
      period: { month, year },
      total_employees: summary.total_employees || 0,
      total_present: summary.total_present || 0,
      total_absent: summary.total_absent || 0,
      total_leave: summary.total_leave || 0,
      total_holidays: summary.total_holidays || 0,
      total_weekly_off: summary.total_weekly_off || 0,
      total_paid_days: summary.total_paid_days || 0,
      total_work_hours: formatMinsToHHMM(totalWorkMinutes),
      avg_work_hours: formatMinsToHHMM(avgWorkMinutes),
      total_overtime: formatMinsToHHMM(totalOvertimeMinutes),
      avg_overtime: formatMinsToHHMM(avgOvertimeMinutes),
      total_late_hours: formatMinsToHHMM(totalLateMinutes),
      highest_overtime: highestOvertime,
      highest_work_hours: highestWorkHours,
      perfect_attendance_count: perfectAttendanceList.length,
      perfect_attendance: perfectAttendanceList,
      perfect_employees: perfectAttendanceList
    };
  }

  async getRecords({ month = null, year = null, department = null, search = null, limit = 100, offset = 0 }) {
    const serverNow = timeService.getServerDate();
    month = month || (serverNow.getMonth() + 1);
    year = year || serverNow.getFullYear();
    let sql = `
      SELECT 
        e.id as employee_id,
        e.emp_code,
        e.name,
        e.department,
        e.designation,
        e.branch,
        am.present_days,
        am.holiday_days,
        am.weekly_off_days,
        am.absent_days,
        am.leave_days,
        am.paid_days,
        am.late_hours,
        am.total_work_hours,
        am.overtime_hours,
        am.report_period
      FROM employees e
      JOIN attendance_monthly am ON e.id = am.employee_id AND am.month = ? AND am.year = ?
      WHERE 1=1
    `;
    const params = [month, year];

    if (department && department !== 'ALL') {
      sql += ' AND e.department = ? ';
      params.push(department);
    }

    if (search) {
      sql += ' AND (e.name LIKE ? OR e.emp_code LIKE ? OR e.designation LIKE ?) ';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY CAST(e.emp_code AS INTEGER) ASC LIMIT ? OFFSET ? ';
    params.push(limit, offset);

    return await db.prepare(sql).all(...params);
  }

  async getEmployeeDetail(employeeId, month = null, year = null) {
    const serverNow = timeService.getServerDate();
    month = month || (serverNow.getMonth() + 1);
    year = year || serverNow.getFullYear();
    const emp = await db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
    if (!emp) return null;

    const summary = await db.prepare(`
      SELECT * FROM attendance_monthly 
      WHERE employee_id = ? AND month = ? AND year = ?
    `).get(employeeId, month, year);

    let daily = [];
    if (summary && summary.report_period && summary.report_period.includes(' to ')) {
      const parts = summary.report_period.split(/\s*to\s*/i);
      const sParts = parts[0].trim().split('-');
      const eParts = parts[1].trim().split('-');
      if (sParts.length === 3 && eParts.length === 3) {
        const sDate = `${sParts[2]}-${sParts[1]}-${sParts[0]}`;
        const eDate = `${eParts[2]}-${eParts[1]}-${eParts[0]}`;
        daily = await db.prepare(`
          SELECT * FROM attendance_daily
          WHERE employee_id = ? AND date >= ? AND date <= ?
          ORDER BY date ASC
        `).all(employeeId, sDate, eDate);
      }
    }

    if (!daily || daily.length === 0) {
      const monthStr = String(month).padStart(2, '0');
      const datePrefix = `${year}-${monthStr}-%`;
      daily = await db.prepare(`
        SELECT * FROM attendance_daily
        WHERE employee_id = ? AND date LIKE ?
        ORDER BY date ASC, day_num ASC
      `).all(employeeId, datePrefix);
    }

    return {
      employee: emp,
      summary: summary || null,
      daily: daily
    };
  }

  async getDetailedAttendanceMatrix(month = null, year = null, department = null) {
    const serverNow = timeService.getServerDate();
    month = month || (serverNow.getMonth() + 1);
    year = year || serverNow.getFullYear();
    let sql = `
      SELECT e.id as employee_id, e.emp_code, e.name, e.department, e.designation, am.report_period
      FROM employees e
      JOIN attendance_monthly am ON e.id = am.employee_id AND am.month = ? AND am.year = ?
      WHERE 1=1
    `;
    const params = [month, year];
    if (department && department !== 'ALL') {
      sql += ' AND e.department = ? ';
      params.push(department);
    }
    sql += ' ORDER BY CAST(e.emp_code AS INTEGER) ASC ';

    const employees = await db.prepare(sql).all(...params);
    const samplePeriod = employees.length > 0 ? employees[0].report_period : null;

    let periodDates = [];
    let getDailySql;

    if (samplePeriod && samplePeriod.includes(' to ')) {
      const parts = samplePeriod.split(/\s*to\s*/i);
      const sParts = parts[0].trim().split('-');
      const eParts = parts[1].trim().split('-');
      if (sParts.length === 3 && eParts.length === 3) {
        const sDate = `${sParts[2]}-${sParts[1]}-${sParts[0]}`;
        const eDate = `${eParts[2]}-${eParts[1]}-${eParts[0]}`;
        const dateRows = await db.prepare(`
          SELECT DISTINCT date FROM attendance_daily
          WHERE date >= ? AND date <= ?
          ORDER BY date ASC
        `).all(sDate, eDate);
        periodDates = dateRows.map(r => r.date);

        getDailySql = db.prepare(`
          SELECT date, day_num, status, arrival_time, departure_time, work_hours, overtime_hours
          FROM attendance_daily
          WHERE employee_id = ? AND date >= ? AND date <= ?
          ORDER BY date ASC
        `);
      }
    }

    if (!getDailySql) {
      const monthStr = String(month).padStart(2, '0');
      const datePrefix = `${year}-${monthStr}-%`;
      const dateRows = await db.prepare(`
        SELECT DISTINCT date FROM attendance_daily
        WHERE date LIKE ?
        ORDER BY date ASC
      `).all(datePrefix);
      periodDates = dateRows.map(r => r.date);

      getDailySql = db.prepare(`
        SELECT date, day_num, status, arrival_time, departure_time, work_hours, overtime_hours
        FROM attendance_daily
        WHERE employee_id = ? AND date LIKE ?
        ORDER BY date ASC, day_num ASC
      `);
    }

    const result = [];
    for (const emp of employees) {
      let dailyRecords;
      if (samplePeriod && samplePeriod.includes(' to ')) {
        const parts = samplePeriod.split(/\s*to\s*/i);
        const sParts = parts[0].trim().split('-');
        const eParts = parts[1].trim().split('-');
        const sDate = `${sParts[2]}-${sParts[1]}-${sParts[0]}`;
        const eDate = `${eParts[2]}-${eParts[1]}-${eParts[0]}`;
        dailyRecords = await getDailySql.all(emp.employee_id, sDate, eDate);
      } else {
        const monthStr = String(month).padStart(2, '0');
        const datePrefix = `${year}-${monthStr}-%`;
        dailyRecords = await getDailySql.all(emp.employee_id, datePrefix);
      }

      const dailyMap = {};
      dailyRecords.forEach(d => {
        dailyMap[d.date] = d;
        dailyMap[d.day_num] = d;
      });
      result.push({
        ...emp,
        dailyMap
      });
    }

    return {
      period: {
        month,
        year,
        report_period: samplePeriod,
        dates: periodDates
      },
      employees: result
    };
  }

  async deleteAttendanceData({ month = null, year = null, employeeId = null, clearAll = false, userId = 1 }) {
    let deletedMonthlyCount = 0;
    let deletedDailyCount = 0;

    if (clearAll) {
      deletedDailyCount = (await db.prepare('DELETE FROM attendance_daily').run()).changes;
      deletedMonthlyCount = (await db.prepare('DELETE FROM attendance_monthly').run()).changes;
      await db.prepare('DELETE FROM employees').run();
      await db.prepare(`INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'PURGE_ALL_DATA', 'Purged all employee and attendance records')`).run(userId);
      return { message: 'All database data successfully purged.', deletedMonthlyCount, deletedDailyCount };
    }

    if (employeeId) {
      if (month && year) {
        const monthStr = String(month).padStart(2, '0');
        const datePrefix = `${year}-${monthStr}-%`;
        deletedDailyCount = (await db.prepare('DELETE FROM attendance_daily WHERE employee_id = ? AND date LIKE ?').run(employeeId, datePrefix)).changes;
        deletedMonthlyCount = (await db.prepare('DELETE FROM attendance_monthly WHERE employee_id = ? AND month = ? AND year = ?').run(employeeId, month, year)).changes;
      } else {
        deletedDailyCount = (await db.prepare('DELETE FROM attendance_daily WHERE employee_id = ?').run(employeeId)).changes;
        deletedMonthlyCount = (await db.prepare('DELETE FROM attendance_monthly WHERE employee_id = ?').run(employeeId)).changes;
        await db.prepare('DELETE FROM employees WHERE id = ?').run(employeeId);
      }
      await db.prepare(`INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'DELETE_EMPLOYEE', 'Deleted attendance records for employee ID ${employeeId}')`).run(userId);
      return { message: `Deleted records for employee ID ${employeeId}`, deletedMonthlyCount, deletedDailyCount };
    }

    if (month && year) {
      const sampleMonthly = await db.prepare('SELECT report_period FROM attendance_monthly WHERE month = ? AND year = ? LIMIT 1').get(month, year);
      if (sampleMonthly && sampleMonthly.report_period && sampleMonthly.report_period.includes(' to ')) {
        const parts = sampleMonthly.report_period.split(/\s*to\s*/i);
        const sParts = parts[0].trim().split('-');
        const eParts = parts[1].trim().split('-');
        if (sParts.length === 3 && eParts.length === 3) {
          const sDate = `${sParts[2]}-${sParts[1]}-${sParts[0]}`;
          const eDate = `${eParts[2]}-${eParts[1]}-${eParts[0]}`;
          deletedDailyCount = (await db.prepare('DELETE FROM attendance_daily WHERE date >= ? AND date <= ?').run(sDate, eDate)).changes;
        }
      }

      if (deletedDailyCount === 0) {
        const monthStr = String(month).padStart(2, '0');
        const datePrefix = `${year}-${monthStr}-%`;
        deletedDailyCount = (await db.prepare('DELETE FROM attendance_daily WHERE date LIKE ?').run(datePrefix)).changes;
      }

      deletedMonthlyCount = (await db.prepare('DELETE FROM attendance_monthly WHERE month = ? AND year = ?').run(month, year)).changes;
      
      await db.prepare(`
        DELETE FROM employees 
        WHERE id NOT IN (SELECT DISTINCT employee_id FROM attendance_monthly)
        AND id NOT IN (SELECT DISTINCT employee_id FROM users WHERE employee_id IS NOT NULL)
      `).run();

      await db.prepare(`INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'DELETE_MONTH_DATA', 'Deleted monthly attendance records for ${month}/${year}')`).run(userId);
      return { message: `Deleted attendance data for period ${month}/${year}`, deletedMonthlyCount, deletedDailyCount };
    }

    return { message: 'No deletion action specified.' };
  }

  async getAvailablePeriods() {
    const sql = `
      SELECT 
        am.month, 
        am.year, 
        COUNT(am.id) as employee_count,
        MIN(am.report_period) as report_period,
        SUM(am.present_days) as total_present,
        SUM(am.absent_days) as total_absent,
        SUM(am.leave_days) as total_leave
      FROM attendance_monthly am
      GROUP BY am.month, am.year
      ORDER BY am.year DESC, am.month DESC
    `;
    return await db.prepare(sql).all();
  }

  async getDepartmentList() {
    const rows = await db.prepare('SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != "" ORDER BY department').all();
    return rows.map(r => r.department);
  }

  async getAuditLogs(limit = 50) {
    return await db.prepare(`
      SELECT a.*, u.username 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.timestamp DESC 
      LIMIT ?
    `).all(limit);
  }
}

module.exports = new AttendanceRepository();
