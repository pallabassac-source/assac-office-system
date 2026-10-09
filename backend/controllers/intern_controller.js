const internRepository = require('../repositories/intern_repository');
const storageService = require('../services/storage_service');
const path = require('path');
const fs = require('fs');

class InternController {
  async getInterns(req, res) {
    try {
      const department = req.query.department || null;
      const search = req.query.search || null;
      const status = req.query.status || null;
      const limit = parseInt(req.query.limit, 10) || 100;
      const offset = parseInt(req.query.offset, 10) || 0;

      const interns = await internRepository.getInterns({ department, search, status, limit, offset });
      res.json({ success: true, count: interns.length, data: interns });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getInternDetail(req, res) {
    try {
      const id = req.params.id;
      const intern = await internRepository.getInternById(id);
      if (!intern) {
        return res.status(404).json({ success: false, error: 'Intern record not found' });
      }
      res.json({ success: true, data: intern });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createIntern(req, res) {
    try {
      const { internData, credentials } = req.body;
      if (!internData || !internData.name) {
        return res.status(400).json({ success: false, error: 'Intern name and essential fields are required' });
      }

      const newIntern = await internRepository.createIntern(
        internData,
        credentials || {},
        req.user ? req.user.id : 1
      );

      res.status(201).json({
        success: true,
        message: `Student "${newIntern.name}" successfully onboarded with login @${newIntern.user_login || newIntern.intern_code}!`,
        data: newIntern
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateIntern(req, res) {
    try {
      const id = req.params.id;
      const updateData = req.body;
      const updated = await internRepository.updateIntern(id, updateData, req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Intern record updated successfully', data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async issueCertificate(req, res) {
    try {
      const id = req.params.id;
      const { certificateDate } = req.body;
      const updated = await internRepository.issueCertificate(id, certificateDate, req.user ? req.user.id : 1);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Intern record not found' });
      }

      const emailNote = updated.email_status?.sent 
        ? ' A softcopy has been dispatched to their email.' 
        : ' (Softcopy email logged in mock mode)';

      res.json({
        success: true,
        message: `Official e-certificate successfully issued for ${updated.name}!${emailNote}`,
        data: updated
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async downloadCertificate(req, res) {
    try {
      const id = req.params.id;
      const result = await internRepository.generateCertificatePDF(id);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Intern record not found' });
      }

      const safeCode = (result.intern.intern_code || 'INT').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `ASSAC_Certificate_${safeCode}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(result.pdfBuffer);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async emailCertificate(req, res) {
    try {
      const id = req.params.id;
      const { email } = req.body;
      const result = await internRepository.emailCertificate(id, email);
      res.json({
        success: true,
        message: `E-Certificate softcopy successfully dispatched to ${result.email}!`,
        data: result
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteIntern(req, res) {
    try {
      const id = req.params.id;
      const success = await internRepository.deleteIntern(id, req.user ? req.user.id : 1);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Intern not found' });
      }
      res.json({ success: true, message: 'Intern successfully deleted from registry.' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getDocuments(req, res) {
    try {
      const category = req.query.category || null;
      const search = req.query.search || null;
      const internId = req.query.internId ? parseInt(req.query.internId, 10) : null;
      const limit = parseInt(req.query.limit, 10) || 100;
      const offset = parseInt(req.query.offset, 10) || 0;

      const docs = await internRepository.getDocuments({ category, search, internId, limit, offset });
      res.json({ success: true, count: docs.length, data: docs });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createDocument(req, res) {
    try {
      const body = req.body || {};
      const file = req.file;

      const title = body.title ? body.title.trim() : (file ? file.originalname : null);
      if (!title) {
        return res.status(400).json({ success: false, error: 'Document title or file is required' });
      }

      let filePath = body.file_path;
      let storedFilename = null;
      let originalName = file ? file.originalname : (body.file_name || title);
      let fileSize = file ? file.size : (parseInt(body.file_size, 10) || 0);
      let mimeType = file ? file.mimetype : (body.mime_type || 'application/octet-stream');

      if (file) {
        // Compute relative path within uploads dir for portability
        filePath = path.relative(storageService.getRootDir(), file.path).replace(/\\/g, '/');
        storedFilename = file.filename;
      } else if (!filePath) {
        filePath = `deliverables/${Date.now()}_${title.replace(/\s+/g, '_')}.pdf`;
      }

      const docPayload = {
        title,
        category: body.category || 'Project Deliverable',
        file_path: filePath,
        file_name: originalName,
        file_size: fileSize,
        mime_type: mimeType,
        stored_filename: storedFilename,
        description: body.description || null,
        uploaded_by: body.uploaded_by || (req.user ? (req.user.name || req.user.username) : 'IMS Portal'),
        intern_id: body.intern_id ? parseInt(body.intern_id, 10) : null,
        intern_name: body.intern_name ? body.intern_name.trim() : 'General Project Archive',
        employee_id: body.employee_id ? parseInt(body.employee_id, 10) : null,
        employee_name: body.employee_name ? body.employee_name.trim() : null
      };

      const doc = await internRepository.createDocument(docPayload, req.user ? req.user.id : 1);
      res.status(201).json({ 
        success: true, 
        message: `File "${title}" successfully stored in IMS Storage Vault!`, 
        data: doc 
      });
    } catch (error) {
      console.error('[InternController] Create document error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async downloadDocument(req, res) {
    try {
      const id = req.params.id;
      const doc = await internRepository.getDocumentById(id);
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Document record not found' });
      }

      const fullPath = storageService.resolveSafeFilePath(doc.file_path);
      if (!fullPath || !fs.existsSync(fullPath)) {
        return res.status(404).json({ 
          success: false, 
          error: `Physical file "${doc.file_name || doc.title}" was not found on storage volume. It may have been moved or archived.` 
        });
      }

      await internRepository.incrementDownloadCount(id);

      const downloadName = doc.file_name || doc.title || 'document';
      res.download(fullPath, downloadName);
    } catch (error) {
      console.error('[InternController] Download document error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async viewDocument(req, res) {
    try {
      const id = req.params.id;
      const doc = await internRepository.getDocumentById(id);
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Document record not found' });
      }

      const fullPath = storageService.resolveSafeFilePath(doc.file_path);
      if (!fullPath || !fs.existsSync(fullPath)) {
        return res.status(404).json({ 
          success: false, 
          error: `Physical file "${doc.file_name || doc.title}" was not found on storage volume.` 
        });
      }

      const mimeType = doc.mime_type || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name || doc.title)}"`);
      res.sendFile(fullPath);
    } catch (error) {
      console.error('[InternController] View document error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteDocument(req, res) {
    try {
      const id = req.params.id;
      const success = await internRepository.deleteDocument(id, req.user ? req.user.id : 1);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }
      res.json({ success: true, message: 'Document and physical file purged from storage disk' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getStorageStatus(req, res) {
    try {
      const disk = storageService.getDiskStats();
      const files = storageService.getStoredFilesSummary();
      res.json({
        success: true,
        disk,
        files
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new InternController();
