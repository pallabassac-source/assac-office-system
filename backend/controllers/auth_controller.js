const authRepository = require('../repositories/auth_repository');
const emailService = require('../services/email_service');

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await authRepository.authenticate(username, password);
      if (!result.success) {
        return res.status(401).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        token: `assac-jwt-${Date.now()}`,
        user: result.user
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSystemUsers(req, res) {
    try {
      const users = await authRepository.getAllUsers();
      res.json({ success: true, count: users.length, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async saveSystemUser(req, res) {
    try {
      const userData = req.body;
      if (!userData || !userData.username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
      }

      const saved = await authRepository.saveUser(userData, req.user ? req.user.id : 1);
      res.json({ success: true, message: 'User account saved successfully', data: saved });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteSystemUser(req, res) {
    try {
      const id = req.params.id;
      await authRepository.deleteUser(id, req.user ? req.user.id : 1);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getEmailServiceStatus(req, res) {
    try {
      const status = emailService.getStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AuthController();
