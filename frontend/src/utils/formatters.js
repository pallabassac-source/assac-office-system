/**
 * Formatting utilities for ASSAC Attendance & Intranet System
 */

/**
 * Converts 24-hour time string (e.g., "09:15:00", "09:15", "17:30:00", "17:30", "14:05")
 * into 12-hour AM/PM format (e.g., "09:15 AM", "05:30 PM").
 * Returns '--:--' for invalid, empty, or '00:00' times.
 */
export function formatTime12Hour(timeStr) {
  if (!timeStr || timeStr === '00:00' || timeStr === '00:00:00' || timeStr === '0' || timeStr === '--:--') {
    return '--:--';
  }
  const str = String(timeStr).trim();
  
  // If already contains AM or PM, return as is
  if (/am|pm/i.test(str)) {
    return str;
  }

  const parts = str.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12

    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    return `${hStr}:${mStr} ${ampm}`;
  }
  return timeStr;
}

/**
 * Formats a Date object or ISO timestamp string to 12-hour locale time string (e.g. "06:02:12 PM" or "06:02 PM")
 */
export function formatTimestamp12Hour(timestampStr, includeSeconds = true) {
  if (!timestampStr) return '';
  const dt = new Date(timestampStr);
  if (isNaN(dt.getTime())) return timestampStr;

  const options = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  if (includeSeconds) {
    options.second = '2-digit';
  }
  return dt.toLocaleTimeString([], options);
}

/**
 * Formats a Date object or ISO timestamp string to full Date & 12-hour Time string (e.g. "8/31/2026, 06:02:12 PM")
 */
export function formatDateTime12Hour(timestampStr) {
  if (!timestampStr) return '';
  const dt = new Date(timestampStr);
  if (isNaN(dt.getTime())) return timestampStr;

  return dt.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}
