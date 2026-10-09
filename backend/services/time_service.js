/**
 * ASSAC Server Time Management Service
 * Provides centralized synchronized clock resolution, optional runtime overrides,
 * and time manipulation for testing or administrative simulation.
 * Always resolves to Indian Standard Time (Asia/Kolkata, UTC+05:30).
 */

const TIMEZONE = 'Asia/Kolkata';
let timeOffset = 0; // Milliseconds offset from real system clock

/**
 * Helper to parse a date input string safely into Indian Standard Time (IST).
 * If no timezone offset is explicitly provided, assumes IST (+05:30).
 */
function parseDateInIST(dateInput) {
  if (dateInput instanceof Date) return dateInput;
  let str = String(dateInput).trim();
  if (!str.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str = str.replace(' ', 'T');
    if (!str.includes('T')) str += 'T00:00:00';
    str += '+05:30';
  }
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date format: "${dateInput}". Use YYYY-MM-DD HH:mm:ss`);
  }
  return parsed;
}

/**
 * Get current server Date object, taking any active time offset or environment override into account.
 * As real time advances, the returned date advances identically.
 */
function getServerDate() {
  if (process.env.SERVER_TIME_OVERRIDE && timeOffset === 0) {
    try {
      const fixed = parseDateInIST(process.env.SERVER_TIME_OVERRIDE);
      return fixed;
    } catch {
      // Fall through to real clock
    }
  }
  return new Date(Date.now() + timeOffset);
}

/**
 * Set the server time and date at runtime (e.g. from CLI or API).
 * Parses as IST (+05:30) if no timezone is specified.
 * @param {string|number|Date} dateInput - A parseable date string (e.g. "2026-10-09 11:30:00")
 */
function setServerTime(dateInput) {
  const target = parseDateInIST(dateInput);
  timeOffset = target.getTime() - Date.now();
  return getServerDate();
}

/**
 * Reset server time back to actual host system clock.
 */
function resetServerTime() {
  timeOffset = 0;
  return new Date();
}

/**
 * Returns formatted JSON payload for time synchronization endpoints in Indian Standard Time (IST).
 */
function getTimePayload() {
  const now = getServerDate();
  
  // Format accurately according to Asia/Kolkata (IST)
  const time_12h = now.toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const timestamp_12h = now.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const date_formatted = now.toLocaleDateString('en-US', {
    timeZone: TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Month (1-12) and Year strictly in IST
  const month = parseInt(now.toLocaleDateString('en-US', { timeZone: TIMEZONE, month: 'numeric' }), 10);
  const year = parseInt(now.toLocaleDateString('en-US', { timeZone: TIMEZONE, year: 'numeric' }), 10);

  return {
    success: true,
    timestamp: now.getTime(),
    timestamp_iso: now.toISOString(),
    timestamp_12h,
    time_12h,
    date_formatted,
    month,
    year,
    timezone: TIMEZONE,
    is_overridden: timeOffset !== 0 || !!process.env.SERVER_TIME_OVERRIDE
  };
}

module.exports = {
  TIMEZONE,
  getServerDate,
  setServerTime,
  resetServerTime,
  getTimePayload,
  parseDateInIST
};
