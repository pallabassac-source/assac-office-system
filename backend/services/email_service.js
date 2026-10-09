const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransporter({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false
          }
        });
        console.log(`[EmailService] SMTP Transport initialized for host: ${host}:${port} (${user})`);
      } catch (err) {
        console.error('[EmailService] Failed to initialize SMTP transporter:', err.message);
        this.transporter = null;
      }
    } else {
      console.log('[EmailService] SMTP credentials not set in environment. Running in Dev/Mock logging mode.');
      this.transporter = null;
    }
  }

  isConfigured() {
    return !!this.transporter;
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      host: process.env.SMTP_HOST || 'Not configured',
      port: process.env.SMTP_PORT || '587',
      from: process.env.SMTP_FROM || 'noreply@assac.gov.in',
      user: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : 'None'
    };
  }

  async sendEmail({ to, subject, html, text, attachments = [] }) {
    const from = process.env.SMTP_FROM || '"ASSAC Operations Portal" <noreply@assac.gov.in>';
    
    if (this.transporter) {
      try {
        const mailOptions = {
          from,
          to,
          subject,
          text: text || '',
          html: html || text
        };

        if (Array.isArray(attachments) && attachments.length > 0) {
          mailOptions.attachments = attachments;
        }

        const info = await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email sent successfully to ${to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error(`[EmailService] Error dispatching email to ${to}:`, error.message);
        return { success: false, error: error.message };
      }
    } else {
      // Mock / Offline mode
      console.log(`[EmailService Mock] ========================================`);
      console.log(`[EmailService Mock] To: ${to}`);
      console.log(`[EmailService Mock] Subject: ${subject}`);
      if (attachments && attachments.length > 0) {
        console.log(`[EmailService Mock] Attachments: ${attachments.map(a => a.filename).join(', ')} (${attachments.length} files)`);
      }
      console.log(`[EmailService Mock] Content:\n${text || html}`);
      console.log(`[EmailService Mock] ========================================`);
      return { success: true, mock: true, message: 'Email logged in mock mode (SMTP credentials pending)' };
    }
  }

  /**
   * Send Official E-Certificate Softcopy PDF to Intern Scholar
   */
  async sendInternCertificateEmail({ to, name, internCode, department, projectTitle, certDate, pdfBuffer }) {
    if (!to) return { success: false, error: 'Recipient email required' };

    const issueDateStr = certDate || new Date().toISOString().split('T')[0];
    const subject = `Official Internship Completion Certificate - ${name} (${internCode}) - ASSAC`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: #1e3a8a; padding: 24px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">ASSAM STATE SPACE APPLICATION CENTRE (ASSAC)</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #93c5fd;">Science, Technology & Climate Change Department • Government of Assam</p>
        </div>
        
        <div style="padding: 26px; color: #1e293b; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="display: inline-block; background: #ecfdf5; border: 1px solid #6ee7b7; color: #047857; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
              ✓ Internship Successfully Completed & Verified
            </span>
          </div>

          <p style="font-size: 15px; font-weight: bold;">Dear ${name},</p>
          <p style="font-size: 13px; color: #334155;">
            Congratulations! On behalf of the <strong>Assam State Space Application Centre (ASSAC)</strong>, we are pleased to issue your official <strong>Internship & Research Scholarship Completion E-Certificate</strong>.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 12px; font-size: 13px; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
              Certificate Summary
            </h4>
            <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
              <tr><td style="padding: 5px 0; font-weight: bold; width: 35%;">Student Name:</td><td style="font-weight: bold; color: #0f172a;">${name}</td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">Student / Intern ID:</td><td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${internCode}</td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">Department:</td><td>${department}</td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">Research Topic:</td><td style="font-style: italic;">"${projectTitle || 'Assigned Scope'}"</td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">Date of Issuance:</td><td>${issueDateStr}</td></tr>
            </table>
          </div>

          <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 14px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e3a8a;">
              📎 A digitally signed PDF Softcopy of your E-Certificate is attached to this email.
            </p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">
              You can also download this softcopy anytime directly by logging into your student intranet workspace.
            </p>
          </div>

          <p style="font-size: 12px; color: #64748b;">
            We appreciate your contributions towards geospatial and remote sensing research at ASSAC and wish you the very best in your academic and professional career.
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <strong>Office of the Administrative Officer / Director</strong><br/>
          Assam State Space Application Centre (ASSAC), Guwahati • Govt. of Assam<br/>
          This is an official digital communication.
        </div>
      </div>
    `;

    const text = `
Dear ${name},

Congratulations!
Your official Internship Completion Certificate has been issued by Assam State Space Application Centre (ASSAC).

Student ID: ${internCode}
Department: ${department}
Research Scope: "${projectTitle || 'Assigned Scope'}"
Date of Issue: ${issueDateStr}

Your official digital e-certificate softcopy is attached to this email as a PDF.
You may also view and download it at any time from your Student Portal.

Administrative Officer / Director
Assam State Space Application Centre (ASSAC)
    `;

    const attachments = [];
    if (pdfBuffer) {
      attachments.push({
        filename: `ASSAC_Completion_Certificate_${internCode}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    return this.sendEmail({ to, subject, html, text, attachments });
  }

  /**
   * Send Welcome & Login Credentials Email to newly onboarded Intern
   */
  async sendInternWelcomeEmail({ to, name, internCode, username, password, mentor, department, projectTitle }) {
    if (!to) return { success: false, error: 'Recipient email required' };

    const subject = `Welcome to ASSAC Intern Portal - Your Access Credentials (${internCode})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: #1e3a8a; padding: 24px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">ASSAM STATE SPACE APPLICATION CENTRE</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #93c5fd;">Internship & Research Scholar Portal</p>
        </div>
        
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
          <p style="font-size: 15px; font-weight: bold;">Dear ${name},</p>
          <p style="font-size: 13px; color: #475569;">
            Welcome to the <strong>Assam State Space Application Centre (ASSAC)</strong>. Your official intern onboarding registration has been completed by the IMS Administration.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 12px; font-size: 13px; color: #0f172a; text-transform: uppercase;">Official Internship Details</h4>
            <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; font-weight: bold; width: 40%;">Student / Intern ID:</td><td>${internCode}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Department:</td><td>${department}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Assigned Mentor:</td><td>${mentor}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Project Title:</td><td>${projectTitle || 'To be assigned by Mentor'}</td></tr>
            </table>
          </div>

          <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 12px; font-size: 13px; color: #3730a3; text-transform: uppercase;">Portal Login Credentials</h4>
            <table style="width: 100%; font-size: 13px; color: #1e1b4b; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; font-weight: bold; width: 40%;">Portal Username / ID:</td><td style="font-family: monospace; font-weight: bold;">${username || internCode}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Initial Password:</td><td style="font-family: monospace; font-weight: bold; color: #4338ca;">${password}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Role:</td><td>Intern / Research Scholar</td></tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #64748b;">
            Please log into the intranet portal to view your research project scope, track attendance clearances, upload project deliverables, and access your completion certificates.
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Assam State Space Application Centre (ASSAC) • Science & Technology Dept, Govt. of Assam<br/>
          This is an automated governance message. Please do not reply to this email.
        </div>
      </div>
    `;

    const text = `
Dear ${name},

Welcome to Assam State Space Application Centre (ASSAC).
Your intern onboarding has been registered.

Student ID: ${internCode}
Department: ${department}
Assigned Mentor: ${mentor}
Project Title: ${projectTitle || 'Assigned Scope'}

Your Portal Login Credentials:
Username: ${username || internCode}
Password: ${password}
Role: Intern

You can log in to view project milestones, attendance, and certificates.

ASSAC Administration
    `;

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Send Welcome & Login Credentials Email to newly created Employee
   */
  async sendEmployeeWelcomeEmail({ to, name, empCode, username, password, department, designation }) {
    if (!to) return { success: false, error: 'Recipient email required' };

    const subject = `Welcome to ASSAC Operations Portal - Official Account Created (${empCode})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: #1e3a8a; padding: 24px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">ASSAM STATE SPACE APPLICATION CENTRE</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #93c5fd;">Staff Operations & Attendance Portal</p>
        </div>
        
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
          <p style="font-size: 15px; font-weight: bold;">Dear ${name},</p>
          <p style="font-size: 13px; color: #475569;">
            Your employee staff profile and portal access have been created by the Office Administration.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 12px; font-size: 13px; color: #0f172a; text-transform: uppercase;">Official Staff Profile</h4>
            <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; font-weight: bold; width: 40%;">Employee Code:</td><td>${empCode}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Designation:</td><td>${designation || 'Staff'}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Department:</td><td>${department || 'General'}</td></tr>
            </table>
          </div>

          <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 12px; font-size: 13px; color: #3730a3; text-transform: uppercase;">Portal Login Credentials</h4>
            <table style="width: 100%; font-size: 13px; color: #1e1b4b; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; font-weight: bold; width: 40%;">Portal Username / ID:</td><td style="font-family: monospace; font-weight: bold;">${username || empCode}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Initial Password:</td><td style="font-family: monospace; font-weight: bold; color: #4338ca;">${password}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Role:</td><td>Employee</td></tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #64748b;">
            Please log into the intranet portal to access employee forms, formats, and view attendance records.
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Assam State Space Application Centre (ASSAC) • Science & Technology Dept, Govt. of Assam<br/>
          This is an automated governance message.
        </div>
      </div>
    `;

    const text = `
Dear ${name},

Your employee profile and access credentials have been created at ASSAC.

Employee Code: ${empCode}
Designation: ${designation}
Department: ${department}

Portal Credentials:
Username: ${username || empCode}
Password: ${password}
Role: Employee

ASSAC Office Administration
    `;

    return this.sendEmail({ to, subject, html, text });
  }
}

module.exports = new EmailService();
