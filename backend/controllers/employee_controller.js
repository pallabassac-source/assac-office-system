const employeeRepository = require('../repositories/employee_repository');
const attendanceRepository = require('../repositories/attendance_repository');
const timeService = require('../services/time_service');

class EmployeeController {
  async getEmployees(req, res) {
    try {
      const department = req.query.department || null;
      const search = req.query.search || null;
      const limit = parseInt(req.query.limit, 10) || 100;
      const offset = parseInt(req.query.offset, 10) || 0;

      const employees = await employeeRepository.getEmployees({ department, search, limit, offset });
      res.json({ success: true, count: employees.length, data: employees });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getEmployeeDetail(req, res) {
    try {
      const serverNow = timeService.getServerDate();
      const id = req.params.id;
      const month = req.query.month ? parseInt(req.query.month, 10) : (serverNow.getMonth() + 1);
      const year = req.query.year ? parseInt(req.query.year, 10) : serverNow.getFullYear();

      const detail = await attendanceRepository.getEmployeeDetail(id, month, year);
      if (detail && detail.employee) {
        return res.json({ success: true, data: detail });
      }

      const emp = await employeeRepository.getEmployeeById(id);
      if (!emp) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }
      res.json({ success: true, data: { employee: emp, summary: null, daily: [] } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createEmployee(req, res) {
    try {
      const { employeeData, credentials } = req.body;
      if (!employeeData || !employeeData.name) {
        return res.status(400).json({ success: false, error: 'Employee name and details are required' });
      }

      const newEmp = await employeeRepository.createEmployee(
        employeeData,
        credentials || {},
        req.user ? req.user.id : 1
      );

      res.status(201).json({
        success: true,
        message: `Employee "${newEmp.name}" successfully created!`,
        data: newEmp
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateEmployee(req, res) {
    try {
      const id = req.params.id;
      const updateData = req.body;
      const updated = await employeeRepository.updateEmployee(id, updateData, req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Employee profile updated', data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async manageCredentials(req, res) {
    try {
      const id = req.params.id;
      const { username, password } = req.body;
      if (!password) {
        return res.status(400).json({ success: false, error: 'Password is required to set credentials' });
      }

      const updated = await employeeRepository.createOrResetCredentials(
        id,
        { username, password },
        req.user ? req.user.id : 1
      );

      res.json({
        success: true,
        message: `Credentials successfully configured for ${updated.name}!`,
        data: updated
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteEmployee(req, res) {
    try {
      const id = req.params.id;
      const success = await employeeRepository.deleteEmployee(id, req.user ? req.user.id : 1);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }
      res.json({ success: true, message: 'Employee successfully removed from system.' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new EmployeeController();
