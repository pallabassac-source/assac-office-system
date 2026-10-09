const departmentRepository = require('../repositories/department_repository');

class DepartmentController {
  async getDepartments(req, res) {
    try {
      const departments = await departmentRepository.getAllDepartments();
      res.json({
        success: true,
        count: departments.length,
        data: departments.map(d => d.name),
        detailed: departments
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createDepartment(req, res) {
    try {
      const { name, code } = req.body;
      if (!name) return res.status(400).json({ success: false, error: 'Department name is required' });
      const dept = await departmentRepository.createDepartment(name, code);
      res.status(201).json({ success: true, message: `Department "${dept.name}" created`, data: dept });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteDepartment(req, res) {
    try {
      const name = req.params.name;
      await departmentRepository.deleteDepartment(name);
      res.json({ success: true, message: `Department "${name}" deleted` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new DepartmentController();
