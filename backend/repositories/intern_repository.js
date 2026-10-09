const db = require('../db/database');
const emailService = require('../services/email_service');
const exportService = require('../services/export_service');
const storageService = require('../services/storage_service');
const path = require('path');
const fs = require('fs');

class InternRepository {
  /**
   * Get all interns with filtering and pagination
   */
  async getInterns({ department = null, search = null, status = null, limit = 100, offset = 0 } = {}) {
    let sql = `
      SELECT i.*, u.username as user_login, u.status as user_status
      FROM interns i
      LEFT JOIN users u ON i.id = u.intern_id
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== 'ALL') {
      sql += ' AND i.department = ? ';
      params.push(department);
    }

    if (status && status !== 'ALL') {
      sql += ' AND i.status = ? ';
      params.push(status);
    }

    if (search) {
      sql += ' AND (i.name LIKE ? OR i.intern_code LIKE ? OR i.university LIKE ? OR i.project_title LIKE ? OR i.email LIKE ?) ';
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY i.id DESC LIMIT ? OFFSET ? ';
    params.push(Number(limit), Number(offset));

    return await db.prepare(sql).all(...params);
  }

  /**
   * Get single intern by ID or code
   */
  async getInternById(id) {
    const sql = `
      SELECT i.*, u.username as user_login, u.status as user_status
      FROM interns i
      LEFT JOIN users u ON i.id = u.intern_id
      WHERE i.id = ? OR i.intern_code = ?
    `;
    return await db.prepare(sql).get(id, id);
  }

  /**
   * Onboard / Register a new Intern & automatically create their portal login credentials
   */
  async createIntern(data, credentials = {}, userId = 1) {
    // Generate next intern code if not passed
    let internCode = data.intern_code;
    if (!internCode || !internCode.trim()) {
      const countRes = await db.prepare('SELECT COUNT(*) as count FROM interns').get();
      const nextNum = (countRes ? Number(countRes.count) : 0) + 1;
      internCode = `INT-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
    }

    const name = data.name;
    const email = data.email || `${internCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@assac.internal`;
    const university = data.university || 'Affiliated University';
    const degree = data.degree || 'Degree Program';
    const department = data.department || 'GIS & Remote Sensing';
    const mentor = data.mentor || 'Assigned Scientist';
    const projectTitle = data.project_title || 'Research Scope';
    const joiningDate = data.joining_date || new Date().toISOString().split('T')[0];
    const durationMonths = parseInt(data.duration_months, 10) || 6;
    const attendanceRate = parseFloat(data.attendance_rate) || 100.0;

    const insertIntern = db.prepare(`
      INSERT INTO interns (
        intern_code, name, email, university, degree, department, mentor,
        project_title, joining_date, duration_months, status, certificate_issued, attendance_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 0, ?)
    `);

    const result = await insertIntern.run(
      internCode, name, email, university, degree, department, mentor,
      projectTitle, joiningDate, durationMonths, attendanceRate
    );

    const internId = result.lastID;

    // Create user login credentials for the intern
    const username = credentials.username ? credentials.username.trim() : internCode.toLowerCase();
    const password = credentials.password ? credentials.password.trim() : 'intern123';

    try {
      const insertUser = db.prepare(`
        INSERT INTO users (
          username, email, password_hash, full_name, designation,
          role_name, role_id, module_permissions, status, intern_id
        ) VALUES (?, ?, ?, ?, 'Research Scholar Intern', 'Intern', 5, ?, 'Active', ?)
      `);

      const permissions = JSON.stringify({
        ims_access: true,
        forms_downloads: true
      });

      await insertUser.run(username, email, password, name, permissions, internId);
      await db.prepare('UPDATE interns SET user_id = ? WHERE id = ?').run(internId, internId);
    } catch (err) {
      console.warn('[InternRepository] Note creating intern user account:', err.message);
    }

