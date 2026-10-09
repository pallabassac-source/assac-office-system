const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const attendanceRepository = require('../repositories/attendance_repository');
const timeService = require('./time_service');

function formatTime12Hour(timeStr) {
  if (!timeStr || timeStr === '00:00' || timeStr === '00:00:00' || timeStr === '0') return '';
  const str = String(timeStr).trim();
  if (/am|pm/i.test(str)) return str;
  const parts = str.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    return `${hStr}:${mStr} ${ampm}`;
  }
  return timeStr;
}

class ExportService {
  /**
   * Export Monthly Attendance Register matching expected ASSAC format (.xlsx)
   * with soft pastel status styling and compact cell dimensions.
   */
  async generateMonthlyExcel(month = null, year = null, department = null) {
    const serverNow = timeService.getServerDate();
    month = month || (serverNow.getMonth() + 1);
    year = year || serverNow.getFullYear();
    const matrixResult = await attendanceRepository.getDetailedAttendanceMatrix(month, year, department);
    const employees = matrixResult.employees || [];
    const periodInfo = matrixResult.period || {};
    const daysInMonth = new Date(year, month, 0).getDate(); // e.g. 31 days

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ASSAC Attendance System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('ASSAC');

    const monthStr = String(month).padStart(2, '0');
    const periodFrom = `01-${monthStr}-${year}`;
    const periodTo = `${daysInMonth}-${monthStr}-${year}`;
    const reportPeriodText = periodInfo.report_period || `${periodFrom} to ${periodTo}`;

    // Soft pastel fill palette for attendance statuses
    const statusStyles = {
      P: { fgColor: 'E6F4EA', color: '137333' },     // Soft Green
      A: { fgColor: 'FCE8E6', color: 'C5221F' },     // Soft Red
      WO: { fgColor: 'EEF2FF', color: '3730A3' },    // Soft Lavender/Indigo
      HL: { fgColor: 'FEF3C7', color: '92400E' },    // Soft Yellow/Amber
      RH: { fgColor: 'FEF3C7', color: '92400E' },    // Soft Yellow/Amber
      CL: { fgColor: 'E0F2FE', color: '075985' },    // Soft Cyan/Blue
      EL: { fgColor: 'E0F2FE', color: '075985' },    // Soft Cyan/Blue
      OD: { fgColor: 'F3E8FF', color: '6B21A8' },    // Soft Purple
      Leave: { fgColor: 'E0F2FE', color: '075985' }
    };

    // Title Row (Row 1)
    const titleRow = sheet.getRow(1);
    titleRow.height = 22;
    const titleCell = titleRow.getCell(1);
    titleCell.value = `Attendance Report of ASSAC from  ${reportPeriodText}`;
    titleCell.font = { name: 'Calibri', size: 11, bold: true };

    // Date Header Row (Row 2) - Compact height
    const headerRow = sheet.getRow(2);
    headerRow.height = 18;

    const colDateCell = headerRow.getCell(1);
    colDateCell.value = 'Date';
    colDateCell.font = { name: 'Calibri', size: 8, bold: true };
    colDateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    colDateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    colDateCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    const dateCols = (periodInfo.dates && periodInfo.dates.length > 0)
      ? periodInfo.dates.map(dStr => {
          const parts = dStr.split('-');
          return {
            key: dStr,
            dayNum: parseInt(parts[2], 10),
            label: `${parts[2]}/${parts[1]}`
          };
        })
      : Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayStr = String(day).padStart(2, '0');
          return {
            key: `${year}-${monthStr}-${dayStr}`,
            dayNum: day,
            label: `${dayStr}/${monthStr}`
          };
        });

    dateCols.forEach((col, idx) => {
      const colIdx = idx + 2; // Col B is Day 1
      const cell = headerRow.getCell(colIdx);
      cell.value = col.label;
      cell.font = { name: 'Calibri', size: 7.5, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    let currentRow = 3;

    employees.forEach(emp => {
      // 1. Status Row (Row 1 of Employee Block)
      const rStatus = sheet.getRow(currentRow);
      rStatus.height = 14;

      const nameCell = rStatus.getCell(1);
      nameCell.value = emp.name ? emp.name.toUpperCase() : `EMP ${emp.emp_code}`;
      nameCell.font = { name: 'Calibri', size: 8, bold: true };
      nameCell.alignment = { vertical: 'middle', horizontal: 'left' };
      nameCell.border = { top: { style: 'thin' }, left: { style: 'thin' } };

      dateCols.forEach((col, idx) => {
        const colIdx = idx + 2;
        const cell = rStatus.getCell(colIdx);
        const dayRecord = emp.dailyMap ? (emp.dailyMap[col.key] || emp.dailyMap[col.dayNum]) : null;
        const statusCode = dayRecord ? (dayRecord.status || 'P') : 'A';
        cell.value = statusCode;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' } };
        if (colIdx === dateCols.length + 1) {
          cell.border.right = { style: 'thin' };
        }

        // Apply soft background color & contrasting font color
        const style = statusStyles[statusCode] || statusStyles.P;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fgColor } };
        cell.font = { name: 'Calibri', size: 7.5, bold: true, color: { argb: style.color } };
      });

      // 2. Arrival Row (Row 2 of Employee Block)
      const rArrival = sheet.getRow(currentRow + 1);
      rArrival.height = 13;

      const arrCol1 = rArrival.getCell(1);
      arrCol1.value = '';
      arrCol1.border = { left: { style: 'thin' } };

      dateCols.forEach((col, idx) => {
        const colIdx = idx + 2;
        const cell = rArrival.getCell(colIdx);
        const dayRecord = emp.dailyMap ? (emp.dailyMap[col.key] || emp.dailyMap[col.dayNum]) : null;
        const arrTime = (dayRecord && dayRecord.arrival_time && dayRecord.arrival_time !== '00:00:00')
          ? formatTime12Hour(dayRecord.arrival_time)
          : '';
        cell.value = arrTime;
        cell.font = { name: 'Calibri', size: 7, color: { argb: '475569' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (colIdx === dateCols.length + 1) {
          cell.border = { right: { style: 'thin' } };
        }
      });

      // 3. Departure Row (Row 3 of Employee Block)
      const rDeparture = sheet.getRow(currentRow + 2);
      rDeparture.height = 13;

      const depCol1 = rDeparture.getCell(1);
      depCol1.value = '';
      depCol1.border = { bottom: { style: 'thin' }, left: { style: 'thin' } };

      dateCols.forEach((col, idx) => {
        const colIdx = idx + 2;
        const cell = rDeparture.getCell(colIdx);
        const dayRecord = emp.dailyMap ? (emp.dailyMap[col.key] || emp.dailyMap[col.dayNum]) : null;
        const depTime = (dayRecord && dayRecord.departure_time && dayRecord.departure_time !== '00:00:00')
          ? formatTime12Hour(dayRecord.departure_time)
          : '';
        cell.value = depTime;
        cell.font = { name: 'Calibri', size: 7, color: { argb: '475569' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { bottom: { style: 'thin' } };
        if (colIdx === dateCols.length + 1) {
          cell.border.right = { style: 'thin' };
        }
      });

      currentRow += 3;
    });

    // Signature Footer Block
    currentRow += 2;
    const rSign1 = sheet.getRow(currentRow);
    const cellAO = rSign1.getCell(Math.min(27, dateCols.length + 1));
    cellAO.value = 'A.O';
    cellAO.font = { name: 'Calibri', size: 9, bold: true };

    currentRow += 1;
    const rSign2 = sheet.getRow(currentRow);
    const cellPrep = rSign2.getCell(3); // Column C
    cellPrep.value = 'Prepared By';
    cellPrep.font = { name: 'Calibri', size: 9, bold: true };

    const cellASSAC = rSign2.getCell(Math.min(27, dateCols.length + 1));
    cellASSAC.value = 'ASSAC';
    cellASSAC.font = { name: 'Calibri', size: 9, bold: true };

    // Compact Column Widths
    sheet.columns = [
      { width: 24 }, // Col A Employee Name
      ...Array(dateCols.length).fill({ width: 5.5 }) // Compact day columns B to end
    ];

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Export Configurable PDF Summary Report
   */
  async generateMonthlyPDF(month = null, year = null, department = null, options = {}) {
    const serverNow = timeService.getServerDate();
    month = month || (serverNow.getMonth() + 1);
    year = year || serverNow.getFullYear();
    const {
      includeStats = true,
      includeWorkHours = true,
      includeOvertime = true,
      includeLateHours = true
    } = options;

    const records = await attendanceRepository.getRecords({ month, year, department, limit: 1000, offset: 0 });
    const stats = await attendanceRepository.getDashboardStats(month, year, department);
    const availablePeriods = await attendanceRepository.getAvailablePeriods();
    const currentPeriod = availablePeriods.find(p => p.month === Number(month) && p.year === Number(year));
    const periodLabel = (currentPeriod && currentPeriod.report_period) ? currentPeriod.report_period : `${month}/${year}`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Document Title & Subtitle
      doc.fillColor('#1e293b').fontSize(16).text(`Monthly Attendance Executive Summary - ${periodLabel}`, { align: 'center' });
      doc.fontSize(9).fillColor('#64748b').text(`Department: ${department || 'All Departments'}   |   Generated: ${new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}`, { align: 'center' });
      doc.moveDown(0.8);

      let currentY = 60;

      // Optional Top Summary Stats Bar
      if (includeStats) {
        doc.rect(30, currentY, 780, 36).fillAndStroke('#f8fafc', '#cbd5e1');
        
        let statText = `Total Staff: ${stats.total_employees}   |   Present: ${stats.total_present}   |   Absent: ${stats.total_absent}`;
        if (includeWorkHours) statText += `   |   Work Hrs: ${stats.total_work_hours}`;
        if (includeOvertime) statText += `   |   Overtime: ${stats.total_overtime}`;
        if (includeLateHours) statText += `   |   Late Hrs: ${stats.total_late_hours}`;

        doc.fillColor('#334155').fontSize(9).text(statText, 40, currentY + 12);
        currentY += 46;
      } else {
        currentY += 20;
      }

      // Table Header Setup
      doc.fillColor('#4f46e5').fontSize(9);
      doc.text('Code', 30, currentY);
      doc.text('Employee Name', 80, currentY);
      doc.text('Department', 240, currentY);
      doc.text('Designation', 360, currentY);
      doc.text('Present', 470, currentY);
      doc.text('Absent', 520, currentY);
      doc.text('Paid Days', 570, currentY);

      let colX = 640;
      if (includeWorkHours) {
        doc.text('Work Hrs', colX, currentY);
        colX += 60;
      }
      if (includeOvertime) {
        doc.text('Overtime', colX, currentY);
        colX += 60;
      }
      if (includeLateHours) {
        doc.text('Late Hrs', colX, currentY);
      }

      doc.moveTo(30, currentY + 14).lineTo(810, currentY + 14).stroke('#cbd5e1');
      currentY += 20;

      // Table Rows
      doc.fillColor('#1e293b').fontSize(8);
      records.forEach((r) => {
        if (currentY > 530) {
          doc.addPage({ layout: 'landscape', margin: 30 });
          currentY = 40;
        }

        doc.text(r.emp_code, 30, currentY);
        doc.text(r.name.substring(0, 26), 80, currentY);
        doc.text((r.department || 'N/A').substring(0, 20), 240, currentY);
        doc.text((r.designation || 'N/A').substring(0, 20), 360, currentY);
        doc.text(String(r.present_days || 0), 470, currentY);
        doc.text(String(r.absent_days || 0), 520, currentY);
        doc.text(String(r.paid_days || 0), 570, currentY);

        let rowColX = 640;
        if (includeWorkHours) {
          doc.text(r.total_work_hours || '00:00', rowColX, currentY);
          rowColX += 60;
        }
        if (includeOvertime) {
          doc.text(r.overtime_hours || '00:00', rowColX, currentY);
          rowColX += 60;
        }
        if (includeLateHours) {
          doc.text(r.late_hours || '00:00', rowColX, currentY);
        }

        currentY += 16;
      });

      doc.end();
    });
  }

  /**
   * Generate Official High-Resolution E-Certificate PDF for Student Intern
   */
  async generateInternCertificatePDF(intern) {
    return new Promise((resolve, reject) => {
      // Landscape A4 (841.89 x 595.28 points)
      const doc = new PDFDocument({
        margin: 0,
        size: 'A4',
        layout: 'landscape'
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const width = 841.89;
      const height = 595.28;

      // 1. Background Fill (Soft Ivory / Slate Light)
      doc.rect(0, 0, width, height).fill('#fafbfe');

      // 2. Decorative Double Border Frame
      // Outer Navy Frame
      doc.rect(20, 20, width - 40, height - 40)
         .lineWidth(4)
         .stroke('#1e3a8a');

      // Inner Gold Accent Border
      doc.rect(26, 26, width - 52, height - 52)
         .lineWidth(1.5)
         .stroke('#d97706');

      // Subtle Corner Accents (Gold Rectangles)
      const cornerSize = 14;
      doc.rect(26, 26, cornerSize, cornerSize).fill('#1e3a8a');
      doc.rect(width - 26 - cornerSize, 26, cornerSize, cornerSize).fill('#1e3a8a');
      doc.rect(26, height - 26 - cornerSize, cornerSize, cornerSize).fill('#1e3a8a');
      doc.rect(width - 26 - cornerSize, height - 26 - cornerSize, cornerSize, cornerSize).fill('#1e3a8a');

      // 3. Official Center Header & Crest
      let currentY = 45;

      doc.fillColor('#1e3a8a')
         .font('Helvetica-Bold')
         .fontSize(20)
         .text('ASSAM STATE SPACE APPLICATION CENTRE', 50, currentY, { align: 'center', width: width - 100 });

      currentY += 22;
      doc.fillColor('#475569')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('SCIENCE, TECHNOLOGY & CLIMATE CHANGE DEPARTMENT • GOVERNMENT OF ASSAM', 50, currentY, { align: 'center', width: width - 100 });

      currentY += 14;
      doc.fillColor('#64748b')
         .font('Helvetica')
         .fontSize(8.5)
         .text('Guwahati, Assam - 781024 • Intranet Research & Internship Management Portal', 50, currentY, { align: 'center', width: width - 100 });

      // Header Divider Line
      currentY += 16;
      doc.moveTo(180, currentY).lineTo(width - 180, currentY).lineWidth(1).stroke('#cbd5e1');

      // 4. Certificate Ribbon / Title
      currentY += 14;
      doc.rect((width - 360) / 2, currentY - 4, 360, 26).fill('#1e3a8a');
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('CERTIFICATE OF INTERNSHIP COMPLETION', 50, currentY + 3, { align: 'center', width: width - 100 });

      // Certificate Identification Serial
      currentY += 32;
      const certYear = new Date(intern.certificate_date || Date.now()).getFullYear();
      const certNo = `ASSAC/IMS/CERT/${intern.intern_code || 'INT'}/${certYear}`;
      doc.fillColor('#64748b')
         .font('Helvetica-Bold')
         .fontSize(8.5)
         .text(`Certificate No: ${certNo}   |   Student Roll ID: ${intern.intern_code || 'N/A'}`, 50, currentY, { align: 'center', width: width - 100 });

      // 5. Main Recipient Body Text
      currentY += 20;
      doc.fillColor('#334155')
         .font('Helvetica')
         .fontSize(11)
         .text('This is to certify that', 50, currentY, { align: 'center', width: width - 100 });

      // Recipient Name
      currentY += 18;
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(18)
         .text(intern.name || 'Student Name', 50, currentY, { align: 'center', width: width - 100 });

      // University & Degree
      currentY += 24;
      const degreeText = `from ${intern.university || 'Affiliated University'} (${intern.degree || 'Degree Program'})`;
      doc.fillColor('#475569')
         .font('Helvetica-Bold')
         .fontSize(10.5)
         .text(degreeText, 50, currentY, { align: 'center', width: width - 100 });

      // Body Paragraph
      currentY += 18;
      const duration = intern.duration_months ? `${intern.duration_months} Months` : '6 Months';
      const joining = intern.joining_date || '2026-01-01';
      const bodyPara = `has successfully completed the official research internship in the Department of ${intern.department || 'GIS & Remote Sensing'} for a duration of ${duration} (commencing from ${joining}).`;
      
      doc.fillColor('#334155')
         .font('Helvetica')
         .fontSize(10)
         .text(bodyPara, 100, currentY, { align: 'center', width: width - 200, lineGap: 3 });

      // Project Title Highlight
      currentY += 28;
      doc.fillColor('#1e3a8a')
         .font('Helvetica-Bold')
         .fontSize(10.5)
         .text('Research Project Scope & Title:', 50, currentY, { align: 'center', width: width - 100 });

      currentY += 14;
      doc.rect(120, currentY - 2, width - 240, 24).fill('#f1f5f9');
      doc.fillColor('#0f172a')
         .font('Helvetica-Oblique')
         .fontSize(10)
         .text(`"${intern.project_title || 'Assigned Research Topic Scope'}"`, 130, currentY + 4, { align: 'center', width: width - 260 });

      // Supervisor & Performance
      currentY += 30;
      const perfText = `Supervised by: ${intern.mentor || 'Assigned Scientist'}  •  Biometric Attendance Record: ${intern.attendance_rate || 100}%  •  Evaluation: Outstanding`;
      doc.fillColor('#475569')
         .font('Helvetica')
         .fontSize(9)
         .text(perfText, 50, currentY, { align: 'center', width: width - 100 });

      // 6. Signatures and Verification Footer
      currentY = height - 105;

      // Left: Date of Issue & Seal
      const issueDate = intern.certificate_date || new Date().toISOString().split('T')[0];
      doc.fillColor('#334155')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text(`Date of Issue: ${issueDate}`, 80, currentY);
      doc.fillColor('#64748b')
         .font('Helvetica')
         .fontSize(7.5)
         .text('Digitally Issued by ASSAC Office Administration', 80, currentY + 12);
      doc.text('Verification: assac.internal/verify', 80, currentY + 22);

      // Center: Official Digital Seal Badge
      const sealX = width / 2;
      doc.circle(sealX, currentY + 12, 24).lineWidth(1.5).stroke('#1e3a8a');
      doc.circle(sealX, currentY + 12, 21).lineWidth(0.8).stroke('#d97706');
      doc.fillColor('#1e3a8a')
         .font('Helvetica-Bold')
         .fontSize(6)
         .text('ASSAC', sealX - 20, currentY + 2, { align: 'center', width: 40 });
      doc.fontSize(5.5)
         .text('GOVT OF ASSAM', sealX - 20, currentY + 11, { align: 'center', width: 40 });
      doc.fontSize(5)
         .text('OFFICIAL SEAL', sealX - 20, currentY + 19, { align: 'center', width: 40 });

      // Right: Authorized Signatures
      const signX = width - 260;
      doc.moveTo(signX, currentY + 10).lineTo(signX + 180, currentY + 10).lineWidth(1).stroke('#475569');
      
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('Administrative Officer / Director', signX, currentY + 15, { align: 'center', width: 180 });

      doc.fillColor('#64748b')
         .font('Helvetica')
         .fontSize(7.5)
         .text('Assam State Space Application Centre (ASSAC)', signX, currentY + 26, { align: 'center', width: 180 });

      doc.end();
    });
  }
}

module.exports = new ExportService();

