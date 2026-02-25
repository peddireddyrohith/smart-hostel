import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Create reusable transporter ────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for port 465, false for 587 (TLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Base sender helper ─────────────────────────────────────
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const mailOptions = { from: process.env.EMAIL_FROM, to, subject, html, attachments };
  await transporter.sendMail(mailOptions);
};

// ── 1. Welcome Email (on registration) ────────────────────
export const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: '🏠 Welcome to Smart Hostel!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #4F46E5;">Welcome, ${user.name}! 🎉</h2>
        <p>Your account has been successfully created as a <strong>${user.role}</strong>.</p>
        <p>You can now log in to the Smart Hostel portal and manage your stay.</p>
        <br/>
        <p style="color: #888; font-size: 12px;">Smart Hostel Management System</p>
      </div>
    `,
  });
};

// ── 2. Rent Due Reminder ───────────────────────────────────
export const sendRentReminderEmail = async (user, payment) => {
  await sendEmail({
    to: user.email,
    subject: `⚠️ Rent Due — ${payment.monthLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #DC2626;">Rent Reminder</h2>
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>Your rent of <strong>₹${payment.amount}</strong> for <strong>${payment.monthLabel}</strong> is due.</p>
        <p>Please log in to your portal to make the payment.</p>
        <br/>
        <p style="color: #888; font-size: 12px;">Smart Hostel Management System</p>
      </div>
    `,
  });
};

// ── 3. Payment Confirmation ────────────────────────────────
export const sendPaymentConfirmationEmail = async (user, payment) => {
  const monthLabel = `${MONTHS[(payment.month ?? 1) - 1]} ${payment.year}`;

  // Build attachments array — attach the PDF receipt if it exists
  const attachments = [];
  if (payment.receiptFilename) {
    attachments.push({
      filename: payment.receiptFilename,
      path: path.join(__dirname, '..', 'receipts', payment.receiptFilename),
      contentType: 'application/pdf',
    });
  }

  await sendEmail({
    to: user.email,
    subject: `✅ Rent Receipt — ${monthLabel}`,
    attachments,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #16A34A;">Payment Confirmed! ✅</h2>
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>Your rent payment of <strong>₹${payment.amount?.toLocaleString('en-IN')}</strong> for <strong>${monthLabel}</strong> has been received.</p>
        ${attachments.length ? '<p>📎 Your PDF receipt is attached to this email.</p>' : ''}
        <br/>
        <p style="color: #888; font-size: 12px;">Smart Hostel Management System</p>
      </div>
    `,
  });
};

// ── 4. Complaint Status Update ─────────────────────────────
export const sendComplaintUpdateEmail = async (user, complaint) => {
  const statusColors = {
    'in-progress': '#D97706',
    'resolved': '#16A34A',
  };
  const color = statusColors[complaint.status] || '#4F46E5';

  await sendEmail({
    to: user.email,
    subject: `🔔 Complaint Update — "${complaint.title}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: ${color};">Complaint ${complaint.status === 'resolved' ? 'Resolved ✅' : 'In Progress 🔧'}</h2>
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>Your complaint <strong>"${complaint.title}"</strong> has been updated to: 
          <strong style="color: ${color};">${complaint.status.toUpperCase()}</strong>
        </p>
        ${complaint.adminRemarks ? `<p><strong>Admin Remarks:</strong> ${complaint.adminRemarks}</p>` : ''}
        <br/>
        <p style="color: #888; font-size: 12px;">Smart Hostel Management System</p>
      </div>
    `,
  });
};