    // Dispatch welcome email via EmailService
    if (data.send_email !== false) {
      try {
        await emailService.sendInternWelcomeEmail({
          to: email,
          name,
          internCode,
          username,
          password,
          mentor,
          department,
          projectTitle
        });
      } catch (e) {
        console.warn('[InternRepository] Email notification notice:', e.message);
      }
    }

    // Audit log
    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'ONBOARD_INTERN', ?)
    `).run(userId, `Onboarded intern ${name} (${internCode}) with login @${username}`);

    return await this.getInternById(internId);
  }

  /**
   * Update intern record
   */
  async updateIntern(id, data, userId = 1) {
    const fields = [];
    const params = [];

    const allowed = [
      'name', 'email', 'university', 'degree', 'department', 'mentor',
      'project_title', 'joining_date', 'duration_months', 'completion_date',
      'status', 'certificate_issued', 'certificate_date', 'attendance_rate'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return await this.getInternById(id);

    params.push(id);
    const sql = `UPDATE interns SET ${fields.join(', ')} WHERE id = ?`;
    await db.prepare(sql).run(...params);

    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'UPDATE_INTERN', ?)
    `).run(userId, `Updated intern ID ${id}`);

    return await this.getInternById(id);
  }

  /**
   * Issue completion certificate, generate PDF file on disk, archive document & send softcopy via email
   */
  async issueCertificate(id, certificateDate = null, userId = 1) {
    const certDate = certificateDate || new Date().toISOString().split('T')[0];
    await db.prepare(`
      UPDATE interns 
      SET certificate_issued = 1, certificate_date = ?, status = 'Completed' 
      WHERE id = ?
    `).run(certDate, id);

    const intern = await this.getInternById(id);
    if (!intern) return null;

    let certPdfBuffer = null;
    try {
      // 1. Generate high-resolution official PDF e-certificate
      certPdfBuffer = await exportService.generateInternCertificatePDF(intern);

      // 2. Save certificate file to uploads/certificates directory
      const certsDir = path.join(__dirname, '../../uploads/certificates');
      if (!fs.existsSync(certsDir)) {
        fs.mkdirSync(certsDir, { recursive: true });
      }
      const certFileName = `cert_${intern.intern_code.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      const certFilePath = path.join(certsDir, certFileName);
      fs.writeFileSync(certFilePath, certPdfBuffer);

      // 3. Auto-create or update document archive entry in IMS Vault
      const existingDoc = await db.prepare(`
        SELECT id FROM documents WHERE intern_id = ? AND category = 'Completion Certificate'
      `).get(intern.id);

      if (!existingDoc) {
        await this.createDocument({
          title: `Internship Completion Certificate - ${intern.name}.pdf`,
          category: 'Completion Certificate',
          file_path: `uploads/certificates/${certFileName}`,
          uploaded_by: 'Office Administration',
          intern_id: intern.id,
          intern_name: intern.name
        }, userId);
      }
    } catch (err) {
      console.error('[InternRepository] Error generating certificate PDF:', err.message);
    }

    // 4. Dispatch softcopy email with attached PDF to the student
    let emailStatus = { sent: false };
    if (intern.email && certPdfBuffer) {
      try {
        const mailRes = await emailService.sendInternCertificateEmail({
          to: intern.email,
          name: intern.name,
          internCode: intern.intern_code,
          department: intern.department,
          projectTitle: intern.project_title,
          certDate: certDate,
          pdfBuffer: certPdfBuffer
        });
        emailStatus = { sent: true, details: mailRes };
      } catch (err) {
        console.warn('[InternRepository] Certificate email notice:', err.message);
        emailStatus = { sent: false, error: err.message };
      }
    }

    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'ISSUE_CERTIFICATE', ?)
    `).run(userId, `Issued official e-certificate for intern ${intern.name} (${intern.intern_code}) with softcopy email dispatch`);

    return { ...intern, email_status: emailStatus };
  }

  /**
   * Get / Generate Certificate PDF buffer on demand for downloading/viewing
   */
  async generateCertificatePDF(id) {
    const intern = await this.getInternById(id);
    if (!intern) return null;

    const pdfBuffer = await exportService.generateInternCertificatePDF(intern);
    return { intern, pdfBuffer };
  }

  /**
   * Resend Certificate Softcopy via Email
   */
  async emailCertificate(id, targetEmail = null) {
    const intern = await this.getInternById(id);
    if (!intern) throw new Error('Intern record not found');

    const toEmail = targetEmail || intern.email;
    if (!toEmail) throw new Error('No email address registered for this intern');

    const pdfBuffer = await exportService.generateInternCertificatePDF(intern);
    const mailRes = await emailService.sendInternCertificateEmail({
      to: toEmail,
      name: intern.name,
      internCode: intern.intern_code,
      department: intern.department,
      projectTitle: intern.project_title,
      certDate: intern.certificate_date || new Date().toISOString().split('T')[0],
      pdfBuffer: pdfBuffer
    });

    return { success: true, email: toEmail, details: mailRes };
  }

  /**
   * Delete intern
   */
  async deleteIntern(id, userId = 1) {
    const intern = await this.getInternById(id);
    if (!intern) return false;

    await db.prepare('DELETE FROM users WHERE intern_id = ?').run(id);
    await db.prepare('DELETE FROM documents WHERE intern_id = ?').run(id);
    await db.prepare('DELETE FROM interns WHERE id = ?').run(id);

    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'DELETE_INTERN', ?)
    `).run(userId, `Deleted intern ID ${id} (${intern.name})`);

    return true;
  }

  /**
   * Get all archived IMS documents
   */
  async getDocuments({ category = null, search = null, internId = null, limit = 100, offset = 0 } = {}) {
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params = [];

    if (category && category !== 'ALL') {
      sql += ' AND category = ? ';
      params.push(category);
    }

    if (internId) {
      sql += ' AND intern_id = ? ';
      params.push(internId);
    }

    if (search) {
      sql += ' AND (title LIKE ? OR intern_name LIKE ? OR uploaded_by LIKE ?) ';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ? ';
    params.push(Number(limit), Number(offset));

    return await db.prepare(sql).all(...params);
  }

  /**
   * Get single document by ID
   */
  async getDocumentById(id) {
    return await db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(id) {
    try {
      await db.prepare('UPDATE documents SET download_count = COALESCE(download_count, 0) + 1 WHERE id = ?').run(id);
    } catch (e) {}
  }

  /**
   * Upload / Create document record with full file metadata
   */
  async createDocument(data, userId = 1) {
    const insert = db.prepare(`
      INSERT INTO documents (
        title, category, file_path, uploaded_by, intern_id, intern_name,
        file_name, file_size, mime_type, stored_filename, description,
        employee_id, employee_name, download_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const result = await insert.run(
      data.title,
      data.category || 'Project Deliverable',
      data.file_path || 'uploads/deliverables/document.pdf',
      data.uploaded_by || 'IMS Officer',
      data.intern_id || null,
      data.intern_name || 'General Repository',
      data.file_name || data.original_name || data.title,
      data.file_size || 0,
      data.mime_type || 'application/octet-stream',
      data.stored_filename || null,
      data.description || null,
      data.employee_id || null,
      data.employee_name || null
    );

    const docId = result.lastID;

    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'UPLOAD_DOCUMENT', ?)
    `).run(userId, `Archived document "${data.title}" (${data.file_name || ''}) in IMS Vault`);

    return await this.getDocumentById(docId);
  }

  /**
   * Delete document record and purge physical file from storage disk
   */
  async deleteDocument(id, userId = 1) {
    const doc = await this.getDocumentById(id);
    if (!doc) return false;

    // Purge physical file from disk storage (/data/uploads)
    if (doc.file_path) {
      storageService.deletePhysicalFile(doc.file_path);
    }

    await db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    await db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'DELETE_DOCUMENT', ?)
    `).run(userId, `Permanently purged document ID ${id} ("${doc.title}") from IMS Vault & disk`);
    return true;
  }
}

module.exports = new InternRepository();
