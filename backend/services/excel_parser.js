const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MONTH_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

function extractMonthYearFromText(text) {
  if (!text) return null;
  const str = String(text).trim();

  // Pattern 1: "01-05-2026 To 31-05-2026" or "20/08/2026 to 19/09/2026"
  const rangeMatch = str.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})\s*(?:to|-)\s*(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/i);
  if (rangeMatch) {
    let m = parseInt(rangeMatch[2], 10);
    let y = parseInt(rangeMatch[3], 10);
    if (y < 100) y += 2000;
    if (m >= 1 && m <= 12) {
      return {
        month: m,
        year: y,
        period_from: `${rangeMatch[1]}-${rangeMatch[2]}-${rangeMatch[3]}`,
        period_to: `${rangeMatch[4]}-${rangeMatch[5]}-${rangeMatch[6]}`,
        label: `${MONTH_NAMES[m]} ${y}`,
        source: 'date_range'
      };
    }
  }

  // Pattern 2: "May, 2026" or "August 2026" or "Dec 2024" or "December'2024"
  const nameMatch = str.match(/(january|february|march|april|may|june|july|august|september|sept|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)[\s',_-]+(\d{4}|\d{2})/i);
  if (nameMatch) {
    const mName = nameMatch[1].toLowerCase();
    const m = MONTH_MAP[mName];
    let y = parseInt(nameMatch[2], 10);
    if (y < 100) y += 2000;
    if (m && y) {
      return {
        month: m,
        year: y,
        label: `${MONTH_NAMES[m]} ${y}`,
        source: 'month_name'
      };
    }
  }

  // Pattern 3: "05-2026" or "08/2026" or "2026-05"
  const numMatch = str.match(/(?:^|[^\d])(\d{1,2})[-\/](\d{4})(?:$|[^\d])/);
  if (numMatch) {
    const m = parseInt(numMatch[1], 10);
    const y = parseInt(numMatch[2], 10);
    if (m >= 1 && m <= 12 && y >= 2020 && y <= 2040) {
      return {
        month: m,
        year: y,
        label: `${MONTH_NAMES[m]} ${y}`,
        source: 'numeric_month_year'
      };
    }
  }

  return null;
}

function fractionToHHMM(val) {
  if (val === null || val === undefined || val === '' || val === 0 || val === '0' || val === '00:00:00') {
    return '00:00';
  }
  if (typeof val === 'number') {
    if (val <= 0) return '00:00';
    const totalSeconds = Math.round(val * 24 * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const str = String(val).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return str;
}

function parseMinutes(timeStr) {
  if (!timeStr || timeStr === '00:00' || timeStr === '0') return 0;
  const parts = String(timeStr).split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return 0;
}

function formatMinsToHHMM(totalMins) {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function sanitizeNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  let vStr = String(v).trim();
  if (vStr.endsWith('.0')) vStr = vStr.slice(0, -2);
  const num = parseInt(vStr, 10);
  return isNaN(num) ? 0 : num;
}

function getDateForDayNum(dayNum, periodFromStr, periodToStr, defaultMonth, defaultYear) {
  try {
    const startParts = (periodFromStr || '').split('-');
    const endParts = (periodToStr || '').split('-');
    if (startParts.length === 3 && endParts.length === 3) {
      const sDay = parseInt(startParts[0], 10);
      const sMonth = parseInt(startParts[1], 10);
      const sYear = parseInt(startParts[2], 10);

      const eDay = parseInt(endParts[0], 10);
      const eMonth = parseInt(endParts[1], 10);
      const eYear = parseInt(endParts[2], 10);

      if (sMonth === eMonth) {
        return new Date(sYear, sMonth - 1, dayNum);
      }
      if (dayNum >= sDay) {
        return new Date(sYear, sMonth - 1, dayNum);
      } else if (dayNum <= eDay) {
        return new Date(eYear, eMonth - 1, dayNum);
      }
    }
  } catch (e) {}

  try {
    return new Date(defaultYear || 2026, (defaultMonth || 5) - 1, dayNum);
  } catch (e) {
    return null;
  }
}

/**
 * Format 1: Biometric Machine Monthly Performance Report
 * (e.g. MnPerformance May, 2026as.xls with EmpCode, summary row, day scale, punch sub-rows)
 */
function tryParseBiometricFormat(wb, originalFilename = '') {
  const reportMeta = {
    org: 'Assam State Space Application Centre',
    report_name: 'Monthly Performance Report',
    period_from: '',
    period_to: '',
    month: null,
    year: null,
    print_date: '',
    detected_period_label: '',
    detected_source: ''
  };

  // 1. Try extracting month/year from original filename or sheet names
  const fromFilename = extractMonthYearFromText(originalFilename);
  if (fromFilename) {
    reportMeta.month = fromFilename.month;
    reportMeta.year = fromFilename.year;
    reportMeta.detected_period_label = fromFilename.label;
    reportMeta.detected_source = `File Name (${originalFilename})`;
  }

  for (const sName of wb.SheetNames) {
    const fromSheet = extractMonthYearFromText(sName);
    if (fromSheet && !reportMeta.month) {
      reportMeta.month = fromSheet.month;
      reportMeta.year = fromSheet.year;
      reportMeta.detected_period_label = fromSheet.label;
      reportMeta.detected_source = `Sheet Name (${sName})`;
    }
  }

  const employees = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows || rows.length === 0) continue;

    let currBranch = 'General';
    let currDept = 'General';
    let currDesig = 'Staff';

    for (let r = 0; r < rows.length; r++) {
      const rowVals = rows[r];
      const rowStr = rowVals.map(v => String(v)).filter(v => v.trim()).join(' ');

      // Extract Header Metadata
      if (rowStr.includes('Report Date From')) {
        for (const v of rowVals) {
          const vs = String(v);
          if (vs.includes('Report Date From')) {
            const parts = vs.split(/Report Date From\s*:/i);
            if (parts.length > 1) {
              const dates = parts[1].split(/To\s*:/i);
              if (dates.length === 2) {
                reportMeta.period_from = dates[0].trim();
                reportMeta.period_to = dates[1].trim();
                const sParts = reportMeta.period_from.split('-');
                const eParts = reportMeta.period_to.split('-');
                if (sParts.length === 3 && eParts.length === 3) {
                  const sMonth = parseInt(sParts[1], 10);
                  const sYear = parseInt(sParts[2], 10);
                  const eMonth = parseInt(eParts[1], 10);
                  const eYear = parseInt(eParts[2], 10);
                  
                  reportMeta.month = sMonth;
                  reportMeta.year = sYear;
                  
                  if (sMonth !== eMonth) {
                    reportMeta.detected_period_label = `${MONTH_NAMES[sMonth]}-${MONTH_NAMES[eMonth]} ${sYear} (${reportMeta.period_from} to ${reportMeta.period_to})`;
                  } else {
                    reportMeta.detected_period_label = `${MONTH_NAMES[sMonth]} ${sYear} (${reportMeta.period_from} to ${reportMeta.period_to})`;
                  }
                  reportMeta.detected_source = 'Report Date Header';
                }
              }
            }
          }
          if (vs.includes('Monthly Performance Report')) {
            reportMeta.report_name = 'Monthly Performance Report';
          }
          if (vs.includes('Print Date')) {
            reportMeta.print_date = vs.replace('Print Date', '').trim();
          }
        }
      }

      // If month still unresolved, try scanning cell text
      if (!reportMeta.month) {
        const fromRowText = extractMonthYearFromText(rowStr);
        if (fromRowText) {
          reportMeta.month = fromRowText.month;
          reportMeta.year = fromRowText.year;
          reportMeta.detected_period_label = fromRowText.label;
          reportMeta.detected_source = 'Header Cell';
        }
      }

      if (rowStr.includes('Company Name :')) {
        for (const v of rowVals) {
          const vs = String(v);
          if (vs.includes('Company Name :')) {
            reportMeta.org = vs.split('Company Name :')[1].trim();
          }
        }
      }

      if (rowStr.includes('Branch :')) {
        for (const v of rowVals) {
          const vs = String(v);
          if (vs.includes('Branch :')) {
            currBranch = vs.split('Branch :')[1].trim();
          }
        }
      }

      if (rowStr.includes('Department') && rowStr.includes(':')) {
        for (const v of rowVals) {
          const vs = String(v);
          if (vs.includes('Department') && vs.includes(':')) {
            currDept = vs.split(':')[1].trim();
          }
          if (vs.includes('Desig :')) {
            currDesig = vs.split('Desig :')[1].trim();
          }
        }
      }

      // Detect Employee Block Header
      if (rowStr.includes('EmpCode') && rowStr.includes('Name')) {
        const summaryRowIdx = r + 1;
        if (summaryRowIdx < rows.length) {
          const sumRow = rows[summaryRowIdx];
          let empCode = String(sumRow[1] || '').trim();
          if (empCode.endsWith('.0')) empCode = empCode.slice(0, -2);
          let empName = String(sumRow[3] || '').trim();

          if (empCode && empName) {
            let present = sumRow.length > 15 ? String(sumRow[15]).trim() : '0';
            let hl = sumRow.length > 17 ? String(sumRow[17]).trim() : '0';
            let wo = sumRow.length > 19 ? String(sumRow[19]).trim() : '0';
            let absent = sumRow.length > 21 ? String(sumRow[21]).trim() : '0';
            let leave = sumRow.length > 24 ? String(sumRow[24]).trim() : '0';
            let paidDays = sumRow.length > 27 ? String(sumRow[27]).trim() : '0';
            let lateHrs = sumRow.length > 31 ? String(sumRow[31]).trim() : '00:00';
            let workHrs = sumRow.length > 34 ? String(sumRow[34]).trim() : '00:00';
            let overtime = sumRow.length > 37 ? String(sumRow[37]).trim() : '00:00';

            const daysRowIdx = r + 2;
            let dailyRecords = [];

            if (daysRowIdx < rows.length) {
              const dRow = rows[daysRowIdx];
              const dayCols = [];
              dRow.forEach((val, cIdx) => {
                let vStr = String(val).trim();
                if (vStr.endsWith('.0')) vStr = vStr.slice(0, -2);
                const n = parseInt(vStr, 10);
                if (!isNaN(n) && n >= 1 && n <= 31) {
                  dayCols.push({ dayNum: n, colIdx: cIdx });
                }
              });

              // Accurate Date Mapping across Cycle (e.g. 20-08-2026 to 19-09-2026)
              const sParts = (reportMeta.period_from || '').split('-');
              const eParts = (reportMeta.period_to || '').split('-');
              let sDay = 1, sMonth = reportMeta.month || 5, sYear = reportMeta.year || 2026;
              let eDay = 31, eMonth = reportMeta.month || 5, eYear = reportMeta.year || 2026;
              if (sParts.length === 3 && eParts.length === 3) {
                sDay = parseInt(sParts[0], 10);
                sMonth = parseInt(sParts[1], 10);
                sYear = parseInt(sParts[2], 10);
                eDay = parseInt(eParts[0], 10);
                eMonth = parseInt(eParts[1], 10);
                eYear = parseInt(eParts[2], 10);
              }

              let hasRolledOver = false;
              let prevDay = -1;

              const dayMapping = dayCols.map(({ dayNum, colIdx }) => {
                if (prevDay !== -1 && dayNum < prevDay) {
                  hasRolledOver = true;
                }
                prevDay = dayNum;

                let dtMonth = sMonth;
                let dtYear = sYear;

                if (sMonth !== eMonth || sYear !== eYear) {
                  if (hasRolledOver || (sDay > eDay && dayNum <= eDay)) {
                    dtMonth = eMonth;
                    dtYear = eYear;
                  } else {
                    dtMonth = sMonth;
                    dtYear = sYear;
                  }
                }

                const dateStr = `${dtYear}-${String(dtMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                return { dayNum, colIdx, dateStr, dtMonth, dtYear };
              });

              // Extract sub-rows for punches
              const punchSubRows = {};
              for (let subR = r + 3; subR < Math.min(r + 10, rows.length); subR++) {
                const subVals = rows[subR];
                const subStr = subVals.map(v => String(v)).filter(v => v.trim()).join(' ');

                let rowType = null;
                if (/Arrived\s*TI?me/i.test(subStr)) rowType = 'arrival';
                else if (/Dept\.?\s*Time/i.test(subStr)) rowType = 'departure';
                else if (/Working\s*Hrs/i.test(subStr)) rowType = 'work_hrs';
                else if (/O\.?Times?\s*Hrs/i.test(subStr)) rowType = 'overtime';
                else if (/Status/i.test(subStr)) rowType = 'status';
                else if (/Shift/i.test(subStr)) rowType = 'shift';

                if (rowType) {
                  punchSubRows[rowType] = subVals;
                }
              }

              dailyRecords = dayMapping.map(m => {
                const getVal = (rowType) => {
                  const arr = punchSubRows[rowType];
                  if (!arr || m.colIdx >= arr.length) return '';
                  let cVal = String(arr[m.colIdx] || '').trim();
                  if (cVal.endsWith('.0')) cVal = cVal.slice(0, -2);
                  return cVal;
                };

                const dayRecord = {
                  day_num: m.dayNum,
                  date: m.dateStr,
                  month: m.dtMonth,
                  year: m.dtYear,
                  arrival: getVal('arrival') || '00:00',
                  departure: getVal('departure') || '00:00',
                  work_hrs: getVal('work_hrs') || '00:00',
                  overtime: getVal('overtime') || '00:00',
                  status: getVal('status') || 'A',
                  shift: getVal('shift') || ''
                };

                // 2nd & 4th Saturday holiday check using actual date
                const dt = new Date(m.dtYear, m.dtMonth - 1, m.dayNum);
                if (dt.getDay() === 6) { // Saturday
                  const occurrence = Math.floor((dt.getDate() - 1) / 7) + 1;
                  const hasNoPunch = (!dayRecord.arrival || dayRecord.arrival === '00:00' || dayRecord.arrival === '00:00:00') &&
                                     (!dayRecord.departure || dayRecord.departure === '00:00' || dayRecord.departure === '00:00:00');
                  if (hasNoPunch && (occurrence === 2 || occurrence === 4) && ['A', '', '0', '0.0'].includes(dayRecord.status)) {
                    dayRecord.status = 'HL';
                  }
                }

                return dayRecord;
              });
            }

            employees.push({
              emp_code: empCode,
              name: empName,
              branch: currBranch,
              department: currDept,
              designation: currDesig,
              summary: {
                present: sanitizeNum(present),
                holiday: sanitizeNum(hl),
                weekly_off: sanitizeNum(wo),
                absent: sanitizeNum(absent),
                leave: sanitizeNum(leave),
                paid_days: sanitizeNum(paidDays),
                late_hours: lateHrs || '00:00',
                work_hours: workHrs || '00:00',
                overtime: overtime || '00:00'
              },
              daily: dailyRecords
            });
          }
        }
      }
    }
  }

  if (employees.length > 0) {
    return {
      meta: reportMeta,
      total_employees: employees.length,
      employees: employees
    };
  }
  return null;
}

/**
 * Format 2: Matrix Attendance Register
 * (e.g. ASSAC Attendance Dec'2024 to January 2025.xlsx with Date row and 3-row employee blocks)
 */
function tryParseMatrixFormat(wb, originalFilename = '') {
  const reportMeta = {
    org: 'Assam State Space Application Centre',
    report_name: 'Monthly Attendance Register',
    period_from: '',
    period_to: '',
    month: null,
    year: null,
    print_date: '',
    detected_period_label: '',
    detected_source: ''
  };

  // 1. Try extracting month/year from original filename or sheet names
  const fromFilename = extractMonthYearFromText(originalFilename);
  if (fromFilename) {
    reportMeta.month = fromFilename.month;
    reportMeta.year = fromFilename.year;
    reportMeta.detected_period_label = fromFilename.label;
    reportMeta.detected_source = `File Name (${originalFilename})`;
  }

  for (const sName of wb.SheetNames) {
    const fromSheet = extractMonthYearFromText(sName);
    if (fromSheet && !reportMeta.month) {
      reportMeta.month = fromSheet.month;
      reportMeta.year = fromSheet.year;
      reportMeta.detected_period_label = fromSheet.label;
      reportMeta.detected_source = `Sheet Name (${sName})`;
    }
  }

  const employees = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows || rows.length < 3) continue;

    // Check row 0 for title / period
    const row0Str = (rows[0] || []).map(v => String(v)).join(' ');
    const fromRow0 = extractMonthYearFromText(row0Str);
    if (fromRow0) {
      if (fromRow0.period_from) reportMeta.period_from = fromRow0.period_from;
      if (fromRow0.period_to) reportMeta.period_to = fromRow0.period_to;
      reportMeta.month = fromRow0.month;
      reportMeta.year = fromRow0.year;
      reportMeta.detected_period_label = fromRow0.label;
      reportMeta.detected_source = 'Title Row';
    }

    // Find date header row (row starting with "Date")
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const firstCell = String(rows[r][0] || '').trim().toLowerCase();
      if (firstCell === 'date') {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) continue;

    const headerRow = rows[headerRowIdx];
    const dayCols = [];

    // Map columns to day numbers
    for (let c = 1; c < headerRow.length; c++) {
      const cellVal = headerRow[c];
      if (cellVal === '' || cellVal === null || cellVal === undefined) continue;

      let dayNum = null;
      let monthNum = reportMeta.month || 5;
      let yearNum = reportMeta.year || 2026;

      if (typeof cellVal === 'number') {
        if (cellVal >= 1 && cellVal <= 31) {
          dayNum = cellVal;
        } else {
          const parsed = XLSX.SSF.parse_date_code(cellVal);
          if (parsed) {
            dayNum = parsed.d;
            monthNum = parsed.m;
            yearNum = parsed.y;
          }
        }
      } else if (typeof cellVal === 'string') {
        const dMatch = cellVal.match(/(\d{1,2})/);
        if (dMatch) {
          dayNum = parseInt(dMatch[1], 10);
        }
      }

      if (dayNum !== null && dayNum >= 1 && dayNum <= 31) {
        dayCols.push({ colIdx: c, dayNum, monthNum, yearNum });
      }
    }

    if (dayCols.length === 0) continue;

    if (!reportMeta.month && dayCols.length > 0) {
      reportMeta.month = dayCols[0].monthNum;
      reportMeta.year = dayCols[0].yearNum;
      reportMeta.detected_period_label = `${MONTH_NAMES[reportMeta.month]} ${reportMeta.year}`;
      reportMeta.detected_source = 'Date Column Header';
    }

    // Map day columns with accurate cycle dates
    const sParts = (reportMeta.period_from || '').split('-');
    const eParts = (reportMeta.period_to || '').split('-');
    let sDay = 1, sMonth = reportMeta.month || 5, sYear = reportMeta.year || 2026;
    let eDay = 31, eMonth = reportMeta.month || 5, eYear = reportMeta.year || 2026;
    if (sParts.length === 3 && eParts.length === 3) {
      sDay = parseInt(sParts[0], 10);
      sMonth = parseInt(sParts[1], 10);
      sYear = parseInt(sParts[2], 10);
      eDay = parseInt(eParts[0], 10);
      eMonth = parseInt(eParts[1], 10);
      eYear = parseInt(eParts[2], 10);
    }

    let hasRolledOver = false;
    let prevDay = -1;

    const dayMapping = dayCols.map(col => {
      if (prevDay !== -1 && col.dayNum < prevDay) {
        hasRolledOver = true;
      }
      prevDay = col.dayNum;

      let dtMonth = col.monthNum || sMonth;
      let dtYear = col.yearNum || sYear;

      if (sMonth !== eMonth || sYear !== eYear) {
        if (hasRolledOver || (sDay > eDay && col.dayNum <= eDay)) {
          dtMonth = eMonth;
          dtYear = eYear;
        } else {
          dtMonth = sMonth;
          dtYear = sYear;
        }
      }

      const dateStr = `${dtYear}-${String(dtMonth).padStart(2, '0')}-${String(col.dayNum).padStart(2, '0')}`;
      return {
        ...col,
        dateStr,
        dtMonth,
        dtYear
      };
    });

    // Process employee row blocks
    let r = headerRowIdx + 1;
    let empIndex = 1;

    while (r < rows.length) {
      const statusRow = rows[r] || [];
      const empName = String(statusRow[0] || '').trim();

      if (empName && !/^(prepared\s*by|a\.?o\.?|assac|total|signature|date)/i.test(empName)) {
        const arrivalRow = (r + 1 < rows.length) ? rows[r + 1] : [];
        const departureRow = (r + 2 < rows.length) ? rows[r + 2] : [];

        let presentCount = 0;
        let absentCount = 0;
        let holidayCount = 0;
        let weeklyOffCount = 0;
        let leaveCount = 0;
        let totalWorkMins = 0;
        let totalOtMins = 0;
        let totalLateMins = 0;

        const dailyRecords = [];

        dayMapping.forEach(m => {
          let statusVal = m.colIdx < statusRow.length ? String(statusRow[m.colIdx] || '').trim().toUpperCase() : '';
          let arrVal = m.colIdx < arrivalRow.length ? fractionToHHMM(arrivalRow[m.colIdx]) : '00:00';
          let depVal = m.colIdx < departureRow.length ? fractionToHHMM(departureRow[m.colIdx]) : '00:00';

          if (!statusVal) {
            statusVal = (arrVal !== '00:00' || depVal !== '00:00') ? 'P' : 'A';
          }

          let workHrs = '00:00';
          let overtime = '00:00';
          if (arrVal !== '00:00' && depVal !== '00:00') {
            const arrMins = parseMinutes(arrVal);
            const depMins = parseMinutes(depVal);
            if (depMins > arrMins) {
              const diff = depMins - arrMins;
              workHrs = formatMinsToHHMM(diff);
              totalWorkMins += diff;
              if (diff > 480) {
                const ot = diff - 480;
                overtime = formatMinsToHHMM(ot);
                totalOtMins += ot;
              }
            }
          }

          if (statusVal === 'P') presentCount++;
          else if (statusVal === 'A') absentCount++;
          else if (statusVal === 'WO') weeklyOffCount++;
          else if (['HL', 'RH'].includes(statusVal)) holidayCount++;
          else if (['EL', 'CL', 'ML', 'OD', 'LEAVE'].includes(statusVal)) leaveCount++;
          else {
            if (arrVal !== '00:00' || depVal !== '00:00') presentCount++;
            else absentCount++;
          }

          dailyRecords.push({
            day_num: m.dayNum,
            date: m.dateStr,
            month: m.dtMonth,
            year: m.dtYear,
            arrival: arrVal,
            departure: depVal,
            work_hrs: workHrs,
            overtime: overtime,
            status: statusVal,
            shift: ''
          });
        });

        const paidDays = presentCount + holidayCount + weeklyOffCount + leaveCount;
        const empCode = String(100 + empIndex);

        employees.push({
          emp_code: empCode,
          name: empName,
          branch: 'General',
          department: 'General',
          designation: 'Staff',
          summary: {
            present: presentCount,
            holiday: holidayCount,
            weekly_off: weeklyOffCount,
            absent: absentCount,
            leave: leaveCount,
            paid_days: paidDays,
            late_hours: formatMinsToHHMM(totalLateMins),
            work_hours: formatMinsToHHMM(totalWorkMins),
            overtime: formatMinsToHHMM(totalOtMins)
          },
          daily: dailyRecords
        });

        empIndex++;
        r += 3;
      } else {
        r += 1;
      }
    }
  }

  if (employees.length > 0) {
    // Default fallback if month/year still unset
    if (!reportMeta.month) {
      reportMeta.month = 5;
      reportMeta.year = 2026;
      reportMeta.detected_period_label = 'May 2026 (Default)';
    }
    return {
      meta: reportMeta,
      total_employees: employees.length,
      employees: employees
    };
  }
  return null;
}

/**
 * Pure JavaScript Excel Attendance Parser
 * Parses a monthly Excel attendance report (.xls, .xlsx) natively in Node.js.
 * @param {string} filePath - Absolute path to uploaded .xls/.xlsx file
 * @param {string} originalFilename - Original filename of uploaded document
 * @returns {Promise<Object>} Object containing report metadata and employee list
 */
async function parseExcelAttendance(filePath, originalFilename = '') {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`File not found: ${filePath}`));
      }

      const wb = XLSX.readFile(filePath, { cellDates: false, raw: true });

      const biometricResult = tryParseBiometricFormat(wb, originalFilename);
      if (biometricResult && biometricResult.employees && biometricResult.employees.length > 0) {
        return resolve(biometricResult);
      }

      const matrixResult = tryParseMatrixFormat(wb, originalFilename);
      if (matrixResult && matrixResult.employees && matrixResult.employees.length > 0) {
        return resolve(matrixResult);
      }

      return reject(new Error('Unrecognized attendance spreadsheet format. Please upload standard biometric performance report or monthly attendance matrix.'));
    } catch (err) {
      return reject(new Error(`Excel Parsing Error: ${err.message}`));
    }
  });
}

module.exports = {
  parseExcelAttendance
};
