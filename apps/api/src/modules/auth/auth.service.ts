import { Injectable } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { PrismaService } from '../../prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Risolve l'utente Postgres corrispondente a un token Firebase verificato.
   * - Se l'uid è già collegato a un utente, lo restituisce.
   * - Altrimenti cerca per email: copre gli utenti demo seedati (senza firebaseUid) che
   *   effettuano il primo accesso reale, collegandoli invece di duplicarli.
   * - Se non esiste nessun utente con quell'email, ne crea uno nuovo (provisioning
   *   "just-in-time"), promuovendolo ad ADMIN se l'email è nella lista ADMIN_EMAILS.
   */
  async resolveUser(decoded: DecodedIdToken): Promise<User> {
    const byUid = await this.prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
    if (byUid) return byUid;

    const email = decoded.email;
    if (!email) {
      throw new Error('Il token Firebase non contiene un indirizzo email verificato.');
    }

    const byEmail = await this.prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: { firebaseUid: decoded.uid },
      });
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const role = adminEmails.includes(email.toLowerCase()) ? 'ADMIN' : 'STUDENT';

    return this.prisma.user.create({
      data: {
        email,
        firebaseUid: decoded.uid,
        fullName: decoded.name ?? email,
        avatarUrl: decoded.picture,
        role,
      },
    });
  }
}
