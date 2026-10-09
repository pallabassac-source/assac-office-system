/**
 * ASSAC Server Time Management Service
 * Provides centralized synchronized clock resolution, optional runtime overrides,
 * and time manipulation for testing or administrative simulation.
 */

let timeOffset = 0; // Milliseconds offset from real system clock

/**
 * Get current server Date object, taking any active time offset or environment override into account.
 * As real time advances, the returned date advances identically.
 */
function getServerDate() {
  if (process.env.SERVER_TIME_OVERRIDE && timeOffset === 0) {
    const fixed = new Date(process.env.SERVER_TIME_OVERRIDE);
    if (!isNaN(fixed.getTime())) {
      return fixed;
    }
  }
  return new Date(Date.now() + timeOffset);
}

/**
 * Set the server time and date at runtime (e.g. from CLI or API).
 * @param {string|number|Date} dateInput - A parseable date string (e.g. "2026-10-09 11:30:00" or "2026-05-01")
 */
function setServerTime(dateInput) {
  const target = new Date(dateInput);
  if (isNaN(target.getTime())) {
    throw new Error(`Invalid date format: "${dateInput}". Use YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss`);
  }
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
 * Returns formatted JSON payload for time synchronization endpoints.
 */
function getTimePayload() {
  const now = getServerDate();
  return {
    success: true,
    timestamp: now.getTime(),
    timestamp_iso: now.toISOString(),
    timestamp_12h: now.toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    time_12h: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    date_formatted: now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    is_overridden: timeOffset !== 0 || !!process.env.SERVER_TIME_OVERRIDE
  };
}

module.exports = {
  getServerDate,
  setServerTime,
  resetServerTime,
  getTimePayload
};
