const db = require('../db/database');
const storageService = require('../services/storage_service');

class FormsRepository {
  /**
   * Format a date into official display format: e.g. "09 Mar 2026"
   */
  formatDisplayDate(d = new Date()) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateObj = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return new Date().toLocaleDateString();
    const day = String(dateObj.getDate()).padStart(2, '0');
    const mon = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day} ${mon} ${year}`;
  }

  /**
   * List all official office forms with optional category, search, and pagination
   */
  async getForms({ category = null, search = null, limit = 100, offset = 0 } = {}) {
    let sql = `
      SELECT 
        f.*,
        CASE 
          WHEN f.file_size >= 1073741824 THEN ROUND(CAST(f.file_size AS FLOAT) / 1073741824, 2) || ' GB'
          WHEN f.file_size >= 1048576 THEN ROUND(CAST(f.file_size AS FLOAT) / 1048576, 1) || ' MB'
          WHEN f.file_size >= 1024 THEN ROUND(CAST(f.file_size AS FLOAT) / 1024, 0) || ' KB'
          ELSE f.file_size || ' B'
        END as formatted_size
      FROM forms f
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'ALL') {
      sql += ' AND f.category = ? ';
      params.push(category);
    }

    if (search) {
      sql += ' AND (f.title LIKE ? OR f.form_code LIKE ? OR f.description LIKE ? OR f.category LIKE ?) ';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY f.is_popular DESC, f.id ASC LIMIT ? OFFSET ? ';
    params.push(Number(limit), Number(offset));

    return await db.prepare(sql).all(...params);
  }

  /**
   * Get form by primary key ID
   */
  async getFormById(id) {
    const sql = `
      SELECT 
        f.*,
        CASE 
          WHEN f.file_size >= 1073741824 THEN ROUND(CAST(f.file_size AS FLOAT) / 1073741824, 2) || ' GB'
          WHEN f.file_size >= 1048576 THEN ROUND(CAST(f.file_size AS FLOAT) / 1048576, 1) || ' MB'
          WHEN f.file_size >= 1024 THEN ROUND(CAST(f.file_size AS FLOAT) / 1024, 0) || ' KB'
          ELSE f.file_size || ' B'
        END as formatted_size
      FROM forms f
      WHERE f.id = ?
    `;
    return await db.prepare(sql).get(id);
  }

  /**
   * Get form by official unique code
   */
  async getFormByCode(code) {
    const sql = 'SELECT * FROM forms WHERE form_code = ?';
    return await db.prepare(sql).get(code);
  }

  /**
   * Create new official form record
   */
  async createForm(data, userId = 1) {
    const formCode = (data.form_code || `ASSAC-FORM-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
    const title = (data.title || 'Official Office Form').trim();
    const category = data.category || 'General Administration';
    const description = data.description || '';
    const format = (data.format || 'PDF').toUpperCase();
    const filePath = data.file_path || null;
    const fileName = data.file_name || null;
    const fileSize = parseInt(data.file_size, 10) || 0;
    const mimeType = data.mime_type || 'application/pdf';
    const storedFilename = data.stored_filename || null;
    const isPopular = data.is_popular ? 1 : 0;
    const pdfUrl = data.pdf_url || null;
    const uploadedBy = data.uploaded_by || 'Office Admin';
    const updatedDate = data.updated_date || this.formatDisplayDate();

    const insertSql = `
      INSERT INTO forms (
        form_code, title, category, description, format,
        file_path, file_name, file_size, mime_type, stored_filename,
        is_popular, download_count, pdf_url, uploaded_by, updated_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `;

    const result = await db.prepare(insertSql).run(
      formCode, title, category, description, format,
      filePath, fileName, fileSize, mimeType, storedFilename,
      isPopular, pdfUrl, uploadedBy, updatedDate
    );

    const formId = result ? (result.lastID || result.id) : null;

    // Audit log
    try {
      await db.prepare(`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (?, 'CREATE_FORM', ?)
      `).run(userId, `Created official form ${formCode}: ${title} (${category})`);
    } catch (e) {}

    return await this.getFormById(formId);
  }

  /**
   * Update existing official form
   */
  async updateForm(id, data, userId = 1) {
    const existing = await this.getFormById(id);
    if (!existing) return null;

    const fields = [];
    const params = [];

    const allowed = [
      'form_code', 'title', 'category', 'description', 'format',
      'file_path', 'file_name', 'file_size', 'mime_type', 'stored_filename',
      'is_popular', 'pdf_url', 'uploaded_by'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'is_popular') {
          params.push(data[key] ? 1 : 0);
        } else if (key === 'file_size') {
          params.push(parseInt(data[key], 10) || 0);
        } else {
          params.push(data[key]);
        }
      }
    }

    // Always update date
    fields.push('updated_date = ?');
    params.push(data.updated_date || this.formatDisplayDate());

    if (fields.length === 0) return existing;

    params.push(id);
    const sql = `UPDATE forms SET ${fields.join(', ')} WHERE id = ?`;
    await db.prepare(sql).run(...params);

    // If a new physical file was uploaded and there was an old different physical file, delete the old file
    if (data.file_path && existing.file_path && existing.file_path !== data.file_path) {
      storageService.deletePhysicalFile(existing.file_path);
    }

    // Audit log
    try {
      await db.prepare(`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (?, 'UPDATE_FORM', ?)
      `).run(userId, `Updated official form ID ${id} (${existing.form_code})`);
    } catch (e) {}

    return await this.getFormById(id);
  }

  /**
   * Delete official form and its physical file
   */
  async deleteForm(id, userId = 1) {
    const existing = await this.getFormById(id);
    if (!existing) return false;

    // Delete physical file from storage if present
    if (existing.file_path) {
      storageService.deletePhysicalFile(existing.file_path);
    }

    await db.prepare('DELETE FROM forms WHERE id = ?').run(id);

    // Audit log
    try {
      await db.prepare(`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (?, 'DELETE_FORM', ?)
      `).run(userId, `Deleted official form ${existing.form_code}: ${existing.title}`);
    } catch (e) {}

    return true;
  }

  /**
   * Increment download counter
   */
  async incrementDownloadCount(id) {
    try {
      await db.prepare('UPDATE forms SET download_count = download_count + 1 WHERE id = ?').run(id);
    } catch (e) {}
  }
}

module.exports = new FormsRepository();
