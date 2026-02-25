import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure receipts directory exists
const receiptsDir = path.join(__dirname, '..', 'receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// ── Generate PDF Rent Receipt ──────────────────────────────
export const generateRentReceipt = (user, room, payment) => {
  return new Promise((resolve, reject) => {
    const filename = `receipt_${user._id}_${payment.month}_${payment.year}.pdf`;
    const filePath = path.join(receiptsDir, filename);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // ── Header ─────────────────────────────────────────────
    doc
      .fontSize(24)
      .fillColor('#4F46E5')
      .text('Smart Hostel', { align: 'center' })
      .fontSize(12)
      .fillColor('#555')
      .text('PG Management System', { align: 'center' })
      .moveDown(0.5);

    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .strokeColor('#4F46E5')
      .stroke()
      .moveDown(0.5);

    // ── Title ──────────────────────────────────────────────
    doc
      .fontSize(18)
      .fillColor('#111')
      .text('RENT RECEIPT', { align: 'center' })
      .moveDown(1);

    // ── Tenant Details ─────────────────────────────────────
    doc
      .fontSize(12)
      .fillColor('#333')
      .text(`Receipt No  : REC-${payment._id.toString().slice(-6).toUpperCase()}`)
      .text(`Date        : ${new Date(payment.paidAt).toLocaleDateString('en-IN')}`)
      .moveDown(0.5);

    doc
      .text(`Tenant Name : ${user.name}`)
      .text(`Email       : ${user.email}`)
      .text(`Room No     : ${room.roomNumber} (${room.type})`)
      .text(`Floor       : ${room.floor}`)
      .moveDown(0.5);

    // ── Payment Details ────────────────────────────────────
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .strokeColor('#ccc')
      .stroke()
      .moveDown(0.5);

    doc
      .fontSize(14)
      .fillColor('#4F46E5')
      .text('Payment Details')
      .moveDown(0.3);

    doc
      .fontSize(12)
      .fillColor('#333')
      .text(`Month       : ${payment.monthLabel}`)
      .text(`Amount Paid : ₹${payment.amount}`)
      .text(`Payment ID  : ${payment.cashfreePaymentId || 'N/A'}`)
      .text(`Status      : PAID ✓`)
      .moveDown(1);

    // ── Footer ──────────────────────────────────────────────
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .strokeColor('#4F46E5')
      .stroke()
      .moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor('#888')
      .text('This is a computer-generated receipt and does not require a signature.', {
        align: 'center',
      })
      .text('Thank you for your payment!', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
};
