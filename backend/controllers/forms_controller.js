const path = require('path');
const fs = require('fs');
const formsRepository = require('../repositories/forms_repository');
const storageService = require('../services/storage_service');

class FormsController {
  async getForms(req, res) {
    try {
      const category = req.query.category || null;
      const search = req.query.search || null;
      const limit = parseInt(req.query.limit, 10) || 200;
      const offset = parseInt(req.query.offset, 10) || 0;

      const forms = await formsRepository.getForms({ category, search, limit, offset });
      res.json({ success: true, count: forms.length, data: forms });
    } catch (error) {
      console.error('[FormsController] getForms error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getFormById(req, res) {
    try {
      const id = req.params.id;
      const form = await formsRepository.getFormById(id);
      if (!form) {
        return res.status(404).json({ success: false, error: 'Form record not found' });
      }
      res.json({ success: true, data: form });
    } catch (error) {
      console.error('[FormsController] getFormById error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createForm(req, res) {
    try {
      const body = req.body || {};
      const file = req.file;

      const title = (body.title || '').trim();
      if (!title) {
        return res.status(400).json({ success: false, error: 'Form title is required' });
      }

      let formCode = (body.form_code || '').trim().toUpperCase();
      if (!formCode) {
        formCode = `ASSAC-FORM-${Date.now().toString().slice(-4)}`;
      }

      // Check for code uniqueness
      const existing = await formsRepository.getFormByCode(formCode);
      if (existing) {
        return res.status(400).json({ success: false, error: `Form code "${formCode}" already exists. Please choose a unique code.` });
      }

      let format = (body.format || 'PDF').toUpperCase();
      let filePath = body.file_path || null;
      let storedFilename = null;
      let fileName = file ? file.originalname : (body.file_name || null);
      let fileSize = file ? file.size : (parseInt(body.file_size, 10) || 0);
      let mimeType = file ? file.mimetype : (body.mime_type || 'application/pdf');

      if (file) {
        filePath = path.relative(storageService.getRootDir(), file.path).replace(/\\/g, '/');
        storedFilename = file.filename;
        const ext = path.extname(file.originalname).replace('.', '').toUpperCase();
        if (ext) format = ext;
      }

      const isPopular = body.is_popular === true || body.is_popular === 'true' || body.is_popular === 1 || body.is_popular === '1';

      const payload = {
        form_code: formCode,
        title,
        category: body.category || 'General Administration',
        description: body.description || '',
        format,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        stored_filename: storedFilename,
        is_popular: isPopular,
        pdf_url: body.pdf_url || null,
        uploaded_by: body.uploaded_by || (req.user ? (req.user.name || req.user.username) : 'Office Admin')
      };

      const newForm = await formsRepository.createForm(payload, req.user ? req.user.id : 1);
      res.status(201).json({
        success: true,
        message: `Official form "${title}" (${formCode}) registered successfully!`,
        data: newForm
      });
    } catch (error) {
      console.error('[FormsController] createForm error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateForm(req, res) {
    try {
      const id = req.params.id;
      const existing = await formsRepository.getFormById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Form record not found' });
      }

      const body = req.body || {};
      const file = req.file;

      const payload = {};
      if (body.title !== undefined) payload.title = body.title.trim();
      if (body.category !== undefined) payload.category = body.category;
      if (body.description !== undefined) payload.description = body.description;
      if (body.format !== undefined) payload.format = body.format.toUpperCase();
      if (body.pdf_url !== undefined) payload.pdf_url = body.pdf_url;
      if (body.is_popular !== undefined) {
        payload.is_popular = body.is_popular === true || body.is_popular === 'true' || body.is_popular === 1 || body.is_popular === '1';
      }

      if (body.form_code !== undefined) {
        const newCode = body.form_code.trim().toUpperCase();
        if (newCode !== existing.form_code) {
          const codeCheck = await formsRepository.getFormByCode(newCode);
          if (codeCheck && codeCheck.id !== parseInt(id, 10)) {
            return res.status(400).json({ success: false, error: `Form code "${newCode}" is already in use.` });
          }
          payload.form_code = newCode;
        }
      }

      if (file) {
        payload.file_path = path.relative(storageService.getRootDir(), file.path).replace(/\\/g, '/');
        payload.stored_filename = file.filename;
        payload.file_name = file.originalname;
        payload.file_size = file.size;
        payload.mime_type = file.mimetype;
        const ext = path.extname(file.originalname).replace('.', '').toUpperCase();
        if (ext) payload.format = ext;
      }

      const updated = await formsRepository.updateForm(id, payload, req.user ? req.user.id : 1);
      res.json({
        success: true,
        message: `Form "${updated.title}" successfully updated!`,
        data: updated
      });
    } catch (error) {
      console.error('[FormsController] updateForm error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteForm(req, res) {
    try {
      const id = req.params.id;
      const success = await formsRepository.deleteForm(id, req.user ? req.user.id : 1);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Form record not found' });
      }
      res.json({
        success: true,
        message: 'Official form and associated file removed successfully.'
      });
    } catch (error) {
      console.error('[FormsController] deleteForm error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async downloadForm(req, res) {
    try {
      const id = req.params.id;
      const form = await formsRepository.getFormById(id);
      if (!form) {
        return res.status(404).json({ success: false, error: 'Form record not found' });
      }

      await formsRepository.incrementDownloadCount(id);

      // If form has an explicit pdf_url (e.g. /api/holidays/pdf)
      if (form.pdf_url) {
        return res.redirect(form.pdf_url);
      }

      // Check physical file
      if (form.file_path) {
        const fullPath = storageService.resolveSafeFilePath(form.file_path);
        if (fullPath && fs.existsSync(fullPath)) {
          const downloadName = form.file_name || `${form.form_code}_${form.title}.${(form.format || 'pdf').toLowerCase()}`;
          return res.download(fullPath, downloadName);
        }
      }

      // If no physical file is attached, generate official text document on the fly
      const filename = `${form.form_code}_${form.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
      const docContent = `================================================================
ASSAM STATE SPACE APPLICATION CENTRE (ASSAC)
GOVERNMENT OF ASSAM • SCIENCE, TECHNOLOGY & CLIMATE CHANGE DEPT.
================================================================
OFFICIAL RECORD & FORM REPOSITORY
================================================================
FORM TITLE : ${form.title.toUpperCase()}
FORM CODE  : ${form.code || form.form_code}
CATEGORY   : ${form.category}
FORMAT     : ${form.format || 'OFFICIAL'}
LAST UPDATE: ${form.updated_date || form.updatedDate || '2026'}
REVISION   : 2026.1 (REV 2)
AUTHORITY  : ${form.uploaded_by || 'Assam State Office Administration'}
================================================================

PURPOSE & SUMMARY:
${form.description || 'Official departmental requisition format.'}

----------------------------------------------------------------
APPLICANT / OFFICER DETAILS:
----------------------------------------------------------------
1. Full Name of Officer / Employee: ________________________________________
2. Designation / Role: ___________________ Emp ID / Code: __________________
3. Department / Division: ________________ Phone / Intercom: _______________
4. Date of Application: _____ / _____ / 2026

----------------------------------------------------------------
REQUISITION / DECLARATION DETAILS:
----------------------------------------------------------------
[ ] Purpose / Justification:
    ____________________________________________________________________
    ____________________________________________________________________
    ____________________________________________________________________

[ ] Duration / Amount / Items Requested:
    ____________________________________________________________________
    ____________________________________________________________________

----------------------------------------------------------------
SIGNATURES & APPROVAL CHAIN:
----------------------------------------------------------------

Applicant Signature: __________________   Date: ________________________

Verified By Section Head: _____________   HOD Approval: ________________

Registrar / Director Remarks:
[ ] APPROVED    [ ] REJECTED    [ ] CLARIFICATION REQUIRED

Authorized Seal & Signature: ___________________________________________
================================================================
ASSAC Intranet Document Vault • Generated from Official Records
================================================================`;

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(docContent);
    } catch (error) {
      console.error('[FormsController] downloadForm error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async viewForm(req, res) {
    try {
      const id = req.params.id;
      const form = await formsRepository.getFormById(id);
      if (!form) {
        return res.status(404).json({ success: false, error: 'Form record not found' });
      }

      if (form.pdf_url) {
        return res.redirect(form.pdf_url);
      }

      if (form.file_path) {
        const fullPath = storageService.resolveSafeFilePath(form.file_path);
        if (fullPath && fs.existsSync(fullPath)) {
          const mime = form.mime_type || 'application/pdf';
          res.setHeader('Content-Type', mime);
          return fs.createReadStream(fullPath).pipe(res);
        }
      }

      // If text template, display inline
      return this.downloadForm(req, res);
    } catch (error) {
      console.error('[FormsController] viewForm error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new FormsController();
