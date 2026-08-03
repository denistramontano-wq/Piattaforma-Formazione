import { Inject, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import type { StorageProvider } from '../storage/storage.provider';
import { STORAGE_PROVIDER } from '../storage/storage.tokens';

const LOGO_PATH = join(process.cwd(), 'assets', 'logo-atm-mark.png');
const ACCENT_COLOR = '#3366ff';
const INK_COLOR = '#1e293b';
const MUTED_COLOR = '#64748b';

export interface CertificatePdfInput {
  userFullName: string;
  courseTitle: string;
  issuedAt: Date;
  verifyCode: string;
  verifyUrl: string;
}

@Injectable()
export class CertificatePdfService {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  /** Genera il PDF del certificato e lo carica sul provider di storage attivo, restituendo l'URL pubblico. */
  async generateAndStore(input: CertificatePdfInput): Promise<string> {
    const filename = `certificates/${uuid()}.pdf`;
    const qrDataUrl = await QRCode.toDataURL(input.verifyUrl, { margin: 1, width: 200 });

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.draw(doc, input, qrDataUrl);
      doc.end();
    });

    return this.storage.upload({ buffer, filename, mimeType: 'application/pdf' });
  }

  private draw(doc: PDFKit.PDFDocument, input: CertificatePdfInput, qrDataUrl: string): void {
    const { width, height } = doc.page;
    const margin = 28;

    // Cornice decorativa
    doc
      .lineWidth(3)
      .strokeColor(ACCENT_COLOR)
      .rect(margin, margin, width - margin * 2, height - margin * 2)
      .stroke();
    doc
      .lineWidth(0.75)
      .strokeColor(ACCENT_COLOR)
      .rect(margin + 8, margin + 8, width - (margin + 8) * 2, height - (margin + 8) * 2)
      .stroke();

    if (existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, width / 2 - 55, margin + 40, { width: 110 });
    }

    doc
      .fillColor(MUTED_COLOR)
      .fontSize(12)
      .font('Helvetica')
      .text('FORMAZIONE ADL', 0, margin + 100, { align: 'center', characterSpacing: 3 });

    doc
      .fillColor(INK_COLOR)
      .fontSize(30)
      .font('Helvetica-Bold')
      .text('Attestato di completamento', 0, margin + 130, { align: 'center' });

    doc
      .fillColor(MUTED_COLOR)
      .fontSize(13)
      .font('Helvetica')
      .text('Si certifica che', 0, margin + 190, { align: 'center' });

    doc
      .fillColor(ACCENT_COLOR)
      .fontSize(26)
      .font('Helvetica-Bold')
      .text(input.userFullName, 0, margin + 215, { align: 'center' });

    doc
      .fillColor(MUTED_COLOR)
      .fontSize(13)
      .font('Helvetica')
      .text('ha completato con successo il corso', 0, margin + 258, { align: 'center' });

    doc
      .fillColor(INK_COLOR)
      .fontSize(19)
      .font('Helvetica-Bold')
      .text(input.courseTitle, margin + 80, margin + 282, { align: 'center', width: width - (margin + 80) * 2 });

    const issuedLabel = input.issuedAt.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc
      .fillColor(MUTED_COLOR)
      .fontSize(11)
      .font('Helvetica')
      .text(`Rilasciato il ${issuedLabel}`, 0, height - margin - 90, { align: 'center' });

    // QR + codice di verifica in basso a destra
    const qrSize = 64;
    const qrX = width - margin - 30 - qrSize;
    const qrY = height - margin - 30 - qrSize;
    doc.image(qrDataUrl, qrX, qrY, { width: qrSize, height: qrSize });
    doc
      .fillColor(MUTED_COLOR)
      .fontSize(8)
      .font('Helvetica')
      .text('Verifica autenticità', qrX - 40, qrY + qrSize + 4, { width: qrSize + 80, align: 'center' })
      .text(input.verifyCode, qrX - 40, qrY + qrSize + 14, { width: qrSize + 80, align: 'center' });
  }
}
