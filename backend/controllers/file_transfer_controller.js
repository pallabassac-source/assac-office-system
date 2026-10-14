const path = require('path');
const fs = require('fs');
const fileTransferRepository = require('../repositories/file_transfer_repository');
const storageService = require('../services/storage_service');

class FileTransferController {
  /**
   * Upload file and generate 3 unique digit key with 24-hour buffer
   */
  async uploadFile(req, res) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No file was selected for upload.' });
      }

      const body = req.body || {};
      const relativePath = path.relative(storageService.getRootDir(), file.path).replace(/\\/g, '/');

      let senderName = (body.sender_name || '').trim();
      if (!senderName && req.user) {
        senderName = req.user.full_name || req.user.name || req.user.username;
      }
      if (!senderName) {
        senderName = 'Intranet Officer';
      }

      const transfer = await fileTransferRepository.createTransfer({
        file_name: file.originalname,
        stored_filename: file.filename,
        file_path: relativePath,
        file_size: file.size,
        mime_type: file.mimetype,
        sender_name: senderName,
        sender_id: req.user ? req.user.id : null,
        notes: (body.notes || '').trim()
      });

      console.log(`[FileTransfer] New transfer registered: Key "${transfer.transfer_key}" for "${transfer.file_name}" (${transfer.file_size_formatted})`);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully! Share the 3-digit key with the receiver to download.',
        data: transfer
      });
    } catch (error) {
      console.error('[FileTransferController] uploadFile error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Lookup transfer by 3 unique digit key (Receiver verification)
   */
  async getTransferInfo(req, res) {
    try {
      const key = (req.params.key || '').trim();
      if (!key) {
        return res.status(400).json({ success: false, error: 'Transfer key is required.' });
      }

      const transfer = await fileTransferRepository.getTransferByKey(key);
      if (!transfer) {
        return res.status(404).json({
          success: false,
          error: `No active file found for key "${key}". It may have expired after 24 hours or the key was entered incorrectly.`
        });
      }

      // Check if file exists on disk
      const resolvedPath = storageService.resolveSafeFilePath(transfer.file_path);
      const fileExists = resolvedPath && fs.existsSync(resolvedPath);

      res.json({
        success: true,
        data: {
          ...transfer,
          file_exists_on_disk: Boolean(fileExists)
        }
      });
    } catch (error) {
      console.error('[FileTransferController] getTransferInfo error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Download file using 3 unique digit key
   */
  async downloadFile(req, res) {
    try {
      const key = (req.params.key || '').trim();
      const transfer = await fileTransferRepository.getTransferByKey(key);

      if (!transfer) {
        return res.status(404).json({
          success: false,
          error: `File transfer not found or expired. Files are automatically deleted 24 hours after upload.`
        });
      }

      const fullPath = storageService.resolveSafeFilePath(transfer.file_path);
      if (!fullPath || !fs.existsSync(fullPath)) {
        return res.status(404).json({
          success: false,
          error: `The requested file was not found on the 1.0 TB storage partition. It may have already been purged.`
        });
      }

      // Increment download counter
      await fileTransferRepository.incrementDownloadCount(transfer.id);

      console.log(`[FileTransfer] File "${transfer.file_name}" downloaded via key "${key}". Total downloads: ${transfer.download_count + 1}`);

      // Stream file with appropriate filename
      res.download(fullPath, transfer.file_name);
    } catch (error) {
      console.error('[FileTransferController] downloadFile error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * List recent active transfers
   */
  async getActiveTransfers(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const transfers = await fileTransferRepository.getActiveTransfers(limit);
      const disk = storageService.getDiskStats();

      res.json({
        success: true,
        count: transfers.length,
        disk,
        data: transfers
      });
    } catch (error) {
      console.error('[FileTransferController] getActiveTransfers error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Delete or cancel an active transfer early
   */
  async deleteTransfer(req, res) {
    try {
      const key = (req.params.key || '').trim();
      const success = await fileTransferRepository.deleteTransferByKey(key);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Transfer key not found.' });
      }

      res.json({
        success: true,
        message: `File transfer with key "${key}" has been permanently purged from server.`
      });
    } catch (error) {
      console.error('[FileTransferController] deleteTransfer error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Trigger immediate cleanup of expired transfers
   */
  async triggerCleanup(req, res) {
    try {
      const purgedCount = await fileTransferRepository.cleanupExpiredTransfers();
      res.json({
        success: true,
        message: `Automatic cleanup completed: ${purgedCount} expired files purged.`,
        purged_count: purgedCount
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new FileTransferController();
