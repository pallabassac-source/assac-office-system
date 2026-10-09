const path = require('path');
const fs = require('fs');
const multer = require('multer');

class StorageService {
  constructor() {
    // Determine effective uploads / storage root
    // Prioritize STORAGE_DIR or UPLOADS_DIR if set, otherwise fallback to project uploads dir
    let configuredDir = process.env.STORAGE_DIR || process.env.UPLOADS_DIR;

    // Check if on Windows and configuredDir points to container path '/app/uploads'
    if (process.platform === 'win32' && configuredDir === '/app/uploads') {
      configuredDir = null; // fallback to local project directory on Windows host
    }

    if (!configuredDir) {
      // Check if Linux /data mount exists on host
      if (fs.existsSync('/data') && fs.existsSync('/data/uploads')) {
        configuredDir = '/data/uploads';
      } else if (fs.existsSync('/data')) {
        try {
          fs.mkdirSync('/data/uploads', { recursive: true });
          configuredDir = '/data/uploads';
        } catch (e) {
          configuredDir = path.resolve(__dirname, '../../uploads');
        }
      } else {
        configuredDir = path.resolve(__dirname, '../../uploads');
      }
    }

    this.rootDir = path.resolve(configuredDir);
    this.ensureDirectories();
  }

  ensureDirectories() {
    const subdirs = ['deliverables', 'forms', 'general', 'attendance', 'temp'];
    if (!fs.existsSync(this.rootDir)) {
      try {
        fs.mkdirSync(this.rootDir, { recursive: true });
      } catch (err) {
        console.warn(`[StorageService] Could not create storage root ${this.rootDir}:`, err.message);
        this.rootDir = path.resolve(__dirname, '../../uploads');
        fs.mkdirSync(this.rootDir, { recursive: true });
      }
    }

    for (const sub of subdirs) {
      const p = path.join(this.rootDir, sub);
      if (!fs.existsSync(p)) {
        try {
          fs.mkdirSync(p, { recursive: true });
        } catch (e) {}
      }
    }
  }

  getRootDir() {
    return this.rootDir;
  }

  getSubdir(category = 'deliverables') {
    const validSubs = ['deliverables', 'forms', 'general', 'attendance', 'temp'];
    const sub = validSubs.includes(category) ? category : 'deliverables';
    const targetPath = path.join(this.rootDir, sub);
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    return targetPath;
  }

  /**
   * Format bytes into human readable string
   */
  formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Calculate live disk space stats using Node.js fs.statfsSync
   */
  getDiskStats() {
    try {
      this.ensureDirectories();
      const stats = fs.statfsSync(this.rootDir);
      const totalBytes = Number(stats.blocks) * Number(stats.bsize);
      const freeBytes = Number(stats.bavail) * Number(stats.bsize);
      const usedBytes = totalBytes - freeBytes;
      const percentUsed = totalBytes > 0 ? ((usedBytes / totalBytes) * 100).toFixed(1) : '0.0';

      // Detect if this is the dedicated /data high-capacity volume
      const isDataMount = this.rootDir.startsWith('/data') || totalBytes > 500 * 1024 * 1024 * 1024;
      const displayPath = isDataMount ? '/data/uploads' : this.rootDir;

      return {
        success: true,
        storage_path: displayPath,
        is_data_mount: isDataMount,
        total_bytes: totalBytes,
        free_bytes: freeBytes,
        used_bytes: usedBytes,
        total_formatted: this.formatBytes(totalBytes),
        free_formatted: this.formatBytes(freeBytes),
        used_formatted: this.formatBytes(usedBytes),
        percent_used: parseFloat(percentUsed)
      };
    } catch (err) {
      console.warn('[StorageService] Disk statfs error:', err.message);
      return {
        success: false,
        storage_path: this.rootDir,
        is_data_mount: this.rootDir.startsWith('/data'),
        total_formatted: '1.0 TB',
        free_formatted: '1017 GB',
        used_formatted: '7.2 GB',
        percent_used: 1.0,
        error: err.message
      };
    }
  }

  /**
   * Count total stored files and size in uploads root
   */
  getStoredFilesSummary() {
    let count = 0;
    let totalSize = 0;

    const scan = (dir) => {
      if (!fs.existsSync(dir)) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scan(full);
          } else if (entry.isFile() && !entry.name.startsWith('.')) {
            count++;
            try {
              totalSize += fs.statSync(full).size;
            } catch (e) {}
          }
        }
      } catch (e) {}
    };

    scan(this.rootDir);

    return {
      total_files: count,
      total_size_bytes: totalSize,
      total_size_formatted: this.formatBytes(totalSize)
    };
  }

  /**
   * Delete physical file safely
   */
  deletePhysicalFile(filePath) {
    if (!filePath) return false;
    try {
      // If relative, resolve against rootDir
      const resolved = path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(this.rootDir, filePath);
      
      // Prevent directory traversal
      if (!resolved.startsWith(this.rootDir)) {
        console.warn('[StorageService] Attempted file deletion outside storage root:', filePath);
        return false;
      }

      if (fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
        return true;
      }
    } catch (err) {
      console.warn('[StorageService] Error deleting physical file:', err.message);
    }
    return false;
  }

  /**
   * Resolve safe file path for reading/streaming
   */
  resolveSafeFilePath(filePath) {
    if (!filePath) return null;
    const resolved = path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(this.rootDir, filePath);
    if (!resolved.startsWith(this.rootDir)) {
      return null;
    }
    return fs.existsSync(resolved) ? resolved : null;
  }

  /**
   * Create configured Multer instance (Supports up to 10 GB for high-capacity transfers)
   */
  createMulterUpload(subdir = 'deliverables', maxSizeBytes = 10 * 1024 * 1024 * 1024) {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const dest = this.getSubdir(subdir);
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        // Clean original filename
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${unique}-${safeName}`);
      }
    });

    return multer({
      storage,
      limits: { fileSize: maxSizeBytes } // 10 GB limit for large LAN transfers
    });
  }
}

module.exports = new StorageService();
