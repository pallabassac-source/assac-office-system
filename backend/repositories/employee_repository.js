const db = require('../db/database');
const emailService = require('../services/email_service');

class EmployeeRepository {
  /**
   * Get all employees with user account info and pagination
   */
  async getEmployees({ department = null, search = null, limit = 100, offset = 0 } = {}) {
    let sql = `
      SELECT 
        e.*,
        u.id as user_id_account,
        u.username,
        u.status as user_status,
        CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as has_login
      FROM employees e
      LEFT JOIN users u ON e.id = u.employee_id
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== 'ALL') {
      sql += ' AND e.department = ? ';
      params.push(department);
    }

    if (search) {
      sql += ' AND (e.name LIKE ? OR e.emp_code LIKE ? OR e.designation LIKE ? OR e.email LIKE ? OR e.branch LIKE ?) ';
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY CAST(e.emp_code AS INTEGER) ASC, e.id DESC LIMIT ? OFFSET ? ';
    params.push(Number(limit), Number(offset));

    return await db.prepare(sql).all(...params);
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id) {
    const sql = `
      SELECT 
        e.*,
        u.id as user_id_account,
        u.username,
        u.status as user_status,
        CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as has_login
      FROM employees e
      LEFT JOIN users u ON e.id = u.employee_id
      WHERE e.id = ? OR e.emp_code = ?
    `;
    return await db.prepare(sql).get(id, id);
  }

  /**
   * Create new employee & optionally create login credentials
   */
  async createEmployee(data, credentials = {}, userId = 1) {
    let empCode = data.emp_code ? String(data.emp_code).trim() : null;
    if (!empCode) {
      const countRes = await db.prepare('SELECT COUNT(*) as count FROM employees').get();
      const nextNum = (countRes ? Number(countRes.count) : 0) + 100;
      empCode = `EMP-${nextNum}`;
    }

    const name = data.name.trim();
    const email = data.email ? data.email.trim() : `${empCode.toLowerCase()}@assac.internal`;
    const phone = data.phone ? data.phone.trim() : null;
    const department = data.department || 'Administration & HR Operations';
    const designation = data.designation || 'Staff Officer';
    const branch = data.branch || 'Guwahati HQ';

    const insertEmp = db.prepare(`
      INSERT INTO employees (emp_code, name, email, phone, department, designation, branch, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
      ON CONFLICT(emp_code) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        phone = excluded.phone,
        department = excluded.department,
        designation = excluded.designation,
        branch = excluded.branch
    `);

    const result = await insertEmp.run(empCode, name, email, phone, department, designation, branch);
    let empRecord = await this.getEmployeeById(empCode);
    const empId = empRecord ? empRecord.id : result.lastID;

    // Create user login credentials if requested or if password is provided
    if (credentials.create_login !== false && credentials.password) {
      const username = credentials.username ? credentials.username.trim() : empCode.toLowerCase();
      const password = credentials.password.trim();

      try {
        const insertUser = db.prepare(`
          INSERT INTO users (
            username, email, password_hash, full_name, designation,
            role_name, role_id, module_permissions, status, employee_id
          ) VALUES (?, ?, ?, ?, ?, 'Employee', 4, ?, 'Active', ?)
        `);

        const permissions = JSON.stringify({
          forms_downloads: true,
          biometric_attendance: false
        });

        await insertUser.run(username, email, password, name, designation, permissions, empId);
        await db.prepare('UPDATE employees SET user_id = ? WHERE id = ?').run(empId, empId);
      } catch (err) {
        console.warn('[EmployeeRepository] Note creating employee user account:', err.message);
      }

      // Dispatch welcome email via EmailService
      if (data.send_email !== false) {
        try {
          await emailService.sendEmployeeWelcomeEmail({
            to: email,
            name,
            empCode,
            username,
            password,
            department,
            designation
          });
        } catch (e) {
          console.warn('[EmployeeRepository] Email notification notice:', e.message);
        }
      }
    }

    // Audit log
    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'CREATE_EMPLOYEE', ?)
    `).run(userId, `Created employee ${name} (${empCode}) in department ${department}`);

    return await this.getEmployeeById(empId);
  }

  /**
   * Update employee details
   */
  async updateEmployee(id, data, userId = 1) {
    const fields = [];
    const params = [];

    const allowed = ['emp_code', 'name', 'email', 'phone', 'department', 'designation', 'branch', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return await this.getEmployeeById(id);

    params.push(id);
    const sql = `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`;
    await db.prepare(sql).run(...params);

    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'UPDATE_EMPLOYEE', ?)
    `).run(userId, `Updated employee ID ${id}`);

    return await this.getEmployeeById(id);
  }

  /**
   * Create or Reset employee portal login credentials
   */
  async createOrResetCredentials(empId, { username, password }, userId = 1) {
    const emp = await this.getEmployeeById(empId);
    if (!emp) throw new Error('Employee not found');

    const userAccount = await db.prepare('SELECT id FROM users WHERE employee_id = ?').get(emp.id);
    const uname = username ? username.trim() : emp.emp_code.toLowerCase();
    const pass = password ? password.trim() : 'emp123';

    if (userAccount) {
      // Update existing credentials
      await db.prepare(`
        UPDATE users 
        SET username = ?, password_hash = ?, full_name = ?, email = ?
        WHERE id = ?
      `).run(uname, pass, emp.name, emp.email || `${uname}@assac.internal`, userAccount.id);
    } else {
      // Create new user credentials
      const permissions = JSON.stringify({
        forms_downloads: true,
        biometric_attendance: false
      });

      await db.prepare(`
        INSERT INTO users (
          username, email, password_hash, full_name, designation,
          role_name, role_id, module_permissions, status, employee_id
        ) VALUES (?, ?, ?, ?, ?, 'Employee', 4, ?, 'Active', ?)
      `).run(uname, emp.email || `${uname}@assac.internal`, pass, emp.name, emp.designation, permissions, emp.id);
    }

    // Dispatch email notification
    try {
      if (emp.email) {
        await emailService.sendEmployeeWelcomeEmail({
          to: emp.email,
          name: emp.name,
          empCode: emp.emp_code,
          username: uname,
          password: pass,
          department: emp.department,
          designation: emp.designation
        });
      }
    } catch (e) {}

    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'RESET_EMPLOYEE_CREDENTIALS', ?)
    `).run(userId, `Updated credentials for employee ${emp.name} (${emp.emp_code}) -> @${uname}`);

    return await this.getEmployeeById(empId);
  }

  /**
   * Delete employee and associated records
   */
  async deleteEmployee(id, userId = 1) {
    const emp = await this.getEmployeeById(id);
    if (!emp) return false;

    await db.prepare('DELETE FROM users WHERE employee_id = ?').run(id);
    await db.prepare('DELETE FROM attendance_daily WHERE employee_id = ?').run(id);
    await db.prepare('DELETE FROM attendance_monthly WHERE employee_id = ?').run(id);
    await db.prepare('DELETE FROM employees WHERE id = ?').run(id);

    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'DELETE_EMPLOYEE', ?)
    `).run(userId, `Deleted employee ID ${id} (${emp.name})`);

    return true;
  }
}

module.exports = new EmployeeRepository();
