import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserService } from '../../common/current-user.service';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly currentUser: CurrentUserService,
  ) {}

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
