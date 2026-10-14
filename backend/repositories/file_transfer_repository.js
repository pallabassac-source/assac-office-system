const db = require('../db/database');
const storageService = require('../services/storage_service');
const path = require('path');

class FileTransferRepository {
  /**
   * Generate 3 unique digits (e.g. "739", "482", "501")
   * Each digit from 0-9 is distinct.
   */
  generateThreeUniqueDigits() {
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    // Fisher-Yates shuffle
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = digits[i];
      digits[i] = digits[j];
      digits[j] = temp;
    }
    return `${digits[0]}${digits[1]}${digits[2]}`;
  }

  /**
   * Validate that a key string consists of 3 unique numeric characters
   */
  isValidThreeUniqueDigits(key) {
    if (!key || typeof key !== 'string') return false;
    const clean = key.trim();
    if (!/^\d{3}$/.test(clean)) return false;
    const set = new Set(clean.split(''));
    return set.size === 3;
  }

  /**
   * Generate an available key that is not currently in use by any non-expired transfer
   */
  async generateAvailableTransferKey() {
    // Purge expired transfers first to free up slots
    await this.cleanupExpiredTransfers();

    // Try random picks first (there are 720 distinct combinations)
    for (let attempt = 0; attempt < 250; attempt++) {
      const candidate = this.generateThreeUniqueDigits();
      const existing = await db.prepare('SELECT id FROM file_transfers WHERE transfer_key = ?').get(candidate);
      if (!existing) {
        return candidate;
      }
    }

    // Exhaustive search over all 720 combinations if density is high
    const allCombinations = [];
    for (let i = 0; i <= 9; i++) {
      for (let j = 0; j <= 9; j++) {
        if (j === i) continue;
        for (let k = 0; k <= 9; k++) {
          if (k === i || k === j) continue;
          allCombinations.push(`${i}${j}${k}`);
        }
      }
    }

    const activeRows = await db.prepare('SELECT transfer_key FROM file_transfers').all();
    const activeSet = new Set((activeRows || []).map(r => r.transfer_key));
    const available = allCombinations.filter(k => !activeSet.has(k));

    if (available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      return available[randomIndex];
    }

    throw new Error('All 3-digit transfer slots currently in use. Please wait for an existing transfer to complete or expire.');
  }

  /**
   * Purge all files older than 24 hours automatically
   * Deletes physical files from storage volume and removes DB records
   */
  async cleanupExpiredTransfers() {
    try {
      const nowIso = new Date().toISOString();
      // Compare ISO strings (works seamlessly in both SQLite and PostgreSQL)
      const expiredFiles = await db.prepare(
        'SELECT id, transfer_key, file_path, file_name, expires_at FROM file_transfers WHERE expires_at <= ?'
      ).all(nowIso);

      if (expiredFiles && expiredFiles.length > 0) {
        console.log(`[FileTransfer] Automatically purging ${expiredFiles.length} expired 24h file(s)...`);
        for (const item of expiredFiles) {
          try {
            if (item.file_path) {
              storageService.deletePhysicalFile(item.file_path);
            }
            await db.prepare('DELETE FROM file_transfers WHERE id = ?').run(item.id);
            console.log(`[FileTransfer] Purged expired file "${item.file_name}" (Key: ${item.transfer_key})`);
          } catch (delErr) {
            console.warn(`[FileTransfer] Error purging file ${item.transfer_key}:`, delErr.message);
          }
        }
        return expiredFiles.length;
      }
      return 0;
    } catch (err) {
      console.warn('[FileTransfer] Cleanup error:', err.message);
      return 0;
    }
  }

  /**
   * Register a new file transfer with a 24-hour buffer
   */
  async createTransfer({ file_name, stored_filename, file_path, file_size, mime_type, sender_name, sender_id, notes }) {
    await this.cleanupExpiredTransfers();

    const transfer_key = await this.generateAvailableTransferKey();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // exactly 24 hours later

    const insertStmt = db.prepare(`
      INSERT INTO file_transfers (
        transfer_key, file_name, stored_filename, file_path, file_size,
        mime_type, sender_name, sender_id, notes, download_count, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    const result = await insertStmt.run(
      transfer_key,
      file_name,
      stored_filename,
      file_path,
      file_size || 0,
      mime_type || 'application/octet-stream',
      sender_name || 'Staff Member',
      sender_id || null,
      notes || '',
      now.toISOString(),
      expiresAt.toISOString()
    );

    const insertedId = result.lastID;
    return this.getTransferById(insertedId);
  }

  /**
   * Retrieve file transfer by DB ID
   */
  async getTransferById(id) {
    const row = await db.prepare('SELECT * FROM file_transfers WHERE id = ?').get(id);
    if (!row) return null;
    return this.enrichTransferRecord(row);
  }

  /**
   * Retrieve file transfer by 3 unique digit key
   */
  async getTransferByKey(key) {
    if (!key) return null;
    const cleanKey = String(key).trim();
    
    // Check if expired & clean up
    await this.cleanupExpiredTransfers();

    const row = await db.prepare('SELECT * FROM file_transfers WHERE transfer_key = ?').get(cleanKey);
    if (!row) return null;

    // Double check expiry
    const now = new Date();
    const exp = new Date(row.expires_at);
    if (now > exp) {
      // Purge immediately
      if (row.file_path) {
        storageService.deletePhysicalFile(row.file_path);
      }
      await db.prepare('DELETE FROM file_transfers WHERE id = ?').run(row.id);
      return null;
    }

    return this.enrichTransferRecord(row);
  }

  /**
   * Increment download count for a transfer
   */
  async incrementDownloadCount(id) {
    try {
      await db.prepare('UPDATE file_transfers SET download_count = download_count + 1 WHERE id = ?').run(id);
    } catch (err) {
      console.warn('[FileTransfer] incrementDownloadCount error:', err.message);
    }
  }

  /**
   * Delete transfer by key (revocation / manual cancel)
   */
  async deleteTransferByKey(key) {
    const row = await db.prepare('SELECT * FROM file_transfers WHERE transfer_key = ?').get(key);
    if (!row) return false;

    if (row.file_path) {
      storageService.deletePhysicalFile(row.file_path);
    }
    const res = await db.prepare('DELETE FROM file_transfers WHERE id = ?').run(row.id);
    return res.changes > 0;
  }

  /**
   * Get active non-expired transfers (for session view or admin monitoring)
   */
  async getActiveTransfers(limit = 20) {
    await this.cleanupExpiredTransfers();
    const rows = await db.prepare(`
      SELECT * FROM file_transfers 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);

    return (rows || []).map(r => this.enrichTransferRecord(r));
  }

  /**
   * Helper to format human readable fields, remaining buffer time, and expiry info
   */
  enrichTransferRecord(row) {
    if (!row) return null;

    const now = new Date();
    const expiresAt = new Date(row.expires_at);
    const createdAt = new Date(row.created_at);
    
    const diffMs = Math.max(0, expiresAt.getTime() - now.getTime());
    const totalRemainingSeconds = Math.floor(diffMs / 1000);
    const remainingHours = Math.floor(totalRemainingSeconds / 3600);
    const remainingMinutes = Math.floor((totalRemainingSeconds % 3600) / 60);

    // Percentage of 24h retention elapsed
    const totalWindowMs = 24 * 60 * 60 * 1000;
    const elapsedMs = Math.max(0, now.getTime() - createdAt.getTime());
    const percentRemaining = Math.max(0, Math.min(100, Math.round((diffMs / totalWindowMs) * 100)));

    return {
      id: row.id,
      transfer_key: row.transfer_key,
      file_name: row.file_name,
      stored_filename: row.stored_filename,
      file_path: row.file_path,
      file_size: row.file_size,
      file_size_formatted: storageService.formatBytes(row.file_size),
      mime_type: row.mime_type,
      sender_name: row.sender_name || 'Staff Member',
      sender_id: row.sender_id,
      notes: row.notes || '',
      download_count: row.download_count || 0,
      created_at: row.created_at,
      expires_at: row.expires_at,
      remaining_seconds: totalRemainingSeconds,
      remaining_hours: remainingHours,
      remaining_minutes: remainingMinutes,
      percent_remaining: percentRemaining,
      time_remaining_formatted: `${remainingHours}h ${remainingMinutes}m`,
      is_expired: totalRemainingSeconds <= 0
    };
  }
}

module.exports = new FileTransferRepository();
