const db = require('../db/database');

class DepartmentRepository {
  /**
   * Get dynamic aggregated list of all departments
   */
  async getAllDepartments() {
    const deptRows = await db.prepare('SELECT name, code FROM departments ORDER BY name ASC').all();
    const empDepts = await db.prepare('SELECT DISTINCT department as name FROM employees WHERE department IS NOT NULL AND department != ""').all();
    const internDepts = await db.prepare('SELECT DISTINCT department as name FROM interns WHERE department IS NOT NULL AND department != ""').all();

    const uniqueMap = new Map();

    // 1. Defined master departments
    deptRows.forEach(d => {
      if (d.name && d.name.trim()) {
        uniqueMap.set(d.name.trim(), { name: d.name.trim(), code: d.code || null });
      }
    });

    // 2. Discovered employee departments
    empDepts.forEach(d => {
      if (d.name && d.name.trim() && !uniqueMap.has(d.name.trim())) {
        uniqueMap.set(d.name.trim(), { name: d.name.trim(), code: null });
      }
    });

    // 3. Discovered intern departments
    internDepts.forEach(d => {
      if (d.name && d.name.trim() && !uniqueMap.has(d.name.trim())) {
        uniqueMap.set(d.name.trim(), { name: d.name.trim(), code: null });
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Add a new department
   */
  async createDepartment(name, code = null) {
    if (!name || !name.trim()) throw new Error('Department name is required');
    const cleanName = name.trim();
    const cleanCode = code ? code.trim() : cleanName.split(' ').map(w => w[0]).join('').toUpperCase();

    const insert = db.prepare(`
      INSERT INTO departments (name, code)
      VALUES (?, ?)
      ON CONFLICT(name) DO UPDATE SET code = excluded.code
    `);

    await insert.run(cleanName, cleanCode);
    return { name: cleanName, code: cleanCode };
  }

  /**
   * Delete a department from master list
   */
  async deleteDepartment(name) {
    await db.prepare('DELETE FROM departments WHERE name = ?').run(name);
    return true;
  }
}

module.exports = new DepartmentRepository();
