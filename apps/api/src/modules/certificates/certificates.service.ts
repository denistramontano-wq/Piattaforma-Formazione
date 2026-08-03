import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';
import { CertificatePdfService } from './certificate-pdf.service';
import type { Certificate } from '@prisma/client';

function generateVerifyCode(): string {
  // Alfabeto senza caratteri ambigui (0/O, 1/I/L) — pensato per essere ricopiato a mano dal PDF stampato.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(10);
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
    private readonly pdf: CertificatePdfService,
  ) {}

  /**
   * Rilascia (o restituisce, se già emesso) il certificato per un corso completato.
   * Idempotente: chiamata più volte per lo stesso utente/corso non duplica il certificato.
   */
  async issueForCourseCompletion(userId: string, courseId: string): Promise<Certificate> {
    const existing = await this.prisma.certificate.findFirst({ where: { userId, courseId } });
    if (existing) return existing;

    const [user, course] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.course.findUniqueOrThrow({ where: { id: courseId } }),
    ]);

    const verifyCode = generateVerifyCode();
    const issuedAt = new Date();
    const verifyBaseUrl = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').replace(/\/$/, '');
    const verifyUrl = `${verifyBaseUrl}/certificates/verify/${verifyCode}`;

    const pdfUrl = await this.pdf.generateAndStore({
      userFullName: user.fullName,
      courseTitle: course.title,
      issuedAt,
      verifyCode,
      verifyUrl,
    });

    return this.prisma.certificate.create({
      data: { userId, courseId, verifyCode, pdfUrl, issuedAt },
    });
  }

  async myCertificates() {
    const user = await this.currentUser.getCurrentUser();
    return this.prisma.certificate.findMany({
      where: { userId: user.id },
      include: { course: { select: { title: true, slug: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async verify(code: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verifyCode: code },
      include: { course: { select: { title: true } }, user: { select: { fullName: true } } },
    });
    if (!certificate) throw new NotFoundException('Certificato non trovato o non valido');
    return {
      valid: true,
      courseTitle: certificate.course.title,
      userName: certificate.user.fullName,
      issuedAt: certificate.issuedAt,
    };
  }
}
